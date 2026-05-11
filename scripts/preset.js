/**
 * GuitarFB - 预设系统模块 (Phase 1)
 * Version: 1.0.0
 * 
 * 功能：
 * - 自动保存/恢复最后操作状态 (localStorage)
 * - 命名预设 CRUD (localStorage)
 * - 安全导入/导出（含 JSON 注入防护）
 * - 旧版 JSON 向后兼容
 */
(function(G) {
    'use strict';

    // ============================================
    // 常量
    // ============================================
    const STORE = {
        AUTOSAVE: 'guitarfb_autosave',
        INDEX: 'guitarfb_preset_index',
        PREFIX: 'guitarfb_preset_'
    };
    const MAX_PRESETS = 20;
    const MAX_ANNOTATIONS = 500;

    // ============================================
    // 🔒 JSON 安全校验工具
    // ============================================

    /** 白名单：exportData() 输出的合法字段及其期望类型 */
    const ALLOWED_FIELDS = {
        annotations: 'array',
        currentTemplate: 'object|null',
        tuningConfig: 'object',
        boardTitle: 'string',
        keySelect: 'string',
        scaleSelect: 'string',
        chordFamilySelect: 'string',
        chordDegreeSelect: 'string',
        manualText: 'string',
        manualBg: 'string',
        manualTextColor: 'string',
        bpm: 'number',
        beatPerBar: 'number',
        rhythmDiv: 'number',
        accent: 'boolean',
        timerActive: 'boolean',
        timerMinutes: 'number',
        theme: 'string'
    };

    /** 注解字段白名单 */
    const ALLOWED_ANNOTATION_FIELDS = {
        text: 'string',
        stringIdx: 'number',
        fret: 'number',
        bgColor: 'string',
        textColor: 'string',
        isTemplate: 'boolean',
        type: 'string'
    };

    /** 调音字符串字段白名单 */
    const ALLOWED_TUNING_FIELDS = {
        name: 'string',
        strings: 'array'
    };

    /** 调音单弦字段白名单 */
    const ALLOWED_STRING_FIELDS = {
        openNote: 'string',
        midi: 'number'
    };

    /**
     * 净化字符串：剥离 HTML 标签防止 XSS
     */
    function sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/<[^>]*>/g, '')      // 去标签
                  .replace(/[<>]/g, '');         // 补漏
    }

    /**
     * 校验值类型是否匹配期望类型描述
     */
    function checkType(value, expectedType) {
        // 处理联合类型 "object|null"
        if (expectedType.includes('|')) {
            return expectedType.split('|').some(t => checkType(value, t));
        }
        if (expectedType === 'array') return Array.isArray(value);
        if (expectedType === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
        if (expectedType === 'null') return value === null;
        return typeof value === expectedType;
    }

    /**
     * 🔒 核心安全校验：白名单过滤 + 类型检查 + XSS 净化
     * 返回 { valid: boolean, data: object|null, errors: string[] }
     */
    function validateImportedData(raw) {
        const errors = [];

        // 第 1 层：必须是对象
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return { valid: false, data: null, errors: ['根数据必须是一个对象'] };
        }

        const result = {};

        // 第 2 层：白名单字段过滤 + 类型校验
        for (const [key, expectedType] of Object.entries(ALLOWED_FIELDS)) {
            if (!(key in raw)) continue; // 可选字段，缺失不报错

            const value = raw[key];

            if (!checkType(value, expectedType)) {
                errors.push(`字段 "${key}" 类型不匹配：期望 ${expectedType}，实际 ${typeof value}`);
                continue;
            }

            // 按类型深度处理
            if (key === 'annotations' && Array.isArray(value)) {
                if (value.length > MAX_ANNOTATIONS) {
                    errors.push(`annotations 数量超出限制 (${value.length} > ${MAX_ANNOTATIONS})，已截断`);
                }
                result.annotations = value.slice(0, MAX_ANNOTATIONS).map(ann => {
                    const clean = {};
                    for (const [ak, at] of Object.entries(ALLOWED_ANNOTATION_FIELDS)) {
                        if (ak in ann && checkType(ann[ak], at)) {
                            clean[ak] = at === 'string' ? sanitizeString(ann[ak]) : ann[ak];
                        }
                    }
                    return clean;
                });
            } else if (key === 'tuningConfig' && value && typeof value === 'object') {
                const tc = {};
                if (typeof value.name === 'string') tc.name = sanitizeString(value.name);
                if (Array.isArray(value.strings)) {
                    tc.strings = value.strings.map(s => {
                        if (typeof s === 'string') return sanitizeString(s);
                        if (s && typeof s === 'object') {
                            const cleanStr = {};
                            for (const [sk, st] of Object.entries(ALLOWED_STRING_FIELDS)) {
                                if (sk in s && checkType(s[sk], st)) {
                                    cleanStr[sk] = st === 'string' ? sanitizeString(s[sk]) : s[sk];
                                }
                            }
                            return cleanStr;
                        }
                        return s;
                    });
                }
                result[key] = tc;
            } else if (key === 'currentTemplate') {
                // currentTemplate 可以是对象或 null，无需深度净化
                result[key] = value;
            } else if (expectedType === 'string') {
                result[key] = sanitizeString(value);
            } else {
                result[key] = value;
            }
        }

        return { valid: errors.length === 0, data: result, errors };
    }

    /**
     * 生成短 ID (8 位随机 hex)
     */
    function generateId() {
        return Math.random().toString(16).slice(2, 10);
    }

    // ============================================
    // PresetManager 类
    // ============================================

    class PresetManager {
        /**
         * @param {Object} controller - FretboardController 实例
         * @param {Object} DOM - DOM 元素缓存对象
         */
        constructor(controller, DOM) {
            this.controller = controller;
            this.DOM = DOM;

            // 检测 localStorage 可用性
            this._storageOk = false;
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                this._storageOk = true;
            } catch(e) {
                console.warn('[Preset] localStorage 不可用，自动保存/预设功能将降级');
            }
        }

        // ——— 存储工具 ———

        _getItem(key) {
            if (!this._storageOk) return null;
            try { return localStorage.getItem(key); } catch(e) { return null; }
        }

        _setItem(key, value) {
            if (!this._storageOk) return false;
            try { localStorage.setItem(key, value); return true; } catch(e) { return false; }
        }

        _removeItem(key) {
            if (!this._storageOk) return;
            try { localStorage.removeItem(key); } catch(e) { /* ignore */ }
        }

        // ============================================
        // ① 自动保存 / 恢复
        // ============================================

        /**
         * 保存当前状态到自动保存槽
         */
        saveAuto() {
            if (!this._storageOk) return;
            try {
                const state = this.controller.exportData();
                this._setItem(STORE.AUTOSAVE, JSON.stringify(state));
            } catch(e) {
                console.warn('[Preset] 自动保存失败:', e.message);
            }
        }

        /**
         * 恢复自动保存的状态
         * @returns {boolean} 是否成功恢复
         */
        restoreAuto() {
            if (!this._storageOk) return false;
            try {
                const saved = this._getItem(STORE.AUTOSAVE);
                if (!saved) return false;

                const parsed = JSON.parse(saved);
                const { valid, data } = validateImportedData(parsed);
                if (!valid || !data) {
                    console.warn('[Preset] 自动保存数据校验不通过，跳过恢复');
                    return false;
                }

                this.controller.importData(data);
                return true;
            } catch(e) {
                console.warn('[Preset] 自动恢复失败:', e.message);
                return false;
            }
        }

        /**
         * 检查是否存在自动保存
         */
        hasAutoSave() {
            if (!this._storageOk) return false;
            return this._getItem(STORE.AUTOSAVE) !== null;
        }

        // ============================================
        // ② 命名预设 CRUD
        // ============================================

        /**
         * 获取所有预设的元数据列表
         * @returns {Array<{id, name, description, createdAt, updatedAt}>}
         */
        listPresets() {
            if (!this._storageOk) return [];
            try {
                const indexJson = this._getItem(STORE.INDEX);
                const ids = indexJson ? JSON.parse(indexJson) : [];
                const presets = [];
                for (const id of ids) {
                    const data = this._getItem(STORE.PREFIX + id);
                    if (!data) continue;
                    try {
                        const preset = JSON.parse(data);
                        presets.push(preset.meta || { id });
                    } catch(e) {
                        continue;
                    }
                }
                return presets;
            } catch(e) {
                console.warn('[Preset] 列出预设失败:', e.message);
                return [];
            }
        }

        /**
         * 获取单条预设完整数据
         */
        getPreset(id) {
            if (!this._storageOk || !id) return null;
            try {
                const raw = this._getItem(STORE.PREFIX + id);
                if (!raw) return null;
                return JSON.parse(raw);
            } catch(e) {
                return null;
            }
        }

        /**
         * 保存当前状态为命名预设
         * @param {string} name - 预设名称
         * @param {string} description - 可选描述
         * @returns {string|null} 预设 ID，失败返回 null
         */
        savePreset(name, description) {
            if (!this._storageOk) return null;
            if (!name || typeof name !== 'string') return null;

            try {
                const state = this.controller.exportData();
                const id = generateId();
                const now = new Date().toISOString();

                // 构建预设对象
                const preset = {
                    meta: {
                        id,
                        name: sanitizeString(name).slice(0, 50),
                        description: sanitizeString(description || '').slice(0, 200),
                        version: '1',
                        createdAt: now,
                        updatedAt: now,
                        source: 'local'
                    },
                    state
                };

                // 读索引
                const indexJson = this._getItem(STORE.INDEX);
                let ids = indexJson ? JSON.parse(indexJson) : [];

                // 上限控制
                if (ids.length >= MAX_PRESETS) {
                    // 移除最旧的预设
                    const oldestId = ids.shift();
                    this._removeItem(STORE.PREFIX + oldestId);
                }

                ids.push(id);
                this._setItem(STORE.PREFIX + id, JSON.stringify(preset));
                this._setItem(STORE.INDEX, JSON.stringify(ids));

                return id;
            } catch(e) {
                console.warn('[Preset] 保存预设失败:', e.message);
                return null;
            }
        }

        /**
         * 删除指定预设
         */
        deletePreset(id) {
            if (!this._storageOk || !id) return false;
            try {
                const indexJson = this._getItem(STORE.INDEX);
                if (!indexJson) return false;
                let ids = JSON.parse(indexJson);
                const idx = ids.indexOf(id);
                if (idx === -1) return false;
                ids.splice(idx, 1);
                this._removeItem(STORE.PREFIX + id);
                this._setItem(STORE.INDEX, JSON.stringify(ids));
                return true;
            } catch(e) {
                return false;
            }
        }

        /**
         * 载入指定预设到应用
         * @returns {boolean} 是否成功
         */
        loadPreset(id) {
            const preset = this.getPreset(id);
            if (!preset || !preset.state) return false;

            try {
                const { valid, data } = validateImportedData(preset.state);
                if (!valid || !data) return false;

                this.controller.importData(data);

                // 更新自动保存（让下次打开直接恢复到最后载入的预设状态）
                this.saveAuto();
                return true;
            } catch(e) {
                console.warn('[Preset] 载入预设失败:', e.message);
                return false;
            }
        }

        // ============================================
        // ③ 导入 / 导出
        // ============================================

        /**
         * 导出当前状态为可下载的 .json（含元数据）
         * @param {string} name - 导出文件名（不含扩展名）
         */
        exportCurrentAsPreset(name) {
            const state = this.controller.exportData();
            const now = new Date().toISOString();

            const preset = {
                meta: {
                    id: generateId(),
                    name: sanitizeString(name || '未命名预设'),
                    description: '',
                    version: '1',
                    createdAt: now,
                    updatedAt: now,
                    source: 'local'
                },
                state
            };

            const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (name || 'guitarfb-preset') + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        /**
         * 🔒 从 File 对象安全导入预设
         * @param {File} file - 用户选择的 JSON 文件
         * @param {Function} onSuccess - 导入成功回调 (presetName)
         * @param {Function} onError - 导入失败回调 (errorMessage)
         */
        importFromFile(file, onSuccess, onError) {
            if (!file) {
                if (onError) onError('未选择文件');
                return;
            }

            const reader = new FileReader();

            reader.onerror = () => {
                if (onError) onError('文件读取失败');
            };

            reader.onload = (ev) => {
                try {
                    const raw = ev.target.result;
                    let parsed;

                    // 第 1 步：JSON 解析
                    try {
                        parsed = JSON.parse(raw);
                    } catch(e) {
                        if (onError) onError('文件不是有效的 JSON 格式');
                        return;
                    }

                    // 第 2 步：判断是含 meta 的新格式还是旧版裸状态
                    let stateData;
                    let presetName = '导入的预设';

                    if (parsed && parsed.meta && parsed.state) {
                        // 新格式：{ meta: {...}, state: {...} }
                        presetName = parsed.meta.name || presetName;
                        stateData = parsed.state;
                    } else {
                        // 旧格式：裸状态对象（向后兼容）
                        stateData = parsed;
                    }

                    // 第 3 步：安全校验
                    const { valid, data, errors } = validateImportedData(stateData);

                    if (!valid || !data) {
                        const msg = '数据校验不通过：' + (errors.length ? errors.join('；') : '格式错误');
                        if (onError) onError(msg);
                        return;
                    }

                    // 第 4 步：恢复到应用
                    try {
                        this.controller.importData(data);
                        this.saveAuto(); // 同步到自动保存
                        if (onSuccess) onSuccess(presetName);
                    } catch(e) {
                        if (onError) onError('导入执行失败：' + e.message);
                    }

                } catch(e) {
                    if (onError) onError('导入过程异常：' + e.message);
                }
            };

            reader.readAsText(file);
        }
    }

    // ============================================
    // 注册到全局
    // ============================================
    G.PresetManager = PresetManager;

})(window.GuitarFB = window.GuitarFB || {});
