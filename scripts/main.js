/**
 * GuitarFB - Main JavaScript
 * Version: 1.3.2 - Final Optimization
 * 
 * 优化内容：
 * - DOM查询缓存：减少重复getElementById调用
 * - 事件委托：减少事件监听器数量
 * - 国际化数据绑定：使用data-i18n属性简化语言切换
 * - 性能监控：添加FPS和渲染时间统计
 * - Pointer Events：统一鼠标和触摸事件处理
 */

(function(G){
    'use strict';

    // Import from shared modules
    const perfMonitor = G.perfMonitor;
    const NOTE_ORDER = G.NOTE_ORDER;
    const LANG = G.LANG;
    const PRESET_TUNINGS = G.PRESET_TUNINGS;
    const TUNING_CONFIG = G.TUNING_CONFIG;
    const SCALE_INTERVALS = G.SCALE_INTERVALS;
    const getNoteAtFret = G.getNoteAtFret;
    const getScaleIntervals = G.getScaleIntervals;
    const intervalToLabel = G.intervalToLabel;
    const intervalFullName = G.intervalFullName;
    const getNumberForNote = G.getNumberForNote;
    const getScaleNoteCount = G.getScaleNoteCount;
    const getDiatonicChordIntervals = G.getDiatonicChordIntervals;
    const MetronomeController = G.MetronomeController;
    let currentLang = 'zh';
    let lang = LANG[currentLang];
    let currentTheme = 'light';  // kept for backward compat, no longer used
    let renderer, controller, metro;
    let annotationEnabled = false;  // 标注添加开关，默认关闭
    const DOM = {};
    
    function cacheDOMElements() {
        DOM.boardTitle = document.getElementById('boardTitle');
        DOM.langToggle = document.getElementById('langToggle');
        DOM.paletteToggle = document.getElementById('paletteToggle');
        DOM.palettePanel = document.getElementById('palettePanel');
        DOM.paletteGrid = document.getElementById('paletteGrid');
        
        // 调音相关
        DOM.tuningPanel = document.getElementById('tuningPanel');
        DOM.tuningPreset = document.getElementById('tuningPreset');
        DOM.mainPanel = document.querySelector('.main-panel');
        
        // 参数选择
        DOM.globalKey = document.getElementById('globalKey');
        DOM.scaleMode = document.getElementById('scaleModeSelect');
        DOM.chordFamily = document.getElementById('chordFamilySelect');
        DOM.chordDegree = document.getElementById('chordDegreeSelect');
        
        // 按钮
        DOM.genScaleBtn = document.getElementById('genScaleBtn');
        DOM.genChordBtn = document.getElementById('genChordBtn');
        DOM.genSolfegeChordBtn = document.getElementById('genSolfegeChordBtn');
        DOM.genNoteNameChordBtn = document.getElementById('genNoteNameChordBtn');
        DOM.clearAllBtn = document.getElementById('clearAllBtn');
        
        // 标注相关
        DOM.modeManual = document.getElementById('modeManual');
        DOM.modeManualMobile = document.getElementById('modeManualMobile');
        DOM.modePitch = document.getElementById('ModePitch');
        DOM.modePitchMobile = document.getElementById('ModePitchMobile');
        DOM.labelText = document.getElementById('labelText');
        DOM.labelTextMobile = document.getElementById('labelTextMobile');
        DOM.bgColorPicker = document.getElementById('bgColorPicker');
        DOM.textColorPicker = document.getElementById('textColorPicker');
        DOM.bgColorPickerMobile = document.getElementById('bgColorPickerMobile');
        DOM.textColorPickerMobile = document.getElementById('textColorPickerMobile');
        DOM.textColorPicker = document.getElementById('textColorPicker');
        
        // 导出/导入
        DOM.exportImage = document.getElementById('exportImage');
        DOM.exportData = document.getElementById('exportData');
        DOM.importBtn = document.getElementById('importBtn');
        DOM.importFile = document.getElementById('importFile');
        

        
        // 节拍器
        DOM.bpmSlider = document.getElementById('bpmSlider');
        DOM.bpmDisplay = document.getElementById('bpmDisplay');
        DOM.beatPerBar = document.getElementById('beatPerBar');
        DOM.beatDown = document.getElementById('beatDown');
        DOM.beatUp = document.getElementById('beatUp');
        DOM.rhythmSelect = document.getElementById('rhythmSelect');
        DOM.accentToggle = document.getElementById('accentToggle');
        DOM.timerToggle = document.getElementById('timerToggle');
        DOM.timerMinutes = document.getElementById('timerMinutes');
        DOM.metroStartStop = document.getElementById('metroStartStop');
        DOM.metroTap = document.getElementById('metroTap');
        DOM.countdownDisplay = document.getElementById('countdownDisplay');
        DOM.beatSubdivDisplay = document.getElementById('beatSubdivDisplay');
        DOM.beatSubdivDisplayMobile = document.getElementById('beatSubdivDisplayMobile');
        
        // 调音弦选择器
        DOM.stringSelects = [];
        for(let i = 0; i < 6; i++) {
            DOM.stringSelects.push(document.getElementById('string' + i));
        }
        
        // 多指板
        DOM.fretboardContainer = document.getElementById('fretboardContainer');
        DOM.fretboardAddBtn = document.getElementById('fretboardAddBtn');
        DOM.exportAllImage = document.getElementById('exportAllImage');
    }

    // ============================================
    // 国际化 - 使用data-i18n属性自动更新
    // ============================================
    function updateI18N() {
        // 更新所有带data-i18n属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if(lang[key]) {
                el.textContent = lang[key];
            }
        });
        
        // 更新placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if(lang[key]) {
                el.placeholder = lang[key];
            }
        });
        
        // 更新select选项
        updateSelectOptions();
    }
    
    function updateSelectOptions() {
        // 音阶选择
        for(let i = 0; i < DOM.scaleMode.options.length; i++) {
            const val = DOM.scaleMode.options[i].value;
            if(lang.scales[val]) {
                DOM.scaleMode.options[i].text = lang.scales[val];
            }
        }
        
        // 和弦选择
        for(let i = 0; i < DOM.chordFamily.options.length; i++) {
            const val = DOM.chordFamily.options[i].value;
            if(lang.chords[val]) {
                DOM.chordFamily.options[i].text = lang.chords[val];
            }
        }
        
        // 级数选择
        const degrees = ["I","II","III","IV","V","VI","VII"];
        for(let i = 0; i < DOM.chordDegree.options.length; i++) {
            DOM.chordDegree.options[i].text = currentLang === 'zh' ? degrees[i] + " 级" : degrees[i];
        }
        
        // 节奏选择
        for(let i = 0; i < DOM.rhythmSelect.options.length; i++) {
            const val = DOM.rhythmSelect.options[i].value;
            if(lang.rhythms[val]) {
                DOM.rhythmSelect.options[i].text = lang.rhythms[val];
            }
        }
    }

    function switchLanguage() {
        currentLang = G.currentLang === 'zh' ? 'en' : 'zh';
        G.currentLang = currentLang;
        lang = LANG[currentLang];
        
        // 更新语言切换按钮
        DOM.langToggle.innerText = currentLang === 'zh' ? 'EN' : '中文';
        
        // 使用data-i18n自动更新
        updateI18N();
        
        // 调音面板预设标签
        var presetLabel = document.querySelector('.tuning-row1 label');
        if (presetLabel) presetLabel.innerText = lang.preset + ':';
        DOM.tuningPreset.options[8].text = lang.custom;
        
        // 更新节拍器标签
        const metroLabels = document.querySelectorAll('.metro-group .metro-label');
        if(metroLabels[1]) metroLabels[1].innerText = lang.beat;
        if(metroLabels[2]) metroLabels[2].innerText = lang.rhythm;
        if(metroLabels[3]) metroLabels[3].innerText = lang.accent;
        if(metroLabels[4]) metroLabels[4].innerText = lang.timer;
        
        // 更新细分标签
        document.querySelectorAll('.metro-group-metronome-subdiv .metro-label').forEach(label => {
            label.innerText = lang.subdiv;
        });
        
        // 更新节拍器按钮
        if(metro) {
            DOM.metroStartStop.innerText = metro.active ? lang.stop : lang.start;
        }
        
        // 刷新所有指板的标注文字 + 标题跟随语言切换
        if (G.fretboardMgr) {
            G.fretboardMgr.getAll().forEach(function(fb) {
                if (fb.controller) fb.controller.refreshAllTemplateStyles();
                var t = fb.controller ? fb.controller.currentTemplate : null;
                if (t && t.type === 'scale') {
                    fb.boardTitle = currentLang === 'zh'
                        ? (t.root + '调 ' + (lang.scales[t.scaleType] || '音阶'))
                        : (t.root + ' ' + (lang.scales[t.scaleType] || 'Scale'));
                } else if (t && t.type === 'chord') {
                    var roman = ["I","II","III","IV","V","VI","VII"][t.degree-1] || '';
                    var chordName = lang.chords[t.family] || '';
                    var am = fb.controller.annotationMode || 'note';
                    var suffix2 = am === 'note' ? (currentLang === 'zh' ? ' (音名)' : ' (Note Name)')
                        : am === 'solfege' ? (currentLang === 'zh' ? ' (唱名)' : ' (Solfege)')
                        : (currentLang === 'zh' ? ' (音级)' : ' (Interval)');
                    fb.boardTitle = currentLang === 'zh'
                        ? (t.root + '调 ' + (lang.scales[t.scaleType] || '') + ' ' + roman + '级' + chordName + suffix2)
                        : (t.root + ' ' + (lang.scales[t.scaleType] || '') + ' ' + roman + ' ' + chordName + suffix2);
                }
                fb.renderer.draw(fb.controller.getAnnotations(), fb.controller.currentTemplate, fb.boardTitle || '');
            });
            // 同步标题输入框到当前激活指板
            var active = G.fretboardMgr.getActive();
            if (active && active.boardTitle) DOM.boardTitle.value = active.boardTitle;
        }
    }
    
    function updateAutoTitle() {
        const currentTitle = DOM.boardTitle.value;
        const isAutoTitle = /[\u4e00-\u9fa5]/.test(currentTitle) || 
            /^(C|C#|D|D#|E|F|F#|G|G#|A|A#|B)\s+(Major|Minor|Dorian|Phrygian|Lydian|Mixolydian|Locrian|Harmonic|Melodic|Pentatonic|Blues|Japanese|Hungarian)/.test(currentTitle);
            
        if(isAutoTitle && controller && controller.currentTemplate && controller.currentTemplate.type) {
            if(controller.currentTemplate.type === 'scale') {
                const scaleTitle = currentLang === 'zh' 
                    ? `${controller.currentTemplate.root}调 ${lang.scales[controller.currentTemplate.scaleType]||"音阶"}` 
                    : `${controller.currentTemplate.root} ${lang.scales[controller.currentTemplate.scaleType]||"Scale"}`;
                DOM.boardTitle.value = scaleTitle;
                controller.renderer.draw(controller.annotations, controller.currentTemplate, scaleTitle);
            } else if(controller.currentTemplate.type === 'chord') {
                const roman = ["I","II","III","IV","V","VI","VII"][controller.currentTemplate.degree-1];
                var am = controller ? controller.annotationMode || 'note' : 'note';
                var suffix = am === 'note' ? (currentLang === 'zh' ? ' (音名)' : ' (Note Name)')
                    : am === 'solfege' ? (currentLang === 'zh' ? ' (唱名)' : ' (Solfege)')
                    : (currentLang === 'zh' ? ' (音级)' : ' (Interval)');
                const chordTitle = currentLang === 'zh' 
                    ? `${controller.currentTemplate.root}调 ${lang.scales[controller.currentTemplate.scaleType]||"音阶"} ${roman}级${lang.chords[controller.currentTemplate.family]||"和弦"}${suffix}` 
                    : `${controller.currentTemplate.root} ${lang.scales[controller.currentTemplate.scaleType]||"Scale"} ${roman} ${lang.chords[controller.currentTemplate.family]||"Chord"}${suffix}`;
                DOM.boardTitle.value = chordTitle;
                controller.renderer.draw(controller.annotations, controller.currentTemplate, chordTitle);
            }
        }
    }

    function applyPalette(id) {
        var p = G.PALETTES && G.PALETTES[id];
        if (!p) { console.warn('[Palette] unknown id:', id); return; }
        var root = document.documentElement;
        var c = p.colors;
        // 写入 10 色变量
        Object.keys(c).forEach(function(k) { root.style.setProperty('--clr-' + k, c[k]); });
        // 同步旧变量别名（确保所有 var(--color-*) 和 var(--canvas-*) 生效）
        if (c.bg) root.style.setProperty('--color-bg-body', c.bg);
        if (c.card) root.style.setProperty('--color-bg-container', c.card);
        if (c.card) root.style.setProperty('--color-bg-group', c.card);
        if (c.card) root.style.setProperty('--color-bg-tool', c.card);
        if (c.panel) root.style.setProperty('--color-bg-panel', c.panel);
        if (c.panel) root.style.setProperty('--color-bg-title', c.panel);
        if (c.panel) root.style.setProperty('--color-bg-metro', c.panel);
        if (c.panel) root.style.setProperty('--color-bg-metro-group', c.panel);
        if (c.canvas) root.style.setProperty('--color-bg-canvas', c.canvas);
        if (c.canvas) root.style.setProperty('--canvas-bg', c.canvas);
        if (c.text) root.style.setProperty('--color-text-primary', c.text);
        if (c.text) root.style.setProperty('--canvas-text', c.text);
        if (c.muted) root.style.setProperty('--color-text-secondary', c.muted);
        if (c.muted) root.style.setProperty('--canvas-subtext', c.muted);
        if (c.btn) root.style.setProperty('--color-btn-primary', c.btn);
        if (c.accent) root.style.setProperty('--color-toggle-on', c.accent);
        if (c.accent) root.style.setProperty('--color-beat-on', c.accent);
        if (c.accent) root.style.setProperty('--color-text-bpm', c.accent);
        if (c.danger) root.style.setProperty('--color-btn-danger', c.danger);
        if (c.danger) root.style.setProperty('--color-text-countdown', c.danger);
        if (c.border) root.style.setProperty('--color-border', c.border);
        if (c.border) root.style.setProperty('--canvas-line', c.border);
        if (c.border) root.style.setProperty('--canvas-nut', c.border);
        if (c.accent) root.style.setProperty('--canvas-marker', c.accent);
        if (c.border) root.style.setProperty('--canvas-ann-border', c.border);
        if (c.card) root.style.setProperty('--canvas-ann-bg', c.card);
        if (c.text) root.style.setProperty('--canvas-ann-text', c.text);
        if (c.btn) root.style.setProperty('--canvas-ann-border', c.btn);
        if (c.border) root.style.setProperty('--color-toggle-off', c.border);
        if (c.border) root.style.setProperty('--color-beat-off', c.border);
        // 更新各指板控制器的默认手动标注颜色（跟随调色板）
        if (G && G.fretboardMgr) {
            G.fretboardMgr.getAll().forEach(function(fb) {
                if (fb.controller) {
                    fb.controller.manualBg = c.accent;
                    fb.controller.manualTextColor = c.card;
                }
            });
        }
        
        // 更新颜色缓存供 getAnnColors 直接读取
        _paletteCache.bg = c.canvas;
        _paletteCache.text = c.text;
        _paletteCache.card = c.card;
        _paletteCache.panel = c.panel;
        _paletteCache.btn = c.btn;
        _paletteCache.accent = c.accent;
        _paletteCache.muted = c.muted;
        _paletteCache.danger = c.danger;
        _paletteCache.btn = c.btn;
        
        // 更新标注颜色预设和拾色器默认值（仅在页面已加载时）
        if (DOM.bgColorPicker) DOM.bgColorPicker.value = c.accent;
        if (DOM.textColorPicker) DOM.textColorPicker.value = c.text;
        if (DOM.bgColorPickerMobile) DOM.bgColorPickerMobile.value = c.accent;
        if (DOM.textColorPickerMobile) DOM.textColorPickerMobile.value = c.text;
        // 更新颜色预设圆圈（取调色板的 accent/text/border 做 3 组默认）
        document.querySelectorAll('.color-preset').forEach(function(group) {
            var btns = group.querySelectorAll('.color-btn');
            if (btns.length >= 3) {
                btns[0].style.background = c.danger; btns[0].dataset.bg = c.danger; btns[0].dataset.text = '#ffffff';
                btns[1].style.background = c.card; btns[1].dataset.bg = c.card; btns[1].dataset.text = c.text;
                btns[2].style.background = c.text; btns[2].dataset.bg = c.text; btns[2].dataset.text = c.card;
            }
        });
        G.currentPalette = id;
        // 先刷新所有模板标注的样式（颜色跟随新调色板）
        if (G.fretboardMgr) {
            G.fretboardMgr.getAll().forEach(function(fb) {
                if (fb.controller) fb.controller.refreshAllTemplateStyles();
                fb.renderer.draw(fb.controller.getAnnotations(), fb.controller.currentTemplate, fb.boardTitle || '');
            });
        } else if(controller) {
            controller.refreshAllTemplateStyles();
            controller.renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        }
        document.querySelectorAll('.palette-card').forEach(function(card) {
            card.classList.toggle('active', card.dataset.palette === id);
        });
    }

    function initPalettePanel() {
        var panel = DOM.palettePanel;
        var grid = DOM.paletteGrid;
        if (!panel || !grid || !G.PALETTES) return;
        var lang = G.currentLang || 'zh';
        // 显式排列：每行 [浅色, 深色] 配对，确保左浅右深
        var pairs = [
            ['warm-cream',   'monochrome'],
            ['retro-warm',   'cool-midnight'],
            ['nordic',       'cyber-neon'],
            ['forest',       'ember-night']
        ];
        pairs.forEach(function(row) {
            row.forEach(function(id) {
                var p = G.PALETTES[id];
                if (!p) return;
                var card = document.createElement('div');
                card.className = 'palette-card';
                card.dataset.palette = id;
                var swatches = document.createElement('div');
                swatches.className = 'palette-swatches';
                var cc = p.colors;
                var keys = ['bg','card','panel','canvas','text','muted','btn','accent','danger','border'];
                keys.forEach(function(k) {
                    var dot = document.createElement('span');
                    dot.style.background = cc[k];
                    swatches.appendChild(dot);
                });
                card.appendChild(swatches);
                card.addEventListener('click', function() {
                    applyPalette(id);
                    panel.style.display = 'none';
                    try { localStorage.setItem('guitarfb-palette', id); } catch(ex) {}
                });
                grid.appendChild(card);
            });
        });
        var saved = 'warm-cream';
        try { saved = localStorage.getItem('guitarfb-palette') || 'warm-cream'; } catch(ex) {}
        applyPalette(saved);
    }

    // ============================================
    // 调音配置
    // ============================================

    // ============================================
    // 指板渲染器类
    // ============================================
    class FretboardRenderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this._styleCache = null;
            this.leftMargin = 140;
            this.rightMargin = 62;
            this.topMargin = 106;
            this.bottomMargin = 48;
            this.fretCount = 12;
            
            // HiDPI 适配
            const dpr = window.devicePixelRatio || 1;
            if(dpr > 1) {
                this._logicalWidth = canvas.width;
                this._logicalHeight = canvas.height;
                canvas.width = this._logicalWidth * dpr;
                canvas.height = this._logicalHeight * dpr;
                this.ctx.scale(dpr, dpr);
            } else {
                this._logicalWidth = canvas.width;
                this._logicalHeight = canvas.height;
            }
        }
        
        // 从 CSS 变量读取 Canvas 颜色（自动响应主题切换）
        _getCanvasColors() {
            const style = getComputedStyle(document.body);
            return {
                bg: style.getPropertyValue('--canvas-bg').trim(),
                text: style.getPropertyValue('--canvas-text').trim(),
                subText: style.getPropertyValue('--canvas-subtext').trim(),
                line: style.getPropertyValue('--canvas-line').trim(),
                nut: style.getPropertyValue('--canvas-nut').trim(),
                marker: style.getPropertyValue('--canvas-marker').trim(),
                stringDark: style.getPropertyValue('--canvas-string-dark').trim(),
                stringLight: style.getPropertyValue('--canvas-string-light').trim(),
                annBg: style.getPropertyValue('--canvas-ann-bg').trim(),
                annBorder: style.getPropertyValue('--canvas-ann-border').trim(),
                annText: style.getPropertyValue('--canvas-ann-text').trim()
            };
        }
        
        get logicalWidth() { return this._logicalWidth; }
        get logicalHeight() { return this._logicalHeight; }
        
        getFretStep() { 
            return (this._logicalWidth - this.leftMargin - this.rightMargin) / this.fretCount; 
        }
        
        getStringY(s) { 
            return this.topMargin + (s/5)*(this._logicalHeight - this.bottomMargin - this.topMargin); 
        }
        
        getStringAndFretFromCoord(x, y) {
            let bestStr = -1, minD = 28;
            for(let s = 0; s < 6; s++) {
                let sy = this.getStringY(s);
                let d = Math.abs(y - sy);
                if(d < minD) { minD = d; bestStr = s; }
            }
            if(bestStr === -1) return null;
            
            const startX = this.leftMargin, fretStep = this.getFretStep();
            let fret = 1;
            for(let f = 1; f <= this.fretCount; f++) {
                if(x >= startX + (f-1)*fretStep && x <= startX + f*fretStep) { fret = f; break; }
            }
            if(x > startX + this.fretCount*fretStep) fret = this.fretCount;
            if(x < startX + fretStep) fret = 1;
            
            return { 
                stringIdx: bestStr, 
                fret: fret, 
                x: startX + (fret-0.5)*fretStep, 
                y: this.getStringY(bestStr) 
            };
        }
        
        draw(annotations, currentTemplate, boardTitle) {
            // 性能监控开始
            perfMonitor.startRender();
            
            this.ctx.clearRect(0, 0, this._logicalWidth, this._logicalHeight);
            
            // 从 CSS 变量读取 Canvas 颜色（自动响应主题切换）
            const colors = this._getCanvasColors();
            
            // 背景
            this.ctx.fillStyle = colors.bg;
            this.ctx.fillRect(0, 0, this._logicalWidth, this._logicalHeight);
            
            // 标题
            this.ctx.font = "bold 32px 'Segoe UI'";
            this.ctx.fillStyle = colors.text;
            this.ctx.textAlign = "center";
            this.ctx.fillText(boardTitle || (currentLang === 'zh' ? "吉他指板" : "Guitar Fretboard"), 
                this._logicalWidth/2, this.topMargin-70);
            
            // 调音信息
            this.ctx.font = "bold 14px 'Segoe UI'";
            this.ctx.fillStyle = colors.subText;
            this.ctx.textAlign = "left";
            this.ctx.fillText((currentLang === 'zh' ? "调音: " : "Tuning: ") + TUNING_CONFIG.name, 
                20, this.topMargin-70);
            
            // 品丝
            const startX = this.leftMargin, fretStep = this.getFretStep();
            this.ctx.lineWidth = 2.5;
            this.ctx.strokeStyle = colors.line;
            for(let i = 0; i <= this.fretCount; i++) {
                let x = startX + i*fretStep;
                this.ctx.beginPath();
                this.ctx.moveTo(x, this.topMargin-5);
                this.ctx.lineTo(x, this._logicalHeight - this.bottomMargin + 5);
                this.ctx.stroke();
            }
            
            // 琴枕
            this.ctx.lineWidth = 4.5;
            this.ctx.strokeStyle = colors.nut;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, this.topMargin-5);
            this.ctx.lineTo(startX, this._logicalHeight - this.bottomMargin + 5);
            this.ctx.stroke();
            
            // 琴弦
            for(let s = 0; s < 6; s++) {
                this.ctx.beginPath();
                const y = this.getStringY(s);
                this.ctx.lineWidth = s >= 3 ? 2.8 : 2.2;
                this.ctx.strokeStyle = s >= 3 ? colors.stringDark : colors.stringLight;
                this.ctx.moveTo(this.leftMargin - 15, y);
                this.ctx.lineTo(this._logicalWidth - this.rightMargin + 15, y);
                this.ctx.stroke();
            }
            
            // 品位标记（半径 12px，比原版增大 70%）
            this.ctx.fillStyle = colors.marker;
            for(let f of [3,5,7,9,12]) {
                if(f > this.fretCount) continue;
                const cx = startX + (f-0.5)*fretStep;
                if(f === 12) {
                    this.ctx.beginPath();
                    this.ctx.arc(cx - 20, this.getStringY(2.5), 12, 0, Math.PI*2);
                    this.ctx.arc(cx + 20, this.getStringY(2.5), 12, 0, Math.PI*2);
                    this.ctx.fill();
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(cx, this.getStringY(2.5), 12, 0, Math.PI*2);
                    this.ctx.fill();
                }
            }
            
            // 弦标签（仅显示当前定弦音）
            this.ctx.font = "bold 18px 'Segoe UI'";
            this.ctx.fillStyle = colors.subText;
            this.ctx.textAlign = "right";
            for(let i = 0; i < 6; i++) {
                this.ctx.fillText(TUNING_CONFIG.strings[i].openNote, 
                    this.leftMargin - 18, this.getStringY(i) + 7);
            }
            this.ctx.textAlign = "left";
            
            // 标注（先描边再填充 → 4px 画布色光晕环）
            for(let a of annotations) {
                // 光晕环：指板底色粗描边
                this.ctx.beginPath();
                this.ctx.arc(a.x, a.y, 29, 0, Math.PI*2);
                this.ctx.strokeStyle = colors.bg;
                this.ctx.lineWidth = 16;
                this.ctx.stroke();
                // 标注主体
                this.ctx.beginPath();
                this.ctx.arc(a.x, a.y, 29, 0, Math.PI*2);
                this.ctx.fillStyle = a.bgColor || colors.annBg;
                this.ctx.fill();
                var am = controller ? controller.annotationMode || 'note' : 'note';
                var fs = (am === 'interval' && currentLang === 'zh') ? 25 : 28;
                this.ctx.font = "bold " + fs + "px 'Segoe UI'";
                this.ctx.fillStyle = a.textColor || colors.annText;
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillText(a.text, a.x, a.y);
            }
            
            // 性能监控结束
            perfMonitor.endRender();
            perfMonitor.update();
        }
    }

    // ============================================
    // 指板控制器类
    // ============================================
    class FretboardController {
        constructor(renderer) {
            this.renderer = renderer;
            this.annotations = [];
            this.currentTemplate = { type: null };
            this.currentMode = 'manual';
            this.manualText = "●";
            // 初始颜色从调色板读取（由 initPalettePanel 的 applyPalette 覆盖）
            this.manualBg = "#ff4444";
            this.manualTextColor = "#ffffff";
            this.annotationMode = 'note';
        }
        
        refreshAnnotationStyle(ann) {
            if(!ann.isTemplate) return;
            const tmpl = this.currentTemplate;
            const curNote = getNoteAtFret(ann.stringIdx, ann.fret);
            const isRoot = (curNote === tmpl.root);
            
            var mode = this.annotationMode || 'note';
            var ac = getAnnColors();
            var isChord = tmpl.type === 'chord';
            /* 四条色彩规则（根音始终用 danger 红色突出）：
               音阶（任意模式）      → bg=panel      text=text       朴素低调
               和弦音名             → bg=card       text=btn        主按钮色文字
               和弦唱名             → bg=panel      text=accent     强调色文字
               和弦音程             → bg=card       text=muted      柔和次要文字 */
            /* 先设定文字内容（根音和非根音的文字逻辑相同） */
            if (mode === 'note') {
                ann.text = curNote;
            } else if (mode === 'solfege') {
                const si = getScaleIntervals(tmpl.scaleType || 'major');
                ann.text = getNumberForNote(curNote, tmpl.root, si);
            } else {  // interval
                const rootIdx = NOTE_ORDER.indexOf(tmpl.root);
                const noteIdx = NOTE_ORDER.indexOf(curNote);
                let iv = (noteIdx - rootIdx + 12) % 12;
                ann.text = intervalFullName(iv, currentLang === 'zh');
            }
            /* 配色规则：
               根音：btn 底色 + card 文字，始终醒目
               非根音：muted 底色（与 canvas 拉开距离）+ card 文字（与 muted 拉开距离）*/
            if (isRoot) {
                ann.bgColor = ac.btn;
                ann.textColor = ac.card;
            } else {
                ann.bgColor = ac.muted;
                ann.textColor = ac.card;
            }
        }
        
        refreshAllTemplateStyles() {
            for(let ann of this.annotations) {
                if(ann.isTemplate) this.refreshAnnotationStyle(ann);
            }
        }
        
        addOrReplaceAnnotation(pos, isManualMode) {
            const existingIdx = this.annotations.findIndex(a => a.stringIdx === pos.stringIdx && a.fret === pos.fret);
            if(existingIdx !== -1) this.annotations.splice(existingIdx, 1);
            
            let ann;
            if(isManualMode) {
                ann = { x: pos.x, y: pos.y, text: this.manualText, stringIdx: pos.stringIdx, 
                    fret: pos.fret, bgColor: this.manualBg, textColor: this.manualTextColor, 
                    isTemplate: false, type: 'manual' };
            } else {
                ann = { x: pos.x, y: pos.y, text: getNoteAtFret(pos.stringIdx, pos.fret), 
                    stringIdx: pos.stringIdx, fret: pos.fret, bgColor: this.manualBg, 
                    textColor: this.manualTextColor, isTemplate: false, type: 'pitch' };
            }
            this.annotations.push(ann);
            this.renderer.draw(this.annotations, this.currentTemplate, DOM.boardTitle.value);
        }
        
        clearAll() {
            this.annotations = [];
            this.currentTemplate = { type: null };
            this.renderer.draw(this.annotations, this.currentTemplate, DOM.boardTitle.value);
        }
        
        generateScale(key, scaleType) {
            this.clearAll();
            const intervals = getScaleIntervals(scaleType);
            const tonicIdx = NOTE_ORDER.indexOf(key);
            const notesSet = intervals.map(i => NOTE_ORDER[(tonicIdx + i) % 12]);
            this.currentTemplate = { type: 'scale', root: key, scaleType };
            
            for(let s = 0; s < 6; s++) {
                for(let f = 0; f <= 12; f++) {
                    if(notesSet.includes(getNoteAtFret(s, f))) {
                        const y = this.renderer.getStringY(s);
                        const cx = f === 0 ? (this.renderer.leftMargin - 65) : this.renderer.leftMargin + (f-0.5)*this.renderer.getFretStep();
                        this.annotations.push({ x: cx, y: y, text: "", stringIdx: s, fret: f, 
                            bgColor: getAnnColors().bg, textColor: getAnnColors().text, isTemplate: true, templateType: 'scale' });
                    }
                }
            }
            this.refreshAllTemplateStyles();
            const scaleTitle = currentLang === 'zh' 
                ? `${key}调 ${lang.scales[scaleType]||"音阶"}` 
                : `${key} ${lang.scales[scaleType]||"Scale"}`;
            this.renderer.draw(this.annotations, this.currentTemplate, scaleTitle);
            DOM.boardTitle.value = scaleTitle;
        }
        
        generateChord(key, scaleType, chordFamily, degree) {
            this.clearAll();
            const { rootNote, intervals } = getDiatonicChordIntervals(key, scaleType, degree, chordFamily);
            this.currentTemplate = {
                type: 'chord', root: rootNote, chordIntervals: intervals, family: chordFamily,
                degree: degree, scaleType: scaleType
            };
            
            const rootIdx = NOTE_ORDER.indexOf(rootNote);
            for(let s = 0; s < 6; s++) {
                for(let f = 0; f <= 12; f++) {
                    const note = getNoteAtFret(s, f);
                    const interval = (NOTE_ORDER.indexOf(note) - rootIdx + 12) % 12;
                    if(intervals.some(raw => raw % 12 === interval)) {
                        const y = this.renderer.getStringY(s);
                        const cx = f === 0 ? (this.renderer.leftMargin - 65) : this.renderer.leftMargin + (f-0.5)*this.renderer.getFretStep();
                        this.annotations.push({ x: cx, y: y, text: "", stringIdx: s, fret: f, 
                            bgColor: getAnnColors().bg, textColor: getAnnColors().text, isTemplate: true, templateType: 'chord' });
                    }
                }
            }
            this.refreshAllTemplateStyles();
            
            const roman = ["I","II","III","IV","V","VI","VII"][degree-1];
            var gAm = controller ? controller.annotationMode || 'note' : 'note';
            let suffix = gAm === 'note' ? (currentLang === 'zh' ? " (音名)" : " (Note Name)")
                : gAm === 'solfege' ? (currentLang === 'zh' ? " (唱名)" : " (Solfege)")
                : (currentLang === 'zh' ? " (音级)" : " (Interval)");
            const title = currentLang === 'zh' 
                ? `${key}调 ${lang.scales[scaleType]||"音阶"} ${roman}级${lang.chords[chordFamily]||"和弦"}${suffix}` 
                : `${key} ${lang.scales[scaleType]||"Scale"} ${roman} ${lang.chords[chordFamily]||"Chord"}${suffix}`;
            this.renderer.draw(this.annotations, this.currentTemplate, title);
            DOM.boardTitle.value = title;
        }
        
        updateManualStyle(bg, textColor, text) {
            this.manualBg = bg;
            this.manualTextColor = textColor;
            if(text !== undefined) this.manualText = text;
        }
        
        setMode(mode) { this.currentMode = mode; }
        getAnnotations() { return this.annotations; }
        
        dragUpdate(ann, newPos) {
            ann.x = newPos.x;
            ann.y = newPos.y;
            ann.stringIdx = newPos.stringIdx;
            ann.fret = newPos.fret;
            if(ann.type === 'pitch') ann.text = getNoteAtFret(ann.stringIdx, ann.fret);
            else if(ann.isTemplate) this.refreshAnnotationStyle(ann);
            this.renderer.draw(this.annotations, this.currentTemplate, DOM.boardTitle.value);
        }
        
        exportData() {
            return {
                annotations: this.annotations.map(({text, stringIdx, fret, bgColor, textColor, isTemplate, type}) => 
                    ({text, stringIdx, fret, bgColor, textColor, isTemplate, type})),
                currentTemplate: this.currentTemplate,
                tuningConfig: TUNING_CONFIG,
                boardTitle: DOM.boardTitle.value,
                keySelect: DOM.globalKey.value,
                scaleSelect: DOM.scaleMode.value,
                chordFamilySelect: DOM.chordFamily.value,
                chordDegreeSelect: DOM.chordDegree.value,
                manualText: this.manualText,
                manualBg: this.manualBg,
                manualTextColor: this.manualTextColor,
                bpm: parseInt(DOM.bpmSlider.value),
                beatPerBar: parseInt(DOM.beatPerBar.textContent),
                rhythmDiv: parseInt(DOM.rhythmSelect.value),
                accent: DOM.accentToggle.classList.contains('active'),
                timerActive: DOM.timerToggle.classList.contains('active'),
                timerMinutes: parseInt(DOM.timerMinutes.value),
                palette: G.currentPalette || 'warm-cream'
            };
        }
        
        importData(data) {
            if(data.annotations) {
                this.annotations = data.annotations.map(ann => {
                    if(ann.stringIdx !== undefined && ann.fret !== undefined) {
                        return { ...ann, 
                            x: this.renderer.leftMargin + (ann.fret - 0.5) * this.renderer.getFretStep(),
                            y: this.renderer.getStringY(ann.stringIdx) 
                        };
                    }
                    return ann;
                });
            }
            if(data.currentTemplate) this.currentTemplate = data.currentTemplate;
            if(data.tuningConfig) {
                // 原地更新属性（不改变引用），保持 local 与 G.TUNING_CONFIG 同步
                Object.assign(TUNING_CONFIG, data.tuningConfig);
                updateTuningUI();
            }
            if(data.keySelect) DOM.globalKey.value = data.keySelect;
            if(data.scaleSelect) { DOM.scaleMode.value = data.scaleSelect; updateChordDegreeOptions(); }
            if(data.chordFamilySelect) DOM.chordFamily.value = data.chordFamilySelect;
            if(data.chordDegreeSelect) DOM.chordDegree.value = data.chordDegreeSelect;
            if(data.boardTitle) DOM.boardTitle.value = data.boardTitle;
            if(data.manualText !== undefined) { this.manualText = data.manualText; DOM.labelText.value = data.manualText; }
            if(data.manualBg) { this.manualBg = data.manualBg; DOM.bgColorPicker.value = data.manualBg; }
            if(data.manualTextColor) { this.manualTextColor = data.manualTextColor; DOM.textColorPicker.value = data.manualTextColor; }
            if(data.bpm) { DOM.bpmSlider.value = data.bpm; DOM.bpmDisplay.textContent = data.bpm; }
            if(data.beatPerBar) DOM.beatPerBar.textContent = data.beatPerBar;
            if(data.rhythmDiv) DOM.rhythmSelect.value = data.rhythmDiv;
            if(data.accent !== undefined) DOM.accentToggle.classList.toggle('active', data.accent);
            if(data.timerActive !== undefined) DOM.timerToggle.classList.toggle('active', data.timerActive);
            if(data.timerMinutes) DOM.timerMinutes.value = data.timerMinutes;
            if(data.palette && G.PALETTES && G.PALETTES[data.palette]) applyPalette(data.palette);
            updateBeatSubdivDisplay();
            this.refreshAllTemplateStyles();
            this.renderer.draw(this.annotations, this.currentTemplate, DOM.boardTitle.value);
        }
    }

    // ============================================
    // 节拍器控制器类
    // ============================================

    // ============================================
    // 辅助函数
    // ============================================
    /* 当前调色板颜色缓存（由 applyPalette 写入，getAnnColors 读取）*/
    var _paletteCache = {};

    function getAnnColors() {
        // 先从缓存取，缓存为空时回退到 computedStyle
        var c = _paletteCache;
        if (c.btn) return c;
        var s = getComputedStyle(document.body);
        c.bg = s.getPropertyValue('--canvas-ann-bg').trim() || '#ffffff';
        c.text = s.getPropertyValue('--canvas-ann-text').trim() || '#1e2a1a';
        c.card = s.getPropertyValue('--color-bg-container').trim() || '#f5f5f5';
        c.panel = s.getPropertyValue('--color-bg-panel').trim() || '#e8e0d0';
        c.btn = s.getPropertyValue('--color-btn-primary').trim() || '#4a6a3b';
        c.accent = s.getPropertyValue('--color-toggle-on').trim() || '#e68a2e';
        c.muted = s.getPropertyValue('--color-text-secondary').trim() || '#8b7a65';
        c.danger = s.getPropertyValue('--color-btn-danger').trim() || '#a1220a';
        return c;
    }

    function redrawAllFretboards(refreshTemplates) {
        if (G.fretboardMgr) {
            G.fretboardMgr.getAll().forEach(function(fb) {
                try {
                    // 如果调音变化，重新根据新定音计算音阶/和弦标注位置
                    if (refreshTemplates && fb.controller.currentTemplate && fb.controller.currentTemplate.type) {
                        var t = fb.controller.currentTemplate;
                        if (t.type === 'scale') {
                            fb.controller.generateScale(t.root, t.scaleType);
                        } else if (t.type === 'chord') {
                            fb.controller.generateChord(t.root, t.scaleType, t.family, t.degree);
                        }
                    } else if (refreshTemplates) {
                        fb.controller.refreshAllTemplateStyles();
                    }
                    // 重绘
                    fb.renderer.draw(fb.controller.getAnnotations(), fb.controller.currentTemplate, fb.boardTitle || '');
                } catch(ex) {}
            });
        } else if (renderer && controller) {
            try {
                if (refreshTemplates && controller.currentTemplate && controller.currentTemplate.type) {
                    var t = controller.currentTemplate;
                    if (t.type === 'scale') {
                        controller.generateScale(t.root, t.scaleType);
                    } else if (t.type === 'chord') {
                        controller.generateChord(t.root, t.scaleType, t.family, t.degree);
                    }
                } else if (refreshTemplates) {
                    controller.refreshAllTemplateStyles();
                }
                renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
            } catch(ex) {}
        }
    }

    function regenerateActiveFretboard() {
        if (!controller || !renderer) return;
        if (controller.currentTemplate && controller.currentTemplate.type) {
            var t = controller.currentTemplate;
            if (t.type === 'scale') {
                controller.generateScale(t.root, t.scaleType);
            } else if (t.type === 'chord') {
                controller.generateChord(t.root, t.scaleType, t.family, t.degree);
            }
        } else {
            controller.refreshAllTemplateStyles();
            renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        }
    }

    function applyPresetTuning(presetKey) {
        const preset = PRESET_TUNINGS[presetKey];
        if(!preset) return;
        TUNING_CONFIG.name = preset.name;
        for(let i = 0; i < 6; i++) {
            TUNING_CONFIG.strings[i].openNote = preset.strings[i];
        }
        updateTuningUI(presetKey);
        regenerateActiveFretboard();
    }

    function updateTuningUI(presetKey) {
        // 只有未传递presetKey时才设置为custom
        DOM.tuningPreset.value = presetKey || 'custom';
        for(let i = 0; i < 6; i++) {
            if(DOM.stringSelects[i]) DOM.stringSelects[i].value = TUNING_CONFIG.strings[i].openNote;
        }
    }

    function syncTuningFromUI() {
        const preset = DOM.tuningPreset.value;
        if(preset !== 'custom') {
            applyPresetTuning(preset);
            return;
        }
        for(let i = 0; i < 6; i++) {
            if(DOM.stringSelects[i]) TUNING_CONFIG.strings[i].openNote = DOM.stringSelects[i].value;
        }
        TUNING_CONFIG.name = "自定义 (" + TUNING_CONFIG.strings.map(s => s.openNote).join("-") + ")";
        regenerateActiveFretboard();
    }

    function updateChordDegreeOptions() {
        const scaleType = DOM.scaleMode.value;
        const noteCount = getScaleNoteCount(scaleType);
        const romanNumerals = ["I","II","III","IV","V","VI","VII"];
        const currentValue = DOM.chordDegree.value;

        DOM.chordDegree.innerHTML = '';
        for(let i = 1; i <= noteCount; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = romanNumerals[i-1] + ' 级';
            DOM.chordDegree.appendChild(opt);
        }
        DOM.chordDegree.value = parseInt(currentValue) > noteCount ? '1' : currentValue;
    }

    // 节拍器状态持久化（每次变更都保存，独立于自动存档）
    function saveMetroState() {
        try {
            localStorage.setItem('guitarfb_metro', JSON.stringify({
                bpm: metro ? metro.bpm : 90,
                beat: metro ? metro.beatPerBar : 4,
                rhythm: metro ? metro.rhythmDiv : 1,
                accent: DOM.accentToggle ? DOM.accentToggle.classList.contains('active') : true,
                timer: DOM.timerToggle ? DOM.timerToggle.classList.contains('active') : false,
                minutes: DOM.timerMinutes ? parseInt(DOM.timerMinutes.value) || 1 : 1
            }));
        } catch(ex) {}
    }

    function updateBeatSubdivDisplay() {
        const beatPerBar = parseInt(DOM.beatPerBar.textContent);
        const rhythmDiv = parseInt(DOM.rhythmSelect.value);
        
        [DOM.beatSubdivDisplay, DOM.beatSubdivDisplayMobile].forEach(display => {
            if(!display) return;
            display.innerHTML = '';
            const total = beatPerBar * rhythmDiv;
            for(let i = 0; i < total; i++) {
                const div = document.createElement('div');
                div.className = 'beat-subdiv' + (i % rhythmDiv === 0 ? ' accent' : '');
                display.appendChild(div);
            }
        });
    }

    function resetAll() {
        // 1. 停止节拍器
        if (metro && metro.active) metro.stop();

        // 2. 重置多指板（保留 1 个初始指板）
        if (G.fretboardMgr) {
            G.fretboardMgr.resetAll();
            renderer = G.fretboardMgr.getActive().renderer;
            controller = G.fretboardMgr.getActive().controller;
        } else {
            controller.clearAll();
        }

        // 3. 重置调音为标准调音
        applyPresetTuning('standard');

        // 4. 重置参数面板
        DOM.globalKey.value = 'C';
        DOM.scaleMode.value = 'major';
        DOM.chordFamily.value = 'triad';
        DOM.chordDegree.value = '1';
        updateChordDegreeOptions();

        // 5. 重置标题
        DOM.boardTitle.value = currentLang === 'zh' ? '吉他指板练习' : 'Guitar Fretboard';

        // 6. 重置节拍器
        metro.setBpm(90);
        metro.setBeatPerBar(4);
        metro.setRhythmDiv(1);
        metro.accent = true;
        DOM.accentToggle.classList.add('active');
        metro.timerActive = false;
        DOM.timerToggle.classList.remove('active');
        DOM.timerMinutes.value = 1;
        updateBeatSubdivDisplay();

        // 7. 不重置调色板（保留当前 pattern 选择）

        // 8. 清除自动保存
        if (G.autoSave) G.autoSave.clear();

        // 9. 重新绘制
        if (renderer) renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
    }

    // ============================================
    // Canvas 交互事件处理（提升到顶层，供 FretboardManager 和 bindEvents 共享）
    // ============================================
    var dragIndex = -1, isDragging = false;

    function getCoords(e) {
        var cvs = renderer ? renderer.canvas : null;
        if (!cvs) return { mx:0, my:0 };
        var rect = cvs.getBoundingClientRect();
        var sx = renderer._logicalWidth / rect.width;
        var sy = renderer._logicalHeight / rect.height;
        var cx = e.clientX, cy = e.clientY;
        var mx = (cx - rect.left) * sx;
        var my = (cy - rect.top) * sy;
        mx = Math.min(renderer._logicalWidth - renderer.rightMargin + 20, Math.max(renderer.leftMargin - 30, mx));
        my = Math.min(renderer._logicalHeight - renderer.bottomMargin + 20, Math.max(renderer.topMargin - 15, my));
        return { mx: mx, my: my };
    }

    function handlePointerDown(e) {
        if (!renderer || !controller) return;
        // 只响应激活指板
        if (G.fretboardMgr) {
            var fb = G.fretboardMgr.getActive();
            if (!fb || e.currentTarget !== fb.canvas) return;
        }
        // 标注开关关闭时不做任何事
        if (!annotationEnabled) return;
        e.preventDefault();
        var cvs = renderer.canvas;
        try { if (cvs) cvs.setPointerCapture(e.pointerId); } catch(ex) {}
        var pos = getCoords(e);
        if (!pos) return;
        var coord = renderer.getStringAndFretFromCoord(pos.mx, pos.my);
        if (!coord) return;
        var anns = controller.getAnnotations();
        var hit = anns.findIndex(function(a) { return Math.hypot(a.x - pos.mx, a.y - pos.my) < 32; });
        if (hit !== -1) { dragIndex = hit; isDragging = true; }
        else { controller.addOrReplaceAnnotation(coord, controller.currentMode === 'manual'); }
        renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        // 标记已处理，防止 click 事件再次触发激活切换
        if (G.fretboardMgr) G.fretboardMgr._clickHandled = true;
    }

    function handlePointerMove(e) {
        if (!isDragging || dragIndex === -1 || !renderer) return;
        e.preventDefault();
        var pos = getCoords(e);
        var newPos = renderer.getStringAndFretFromCoord(pos.mx, pos.my);
        if (newPos) {
            var oldAnn = controller.getAnnotations()[dragIndex];
            if (oldAnn && (oldAnn.stringIdx !== newPos.stringIdx || oldAnn.fret !== newPos.fret)) {
                controller.dragUpdate(oldAnn, newPos);
            }
        }
    }

    function handlePointerUp() { isDragging = false; dragIndex = -1; }

    function handleDoubleClick(e) {
        e.preventDefault();
        if (!renderer || !controller) return;
        var pos = getCoords(e);
        var anns = controller.getAnnotations();
        for (var i = 0; i < anns.length; i++) {
            if (Math.hypot(anns[i].x - pos.mx, anns[i].y - pos.my) < 32) {
                anns.splice(i, 1);
                renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
                break;
            }
        }
    }

    function syncModeUI() {
        var m = controller ? controller.annotationMode || 'note' : 'note';
        document.querySelectorAll('.mode-btn[data-mode]').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.mode === m);
        });
    }

    // ——— 激活保护 ———
    var _toastTimer = null;
    function showToast(msg) {
        var t = document.getElementById('fretboard-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'fretboard-toast';
            t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;text-align:center;max-width:90%;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        if (_toastTimer) clearTimeout(_toastTimer);
        _toastTimer = setTimeout(function() { t.style.opacity = '0'; }, 2000);
    }
    function requireActiveFretboard(msg) {
        var hasActive = G.fretboardMgr && G.fretboardMgr.activeIdx >= 0;
        if (!hasActive) {
            showToast(msg || (currentLang === 'zh' ? '请先点击一个指板以激活' : 'Please select a fretboard first'));
            return false;
        }
        return true;
    }
    function isInteractive(el) {
        if (!el) return false;
        return el.closest('button, select, input, a, label, .metro-btn, .gen-btn, .mode-btn, .toggle-switch, .lang-toggle, .theme-toggle');
    }

    function setAnnotationMode(mode) {
        if (!requireActiveFretboard()) return;
        if (controller) {
            controller.annotationMode = mode;
            controller.refreshAllTemplateStyles();
            controller.renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        }
        syncModeUI();
    }

    // ============================================
    // 事件绑定 - 使用事件委托优化
    // ============================================
    function bindEvents() {
        // 语言/主题切换
        // 标注开关（toggle switch）
        DOM.annotationToggle = document.getElementById('annotationToggle');
        DOM.annotationToggleMobile = document.getElementById('annotationToggleMobile');
        function toggleAnnotation() {
            annotationEnabled = !annotationEnabled;
            if (DOM.annotationToggle) DOM.annotationToggle.classList.toggle('active', annotationEnabled);
            if (DOM.annotationToggleMobile) DOM.annotationToggleMobile.classList.toggle('active', annotationEnabled);
        }
        DOM.annotationToggle?.addEventListener('click', toggleAnnotation);
        DOM.annotationToggleMobile?.addEventListener('click', toggleAnnotation);
        
        DOM.langToggle.addEventListener('click', switchLanguage);
        DOM.paletteToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            var panel = DOM.palettePanel;
            if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
        });
        // 点击面板外部关闭
        document.addEventListener('click', function(e) {
            var panel = DOM.palettePanel;
            if (panel && panel.style.display !== 'none' &&
                !panel.contains(e.target) && e.target.id !== 'paletteToggle') {
                panel.style.display = 'none';
            }
        });
        
        // 标注模式切换（事件委托）
        document.getElementById('genBtnGroup')?.addEventListener('click', function(e) {
            var btn = e.target.closest('.mode-btn[data-mode]');
            if (btn) {
                console.log('[Mode] clicked: ' + btn.dataset.mode + ', activeIdx=' + (G.fretboardMgr ? G.fretboardMgr.activeIdx : -1));
                setAnnotationMode(btn.dataset.mode);
            }
        });
        
        // 点击面板外部关闭调音面板
        document.addEventListener('click', function(e) {
            var tp = DOM.tuningPanel;
            if (!tp || !tp.classList.contains('open')) return;
            if (!tp.contains(e.target) && !e.target.closest('.fretboard-tune')) {
                tp.classList.remove('open');
                tp.style.display = 'none';
                // 重置所有调音按钮图标为 ▼
                document.querySelectorAll('.fretboard-tune').forEach(function(btn) {
                    btn.innerHTML = '𝄞 ▼';
                    btn.classList.remove('active');
                });
            }
        });
        
        DOM.tuningPreset.addEventListener('change', function(e) {
            applyPresetTuning(e.target.value);
        });
        
        // 弦选择器 - 事件委托
        DOM.stringSelects.forEach(sel => {
            if(sel) sel.addEventListener('change', () => {
                DOM.tuningPreset.value = 'custom';
                syncTuningFromUI();
            });
        });
        
        // 生成按钮 - 使用事件委托优化
        document.querySelector('.btn-group')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.gen-btn');
            if (!btn) return;
            
            if (!requireActiveFretboard()) return;
            const key = DOM.globalKey.value;
            const scale = DOM.scaleMode.value;
            const chord = DOM.chordFamily.value;
            const degree = parseInt(DOM.chordDegree.value);
            
            switch(btn.id) {
                case 'genScaleBtn':
                    controller.generateScale(key, scale);
                    break;
                case 'genChordBtn':
                    controller.generateChord(key, scale, chord, degree);
                    break;
            }
        });
        
        // 点击空白区域 → 保存状态 + 取消激活
        document.addEventListener('click', function(e) {
            if (!G.fretboardMgr) return;
            if (isInteractive(e.target)) return;
            var container = DOM.fretboardContainer;
            if (container && !container.contains(e.target)) {
                // 先保存当前激活指板的状态
                var old = G.fretboardMgr.getActive();
                if (old) G.fretboardMgr._saveState(old);
                G.fretboardMgr.list.forEach(function(f) {
                    f.canvas.classList.remove('fretboard-active');
                    if (f._wrapper) f._wrapper.classList.remove('show-buttons');
                });
                G.fretboardMgr.activeIdx = -1;
            }
        });
        
        // 下拉菜单变更 → 自动重新生成（如果当前指板有模板）
        G._suppressAutoGen = false;
        function autoRegenerate() {
            if (G._suppressAutoGen) return;
            if (!requireActiveFretboard()) return;
            if (!controller || !controller.currentTemplate || !controller.currentTemplate.type) return;
            var k = DOM.globalKey.value, s = DOM.scaleMode.value;
            if (controller.currentTemplate.type === 'scale') {
                controller.generateScale(k, s);
            } else if (controller.currentTemplate.type === 'chord') {
                var c = DOM.chordFamily.value, d = parseInt(DOM.chordDegree.value);
                controller.generateChord(k, s, c, d);
            }
        }
        DOM.globalKey.addEventListener('change', autoRegenerate);
        DOM.scaleMode.addEventListener('change', autoRegenerate);
        DOM.chordFamily.addEventListener('change', autoRegenerate);
        DOM.chordDegree.addEventListener('change', autoRegenerate);
        
        // 🗑️ 清除标注（仅清除当前指板的标注）
        DOM.clearAllBtn.addEventListener('click', function() {
            if (!requireActiveFretboard()) return;
            if (controller) controller.clearAll();
        });
        // 🗑️ 全部清空（重置所有+清除自动保存）
        DOM.fretboardAddBtn.addEventListener('click', resetAll);
        DOM.exportAllImage.addEventListener('click', function() {
            if (!G.fretboardMgr) return;
            var merged = G.fretboardMgr.exportAllAsCanvas();
            var a = document.createElement('a');
            a.download = 'fretboards-all.png';
            a.href = merged.toDataURL();
            a.click();
        });
        
        // 音阶变化更新级数选项
        DOM.scaleMode.addEventListener('change', updateChordDegreeOptions);
        
        // 标注模式同步 - 修复UI状态切换
        const syncManualActive = (isActive) => {
            // 移除所有active状态
            [DOM.modeManual, DOM.modeManualMobile].forEach(el => {
                if(el) {
                    el.classList.remove('active');
                    el.style.background = '';
                }
            });
            [DOM.modePitch, DOM.modePitchMobile].forEach(el => {
                if(el) {
                    el.classList.remove('active');
                    el.style.background = '';
                }
            });
            
            // 添加active状态到对应按钮
            if(isActive) {
                [DOM.modeManual, DOM.modeManualMobile].forEach(el => {
                    if(el) el.classList.add('active');
                });
            } else {
                [DOM.modePitch, DOM.modePitchMobile].forEach(el => {
                    if(el) el.classList.add('active');
                });
            }
            
            controller.setMode(isActive ? 'manual' : 'pitch');
        };
        
        // 绑定点击事件
        DOM.modeManual?.addEventListener('click', () => syncManualActive(true));
        DOM.modeManualMobile?.addEventListener('click', () => syncManualActive(true));
        DOM.modePitch?.addEventListener('click', () => syncManualActive(false));
        DOM.modePitchMobile?.addEventListener('click', () => syncManualActive(false));
        
        // 文本输入同步
        if(DOM.labelText && DOM.labelTextMobile) {
            DOM.labelTextMobile.value = DOM.labelText.value;
            DOM.labelText.addEventListener('input', () => { DOM.labelTextMobile.value = DOM.labelText.value; });
            DOM.labelTextMobile.addEventListener('input', () => { DOM.labelText.value = DOM.labelTextMobile.value; });
        }
        
        // 颜色选择
        const getActiveLabelText = () => (window.innerWidth <= 800 ? DOM.labelTextMobile : DOM.labelText);
        const updateStyleFromInputs = () => {
            const activeLabel = getActiveLabelText();
            controller.updateManualStyle(DOM.bgColorPicker.value, DOM.textColorPicker.value, activeLabel?.value);
        };
        
        // 手机端颜色拾色器同步到桌面端
        if (DOM.bgColorPickerMobile && DOM.textColorPickerMobile) {
            DOM.bgColorPickerMobile.addEventListener('input', function() {
                DOM.bgColorPicker.value = this.value;
                DOM.bgColorPicker.dispatchEvent(new Event('input'));
            });
            DOM.textColorPickerMobile.addEventListener('input', function() {
                DOM.textColorPicker.value = this.value;
                DOM.textColorPicker.dispatchEvent(new Event('input'));
            });
        }
        
        DOM.bgColorPicker.addEventListener('input', updateStyleFromInputs);
        DOM.textColorPicker.addEventListener('input', updateStyleFromInputs);
        DOM.labelText?.addEventListener('input', updateStyleFromInputs);
        DOM.labelTextMobile?.addEventListener('input', updateStyleFromInputs);
        
        // 颜色预设按钮 - 事件委托（两端共享，取桌面端 picker 值同步）
        document.querySelectorAll('.color-preset').forEach(function(group) {
            group.addEventListener('click', function(e) {
                var btn = e.target.closest('.color-btn');
                if (btn) {
                    DOM.bgColorPicker.value = btn.dataset.bg;
                    DOM.textColorPicker.value = btn.dataset.text;
                    if (DOM.bgColorPickerMobile) DOM.bgColorPickerMobile.value = btn.dataset.bg;
                    if (DOM.textColorPickerMobile) DOM.textColorPickerMobile.value = btn.dataset.text;
                    updateStyleFromInputs();
                }
            });
        });
        
        updateStyleFromInputs();
        
        // 导出/导入 - 使用事件委托优化
        document.querySelector('.export-row')?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            
            const sanitizeTitle = () => DOM.boardTitle.value.replace(/[\\/:*?"<>|]/g, '') || "fretboard";
            
            switch(btn.id) {
                case 'exportImage':
                    {
                        let t = sanitizeTitle();
                        let a = document.createElement('a');
                        a.download = t + ".png";
                        a.href = renderer ? renderer.canvas.toDataURL() : '';
                        a.click();
                    }
                    break;
                case 'exportData':
                    try {
                        let t = sanitizeTitle();
                        let data = G.fretboardMgr ? G.fretboardMgr.exportAll() : controller.exportData();
                        let blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                        let url = URL.createObjectURL(blob);
                        let a = document.createElement('a');
                        a.href = url;
                        a.download = t + ".json";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    } catch(ex) { alert('导出失败：' + ex.message); }
                    break;
                case 'importBtn':
                    DOM.importFile.click();
                    break;
            }
        });
        DOM.importFile.onchange = (e) => {
            if (!e.target.files[0]) return;
            var file = e.target.files[0];
            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    var d = JSON.parse(ev.target.result);
                    // 多指板格式（v8+）
                    if (d.fretboards && G.fretboardMgr) {
                        G.fretboardMgr.importAll(d);
                        if (d.bpm) metro.setBpm(d.bpm);
                        if (d.beatPerBar) metro.setBeatPerBar(d.beatPerBar);
                        if (d.rhythmDiv) metro.setRhythmDiv(d.rhythmDiv);
                        if (d.accent !== undefined) DOM.accentToggle.classList.toggle('active', d.accent);
                        if (d.timerActive !== undefined) DOM.timerToggle.classList.toggle('active', d.timerActive);
                        if (d.timerMinutes) DOM.timerMinutes.value = d.timerMinutes;
                    } else {
                        // 旧格式（单指板）
                        var s = d.state || d;
                        controller.importData(s);
                        if (s.bpm) metro.setBpm(s.bpm);
                        if (s.beatPerBar) metro.setBeatPerBar(s.beatPerBar);
                        if (s.rhythmDiv) metro.setRhythmDiv(s.rhythmDiv);
                        if (s.accent !== undefined) DOM.accentToggle.classList.toggle('active', s.accent);
                        if (s.timerActive !== undefined) DOM.timerToggle.classList.toggle('active', s.timerActive);
                        if (s.timerMinutes) DOM.timerMinutes.value = s.timerMinutes;
                    }
                    updateBeatSubdivDisplay();
                    // importAll 内部已绘制，但旧格式需要手动绘制
                    if (!(d.fretboards && G.fretboardMgr) && renderer) {
                        renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
                    }
                } catch(ex) { alert('导入失败：' + ex.message); }
            };
            reader.onerror = function() { alert('无法读取文件'); };
            reader.readAsText(file);
        };
        
        // 节拍器
        DOM.bpmSlider.addEventListener('input', (e) => { metro.setBpm(parseInt(e.target.value)); saveMetroState(); });
        DOM.bpmDisplay.addEventListener('dblclick', () => {
            let v = prompt("BPM 30-240", metro.bpm);
            if(v) { let nb = parseInt(v); if(nb >= 30 && nb <= 240) metro.setBpm(nb); saveMetroState(); }
        });
        DOM.beatDown.addEventListener('click', () => { metro.setBeatPerBar(metro.beatPerBar - 1); saveMetroState(); });
        DOM.beatUp.addEventListener('click', () => { metro.setBeatPerBar(metro.beatPerBar + 1); saveMetroState(); });
        DOM.rhythmSelect.addEventListener('change', (e) => { metro.setRhythmDiv(parseInt(e.target.value)); saveMetroState(); });
        DOM.accentToggle.addEventListener('click', () => { metro.toggleAccent(); saveMetroState(); });
        DOM.timerToggle.addEventListener('click', () => { metro.toggleTimer(); saveMetroState(); });
        DOM.metroStartStop.addEventListener('click', () => metro.active ? metro.stop() : metro.start());
        DOM.metroTap.addEventListener('click', () => metro.tapTempo());
        
        // 全局键盘快捷键
        document.addEventListener('keydown', (e) => {
            if(e.key === ' ' || e.key === 'Space') {
                e.preventDefault();
                metro.active ? metro.stop() : metro.start();
            }
            if(e.key === 'ArrowUp') {
                e.preventDefault();
                metro.setBpm(metro.bpm + 1);
            }
            if(e.key === 'ArrowDown') {
                e.preventDefault();
                metro.setBpm(metro.bpm - 1);
            }
        });

    }

    // ============================================
    // 初始化
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        try {
        // 缓存DOM元素
        cacheDOMElements();
        
        // 初始化多指板管理器
        metro = new MetronomeController();
        G.metro = metro;
        if (G.FretboardManager && DOM.fretboardContainer) {
            G.fretboardMgr = new G.FretboardManager(DOM.fretboardContainer, {
                onSwitch: function(fb) {
                    renderer = fb.renderer;
                    controller = fb.controller;
                    syncModeUI();
                },
                onCanvasCreated: function(canvas) {
                    // 为每个指板的 Canvas 绑定交互事件
                    canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
                    canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
                    canvas.addEventListener('pointerup', handlePointerUp);
                    canvas.addEventListener('pointercancel', handlePointerUp);
                    canvas.addEventListener('dblclick', handleDoubleClick);
                }
            });
            // 创建默认指板
            G.fretboardMgr.add({ name: '指板 1' });
            G.fretboardMgr.activate(0);
        }
        
        // 配色面板初始化（必须先于自动保存，以便恢复后覆盖）
        initPalettePanel();

        // 单独恢复节拍器状态（独立于自动存档，确保始终恢复）
        try {
            var metroRaw = localStorage.getItem('guitarfb_metro');
            if (metroRaw) {
                var md = JSON.parse(metroRaw);
                if (md.bpm) metro.setBpm(md.bpm);
                if (md.beat) metro.setBeatPerBar(md.beat);
                if (md.rhythm) metro.setRhythmDiv(md.rhythm);
                if (md.accent !== undefined) DOM.accentToggle.classList.toggle('active', md.accent);
                if (md.timer !== undefined) DOM.timerToggle.classList.toggle('active', md.timer);
                if (md.minutes) DOM.timerMinutes.value = md.minutes;
            }
        } catch(ex) {}

        // 自动保存恢复
        var _restoreOk = false;
        if (G.AutoSaveManager && G.fretboardMgr) {
            G.autoSave = new G.AutoSaveManager(G.fretboardMgr);
            _restoreOk = G.autoSave.restore();
            // 恢复后同步语言按钮和界面
            if (G.currentLang !== currentLang) {
                currentLang = G.currentLang;
                lang = LANG[currentLang];
                DOM.langToggle.innerText = currentLang === 'zh' ? 'EN' : '中文';
                updateI18N();
                updateSelectOptions();
            }
            // 兼容 Safari：pagehide 和 beforeunload 双重保险
            window.addEventListener('beforeunload', () => G.autoSave.save());
            window.addEventListener('pagehide', () => G.autoSave.save());
        }
        
        // 恢复后刷新标注颜色 + 重绘所有指板（包括未激活的）
        if (G.fretboardMgr) {
            G.fretboardMgr.getAll().forEach(function(fb) {
                if (fb.controller) fb.controller.refreshAllTemplateStyles();
                fb.renderer.draw(fb.controller.getAnnotations(), fb.controller.currentTemplate, fb.boardTitle || '');
            });
            // 同步标题输入框到当前激活指板
            var active = G.fretboardMgr.getActive();
            if (active && active.boardTitle) DOM.boardTitle.value = active.boardTitle;
        }
        // 恢复后同步标注模式按钮和语言
        syncModeUI();
        
        // 绑定事件
        bindEvents();
        
        // 初始化节拍器状态（仅在无自动保存时设置默认值）
        if (!_restoreOk) {
            DOM.accentToggle.classList.add('active');
            metro.setBeatPerBar(4);
            metro.setBpm(90);
            metro.setRhythmDiv(1);
        }
        updateBeatSubdivDisplay();
        
        // 初始化select选项文本
        updateSelectOptions();
        
        // 初始绘制
        renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        
        } catch(e) {
            console.error('=== GuitarFB 初始化失败 ===', e);
            alert('初始化出错：' + e.message + '\n请查看控制台(F12)获取详细错误信息');
        }
    });
// Expose runtime state & classes for other modules
    G.DOM = DOM;
    G.currentLang = currentLang;
    G.lang = lang;
    G.currentTheme = currentTheme;
    G.currentPalette = 'warm-cream';
    G.FretboardRenderer = FretboardRenderer;
    G.FretboardController = FretboardController;
    G.updateTuningUI = updateTuningUI;
    G.updateBeatSubdivDisplay = updateBeatSubdivDisplay;
})(window.GuitarFB = window.GuitarFB || {});
