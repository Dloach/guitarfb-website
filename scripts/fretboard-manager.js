/**
 * GuitarFB - 多指板管理模块
 * Version: 2.0.0
 * 
 * 支持多个指板垂直堆叠显示，每个指板独立配置。
 * 点击指板激活，参数面板控制当前激活指板。
 */
(function(G) {
    'use strict';

    const STORAGE_KEY = 'guitarfb_fretboards';

    /** 生成短 ID */
    function uid() {
        return Math.random().toString(36).slice(2, 10);
    }

    class FretboardManager {
        /**
         * @param {HTMLElement} container - 指板容器 DOM 元素
         * @param {Object} callbacks
         *   onSwitch(fb) - 切换指板时调用
         *   onCanvasCreated(canvas, fb) - 新建 canvas 后调用，用于绑定事件
         */
        constructor(container, callbacks) {
            this.container = container;
            this.callbacks = callbacks || {};
            this.list = [];       // [{ id, canvas, renderer, controller, name, tuning, key, scale, chord, degree }]
            this.activeIdx = -1;
        }

        /**
         * 新建一个指板，叠放在右上角
         * @param {Object} options
         * @returns {Object} fretboardData
         */
        add(options) {
            options = options || {};
            var id = uid();
            var afterId = options.afterId;
            var canvas = document.createElement('canvas');
            canvas.className = 'fretboard-canvas';
            canvas.width = 1620;
            canvas.height = 540;
            canvas.dataset.fbid = id;

            // 每个指板包一个 relative 容器，用于定位指示灯
            var wrapper = document.createElement('div');
            wrapper.className = 'fretboard-wrapper';

            var renderer = new G.FretboardRenderer(canvas);
            var controller = new G.FretboardController(renderer);

            var fb = {
                id: id,
                canvas: canvas,
                renderer: renderer,
                controller: controller,
                name: options.name || '',
                tuning: options.tuning || JSON.parse(JSON.stringify(G.TUNING_CONFIG)),
                key: options.key || 'C',
                scale: options.scale || 'major',
                chord: options.chord || 'triad',
                degree: options.degree || '1',
                boardTitle: options.boardTitle || ''
            };

            // 插入到指定指板之后，或追加到末尾
            var insertIdx = -1;
            if (afterId) {
                var afterIdx = this.list.findIndex(function(f) { return f.id === afterId; });
                if (afterIdx >= 0) {
                    insertIdx = afterIdx + 1;
                    this.list.splice(insertIdx, 0, fb);
                } else {
                    this.list.push(fb);
                }
            } else {
                this.list.push(fb);
            }

            // 初始绘制
            renderer.draw([], { type: null }, fb.boardTitle || ('指板 ' + this.list.length));

            // 组装：wrapper → canvas + dot
            wrapper.appendChild(canvas);
            // 删除按钮
            var del = document.createElement('button');
            del.className = 'fretboard-del';
            del.textContent = '✕';
            del.title = '删除此指板';
            (function(mgr, fid, d) {
                d.addEventListener('click', function(e) { e.stopPropagation(); mgr.remove(fid); });
            })(this, fb.id, del);
            wrapper.appendChild(del);
            // 上移按钮
            var upBtn = document.createElement('button');
            upBtn.className = 'fretboard-up';
            upBtn.textContent = '▲';
            upBtn.title = '上移此指板';
            (function(mgr, fid, b) {
                b.addEventListener('click', function(e) { e.stopPropagation(); mgr.moveUp(fid); });
            })(this, fb.id, upBtn);
            wrapper.appendChild(upBtn);
            // 下移按钮
            var downBtn = document.createElement('button');
            downBtn.className = 'fretboard-down';
            downBtn.textContent = '▼';
            downBtn.title = '下移此指板';
            (function(mgr, fid, b) {
                b.addEventListener('click', function(e) { e.stopPropagation(); mgr.moveDown(fid); });
            })(this, fb.id, downBtn);
            wrapper.appendChild(downBtn);
            // 复制按钮（复制当前指板到下方）
            var copyBtn = document.createElement('button');
            copyBtn.className = 'fretboard-copy';
            copyBtn.textContent = '⧉';
            copyBtn.title = '复制此指板';
            (function(mgr, fid) {
                copyBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var srcFb = mgr.list.find(function(f) { return f.id === fid; });
                    if (!srcFb) return;
                    // 先把源指板状态保存到 fb.annotations/fb.template
                    mgr._saveState(srcFb);
                    var name = srcFb.boardTitle || srcFb.name || '';
                    var newFb = mgr.add({
                        name: name + ' (copy)',
                        afterId: fid,
                        tuning: JSON.parse(JSON.stringify(srcFb.tuning)),
                        key: srcFb.key,
                        scale: srcFb.scale,
                        chord: srcFb.chord,
                        degree: srcFb.degree,
                        boardTitle: srcFb.boardTitle || ''
                    });
                    // 从 fb.annotations 复制（_saveState 后的数据，包含控制器最新状态）
                    if (srcFb.annotations) {
                        newFb.annotations = srcFb.annotations.slice();
                        newFb.controller.annotations = srcFb.annotations.slice();
                    }
                    if (srcFb.template) {
                        newFb.template = JSON.parse(JSON.stringify(srcFb.template));
                        newFb.controller.currentTemplate = JSON.parse(JSON.stringify(srcFb.template));
                    }
                    newFb.controller.annotationMode = srcFb.controller.annotationMode || 'note';
                    newFb.controller.refreshAllTemplateStyles();
                    // 重绘
                    newFb.renderer.draw(newFb.controller.getAnnotations(), newFb.controller.currentTemplate, newFb.boardTitle || '');
                    var newIdx = mgr.list.findIndex(function(f) { return f.id === newFb.id; });
                    if (newIdx >= 0) mgr.activate(newIdx);
                });
            })(this, fb.id);
            wrapper.appendChild(copyBtn);
            // 绿色加号按钮（新增指板，插入到当前指板下方）
            var addBtn = document.createElement('button');
            addBtn.className = 'fretboard-add';
            addBtn.textContent = '+';
            addBtn.title = '新增指板';
            (function(mgr, fid) {
                addBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var idx = mgr.count() + 1;
                    var newFb = mgr.add({ name: (G.currentLang === 'zh' ? '指板 ' : 'Fretboard ') + idx, afterId: fid });
                    var newIdx = mgr.list.findIndex(function(f) { return f.id === newFb.id; });
                    if (newIdx >= 0) mgr.activate(newIdx);
                });
            })(this, fb.id);
            wrapper.appendChild(addBtn);
            // wrapper 点击 → 激活 + 显示按钮
            (function(mgr, fid, w) {
                w.addEventListener('click', function() {
                    mgr.activate(fid);
                    // 隐藏其他指板的按钮，显示当前指板按钮
                    mgr.list.forEach(function(f) {
                        if (f._wrapper) f._wrapper.classList.toggle('show-buttons', f.id === fid);
                    });
                });
            })(this, fb.id, wrapper);
            // 插入到正确 DOM 位置（insertBefore 第二个参数为 null = append）
            var refNode = (insertIdx >= 0 && insertIdx < this.container.children.length)
                ? this.container.children[insertIdx] : null;
            this.container.insertBefore(wrapper, refNode);
            fb._wrapper = wrapper;

            if (this.callbacks.onCanvasCreated) this.callbacks.onCanvasCreated(canvas, fb);

            return fb;
        }

        /**
         * 激活指定指板（更新全局 renderer / controller 引用 + 重绘）
         */
        activate(idOrIdx) {
            var idx = typeof idOrIdx === 'number' ? idOrIdx
                : this.list.findIndex(function(f) { return f.id === idOrIdx; });
            if (idx < 0 || idx === this.activeIdx) { console.log('[FM] activate SKIP ' + idx + ' == ' + this.activeIdx); return; }
            console.log('[FM] activate ' + this.activeIdx + ' → ' + idx);

            // 保存当前指板状态
            var old = this.getActive();
            if (old) this._saveState(old);

            this.activeIdx = idx;
            var fb = this.list[idx];

            // 恢复目标指板状态
            this._loadState(fb);

            // 重绘
            fb.renderer.draw(fb.controller.getAnnotations(), fb.controller.currentTemplate, fb.boardTitle || '指板 ' + (idx + 1));

            // 高亮当前指板（边框）
            this.list.forEach(function(f, i) {
                f.canvas.classList.toggle('fretboard-active', i === idx);
            });

            if (this.callbacks.onSwitch) this.callbacks.onSwitch(fb);
        }

        // ——— 移动指板 ———

        moveUp(idOrIdx) {
            var idx = typeof idOrIdx === 'number' ? idOrIdx
                : this.list.findIndex(function(f) { return f.id === idOrIdx; });
            if (idx <= 0) return false;
            var fb = this.list[idx];
            var refWrapper = this.list[idx - 1]._wrapper;  // 目标位置的 wrapper（在 splice 前捕获）
            // 交换 list 位置
            this.list.splice(idx, 1);
            this.list.splice(idx - 1, 0, fb);
            // 交换 DOM 位置：把当前 wrapper 放到 refWrapper 前面
            refWrapper.parentNode.insertBefore(fb._wrapper, refWrapper);
            // 更新 activeIdx
            if (this.activeIdx === idx) this.activeIdx = idx - 1;
            else if (this.activeIdx === idx - 1) this.activeIdx = idx;
            this.activate(this.activeIdx);
            return true;
        }

        moveDown(idOrIdx) {
            var idx = typeof idOrIdx === 'number' ? idOrIdx
                : this.list.findIndex(function(f) { return f.id === idOrIdx; });
            if (idx >= this.list.length - 1) return false;
            var fb = this.list[idx];
            var refWrapper = this.list[idx + 1]._wrapper;  // splice 前捕获
            this.list.splice(idx, 1);
            this.list.splice(idx + 1, 0, fb);  // 插入到目标位置
            // 交换 DOM 位置：把当前 wrapper 放到 refWrapper 后面
            refWrapper.parentNode.insertBefore(fb._wrapper, refWrapper.nextSibling);
            if (this.activeIdx === idx) this.activeIdx = idx + 1;
            else if (this.activeIdx === idx + 1) this.activeIdx = idx;
            this.activate(this.activeIdx);
            return true;
        }

        /** 获取当前激活指板 */
        getActive() {
            return this.list[this.activeIdx] || null;
        }

        /** 获取全部指板 */
        getAll() {
            return this.list;
        }

        /** 获取数量 */
        count() { return this.list.length; }

        /**
         * 删除指定指板（至少保留 1 个）
         */
        remove(idOrIdx) {
            if (this.list.length <= 1) return false;
            const idx = typeof idOrIdx === 'number' ? idOrIdx
                : this.list.findIndex(f => f.id === idOrIdx);
            if (idx < 0) return false;

            var fb = this.list[idx];
            if (fb._wrapper) fb._wrapper.remove();
            else fb.canvas.remove();
            this.list.splice(idx, 1);

            // 如果删的是激活的或之前的，调整 activeIdx
            if (idx <= this.activeIdx) this.activeIdx = Math.max(0, this.activeIdx - 1);

            // 激活新的当前指板
            this.activate(this.activeIdx);
            return true;
        }

        /**
         * 清空所有指板（重置为 1 个初始指板）
         */
        resetAll() {
            this.list.forEach(function(fb) { if (fb._wrapper) fb._wrapper.remove(); else fb.canvas.remove(); });
            this.list = [];
            this.activeIdx = -1;
            this.add({ name: '指板 1' });
            this.activate(0);
        }

        // ——— 内部: 保存/恢复指板状态到 controller ———

        _saveState(fb) {
            var D = G.DOM;
            fb.tuning = JSON.parse(JSON.stringify(G.TUNING_CONFIG));
            fb.annotations = fb.controller.annotations.slice();
            fb.template = fb.controller.currentTemplate ? { ...fb.controller.currentTemplate } : null;
            fb.boardTitle = D ? D.boardTitle.value : '';
            fb.annotationMode = fb.controller.annotationMode || 'note';
            // 保存下拉菜单状态
            if (D) {
                fb.key = D.globalKey.value;
                fb.scale = D.scaleMode.value;
                fb.chord = D.chordFamily.value;
                fb.degree = D.chordDegree.value;
            }
        }

        _loadState(fb) {
            var D = G.DOM;
            if (!D) return;
            // 抑制下拉 change 事件触发的自动重生成
            if (G) G._suppressAutoGen = true;
            Object.assign(G.TUNING_CONFIG, fb.tuning);
            // 始终恢复标注（空值时清空），禁止残留上个指板的数据
            fb.controller.annotations = fb.annotations ? fb.annotations.slice() : [];
            fb.controller.currentTemplate = fb.template ? { ...fb.template } : { type: null };
            D.globalKey.value = fb.key || 'C';
            D.scaleMode.value = fb.scale || 'major';
            D.chordFamily.value = fb.chord || 'triad';
            D.chordDegree.value = fb.degree || '1';
            D.boardTitle.value = fb.boardTitle || (G.currentLang === 'zh' ? '吉他指板练习' : 'Guitar Fretboard');
            fb.controller.annotationMode = fb.annotationMode || 'note';
            if (G) G._suppressAutoGen = false;
        }

        // ——— 导出/恢复全部 ———

        exportAll() {
            // 先保存当前激活指板
            this._saveState(this.getActive());
            var D = G.DOM;
            return {
                version: '2.1',
                activeIdx: this.activeIdx,
                theme: document.body.getAttribute('data-theme') || 'light',
                lang: G.currentLang || 'zh',
                bpm: D ? parseInt(D.bpmSlider.value) || 90 : 90,
                beatPerBar: D ? parseInt(D.beatPerBar.textContent) || 4 : 4,
                rhythmDiv: D ? parseInt(D.rhythmSelect.value) || 1 : 1,
                accent: D ? D.accentToggle.classList.contains('active') : true,
                timerActive: D ? D.timerToggle.classList.contains('active') : false,
                timerMinutes: D ? parseInt(D.timerMinutes.value) || 1 : 1,
                fretboards: this.list.map(fb => ({
                    id: fb.id,
                    name: fb.name,
                    tuning: JSON.parse(JSON.stringify(fb.tuning)),
                    annotations: fb.controller.annotations,
                    template: fb.controller.currentTemplate,
                    boardTitle: fb.boardTitle || (G.DOM ? G.DOM.boardTitle.value : ''),
                    annotationMode: fb.controller.annotationMode || 'note',
                    key: fb.key,
                    scale: fb.scale,
                    chord: fb.chord,
                    degree: fb.degree
                }))
            };
        }

        importAll(data) {
            if (!data || !data.fretboards || !data.fretboards.length) { console.warn('[FM] importAll: 无有效数据'); return false; }
            console.log('[FM] importAll: ' + data.fretboards.length + ' 个指板, annotationMode=' + data.annotationMode);
            this.list.forEach(function(fb) { if (fb._wrapper) fb._wrapper.remove(); else fb.canvas.remove(); });
            this.list = [];
            this.activeIdx = -1;

            data.fretboards.forEach((s, i) => {
                const fb = this.add({
                    name: s.name || ('指板 ' + (i + 1)),
                    key: s.key || 'C',
                    scale: s.scale || 'major',
                    chord: s.chord || 'triad',
                    degree: s.degree || '1',
                    boardTitle: s.boardTitle || ''
                });
                // 同时写 fb.*（供 _loadState）和 controller（供立即绘制）
                if (s.annotations) {
                    fb.annotations = s.annotations;
                    fb.controller.annotations = s.annotations;
                }
                if (s.template) {
                    fb.template = s.template;
                    fb.controller.currentTemplate = s.template;
                }
                if (s.tuning) fb.tuning = s.tuning;
                if (s.annotationMode) {
                    fb.annotationMode = s.annotationMode;
                    fb.controller.annotationMode = s.annotationMode;
                }
            });

            // 恢复主题
            if (data.theme) {
                document.body.setAttribute('data-theme', data.theme);
                G.currentTheme = data.theme;
                var D = G.DOM;
                if (D && D.themeToggle) {
                    D.themeToggle.innerHTML = data.theme === 'light' ? '🌙' : '☀️';
                }
            }

            // 恢复语言
            if (data.lang && data.lang !== G.currentLang) {
                G.currentLang = data.lang;
                var D2 = G.DOM;
                if (D2 && D2.langToggle) {
                    D2.langToggle.innerText = data.lang === 'zh' ? 'EN' : '中文';
                }
            }

            const targetIdx = (typeof data.activeIdx === 'number' && data.activeIdx < this.list.length)
                ? data.activeIdx : 0;

            // 恢复节拍器状态
            var mt = G.metro;
            if (mt && mt.setBpm) {
                if (data.bpm) mt.setBpm(data.bpm);
                if (data.beatPerBar) mt.setBeatPerBar(data.beatPerBar);
                if (data.rhythmDiv) mt.setRhythmDiv(data.rhythmDiv);
                if (data.accent !== undefined) {
                    mt.accent = data.accent;
                    var dd = G.DOM;
                    if (dd && dd.accentToggle) dd.accentToggle.classList.toggle('active', data.accent);
                }
                if (data.timerActive !== undefined) {
                    mt.timerActive = data.timerActive;
                    var dd2 = G.DOM;
                    if (dd2 && dd2.timerToggle) dd2.timerToggle.classList.toggle('active', data.timerActive);
                }
                if (data.timerMinutes) {
                    var dd3 = G.DOM;
                    if (dd3 && dd3.timerMinutes) dd3.timerMinutes.value = data.timerMinutes;
                }
            }

            // 重绘所有指板（不只有激活的）
            this.list.forEach(function(f) {
                f.renderer.draw(f.controller.getAnnotations(), f.controller.currentTemplate, f.boardTitle || '');
            });

            this.activate(targetIdx);
            return true;
        }

        /**
         * 合并导出全部指板为一张图（纵向拼接）
         */
        exportAllAsCanvas() {
            var padding = 20;
            var h = padding;
            this.list.forEach(function() { h += 540 + padding; });
            var cvs = document.createElement('canvas');
            cvs.width = 1620;
            cvs.height = h;
            var ctx = cvs.getContext('2d');

            // 使用当前主题的 Canvas 背景色
            var bgColor = getComputedStyle(document.body).getPropertyValue('--canvas-bg').trim() || '#f9f2dc';
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            var y = padding;
            this.list.forEach(function(fb, i) {
                var title = fb.boardTitle || ('指板 ' + (i + 1));
                // 用原始 renderer 画到自己的 canvas 上（采用当前主题色）
                fb.renderer.draw(fb.controller.getAnnotations(), fb.controller.currentTemplate, title);

                // 从原始 canvas 复制（用 buffer 全尺寸源 → 缩放到逻辑尺寸目标）
                var lw = fb.renderer._logicalWidth || 1620;
                var lh = fb.renderer._logicalHeight || 540;
                ctx.drawImage(fb.canvas, 0, 0, fb.canvas.width, fb.canvas.height, 0, y, lw, lh);
                y += lh + padding;
            });

            return cvs;
        }
    }

    G.FretboardManager = FretboardManager;

})(window.GuitarFB = window.GuitarFB || {});
