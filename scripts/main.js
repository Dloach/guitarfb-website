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
    const getNumberForNote = G.getNumberForNote;
    const getScaleNoteCount = G.getScaleNoteCount;
    const getDiatonicChordIntervals = G.getDiatonicChordIntervals;
    const MetronomeController = G.MetronomeController;
    let currentLang = 'zh';
    let lang = LANG[currentLang];
    let currentTheme = 'light';
    let renderer, controller, metro;
    const DOM = {};
    
    function cacheDOMElements() {
        DOM.canvas = document.getElementById('guitarCanvas');
        DOM.boardTitle = document.getElementById('boardTitle');
        DOM.langToggle = document.getElementById('langToggle');
        DOM.themeToggle = document.getElementById('themeToggle');
        
        // 调音相关
        DOM.tuningToggle = document.getElementById('tuningToggle');
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
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        lang = LANG[currentLang];
        
        // 更新语言切换按钮
        DOM.langToggle.innerText = currentLang === 'zh' ? 'EN' : '中文';
        
        // 更新主题按钮提示
        DOM.themeToggle.title = currentTheme === 'light' ? lang.darkMode : lang.lightMode;
        
        // 使用data-i18n自动更新
        updateI18N();
        
        // 更新调音面板
        DOM.tuningToggle.innerHTML = `<span>🎵</span> ${lang.tuning} <span class="arrow">▼</span>`;
        document.querySelector('.tuning-preset label').innerText = lang.preset + ':';
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
        
        // 更新标题（如果是自动生成的）
        updateAutoTitle();
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
                const isSolfege = controller.currentTemplate.isSolfegeMode;
                const isNoteName = controller.currentTemplate.isNoteNameMode;
                let suffix;
                if(isNoteName) {
                    suffix = currentLang === 'zh' ? " (音名)" : " (Note Name)";
                } else if(isSolfege) {
                    suffix = currentLang === 'zh' ? " (唱名)" : " (Solfege)";
                } else {
                    suffix = currentLang === 'zh' ? " (音级)" : " (Interval)";
                }
                const chordTitle = currentLang === 'zh' 
                    ? `${controller.currentTemplate.root}调 ${lang.scales[controller.currentTemplate.scaleType]||"音阶"} ${roman}级${lang.chords[controller.currentTemplate.family]||"和弦"}${suffix}` 
                    : `${controller.currentTemplate.root} ${lang.scales[controller.currentTemplate.scaleType]||"Scale"} ${roman} ${lang.chords[controller.currentTemplate.family]||"Chord"}${suffix}`;
                DOM.boardTitle.value = chordTitle;
                controller.renderer.draw(controller.annotations, controller.currentTemplate, chordTitle);
            }
        }
    }

    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', currentTheme);
        DOM.themeToggle.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
        DOM.themeToggle.title = currentTheme === 'light' ? lang.darkMode : lang.lightMode;
        if(controller) {
            controller.renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        }
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
            this.leftMargin = 126;
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
            
            // 弦标签
            this.ctx.font = "bold 18px 'Segoe UI'";
            this.ctx.fillStyle = colors.subText;
            const stringLabels = ["E (1st)","B","G","D","A","E (6th)"];
            for(let i = 0; i < 6; i++) {
                const tuningNote = TUNING_CONFIG.strings[i].openNote;
                this.ctx.fillText(tuningNote + " (" + stringLabels[i] + ")", 
                    this.leftMargin - 100, this.getStringY(i) + 7);
            }
            
            // 标注
            for(let a of annotations) {
                this.ctx.beginPath();
                this.ctx.arc(a.x, a.y, 29, 0, Math.PI*2);
                this.ctx.fillStyle = a.bgColor || colors.annBg;
                this.ctx.fill();
                this.ctx.strokeStyle = colors.annBorder;
                this.ctx.lineWidth = 1.8;
                this.ctx.stroke();
                this.ctx.font = "bold 28px 'Segoe UI'";
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
            this.manualBg = "#ff4444";
            this.manualTextColor = "#ffffff";
        }
        
        refreshAnnotationStyle(ann) {
            if(!ann.isTemplate) return;
            const tmpl = this.currentTemplate;
            
            if(tmpl.type === 'scale') {
                const note = getNoteAtFret(ann.stringIdx, ann.fret);
                ann.text = note;
                const isRoot = (note === tmpl.root);
                ann.bgColor = isRoot ? "#cc3333" : "#f0f0f0";
                ann.textColor = isRoot ? "#ffffff" : "#2c2c2c";
            } else if(tmpl.type === 'chord' && tmpl.chordIntervals) {
                const curNote = getNoteAtFret(ann.stringIdx, ann.fret);
                if(tmpl.isNoteNameMode) {
                    ann.text = curNote;
                    const isRoot = (curNote === tmpl.root);
                    ann.bgColor = isRoot ? "#cc3333" : "#c8e6c9";
                    ann.textColor = isRoot ? "#ffffff" : "#1b5e20";
                } else if(tmpl.isSolfegeMode) {
                    const scaleIntervals = getScaleIntervals(tmpl.scaleType);
                    ann.text = getNumberForNote(curNote, tmpl.baseTonic, scaleIntervals);
                    const isRoot = (curNote === tmpl.root);
                    ann.bgColor = isRoot ? "#cc3333" : "#b8d9e6";
                    ann.textColor = isRoot ? "#ffffff" : "#1e2a1a";
                } else {
                    const rootIdx = NOTE_ORDER.indexOf(tmpl.root);
                    const noteIdx = NOTE_ORDER.indexOf(curNote);
                    let interval = (noteIdx - rootIdx + 12) % 12;
                    let isChordTone = tmpl.chordIntervals.some(raw => (raw % 12) === interval);
                    if(isChordTone) {
                        ann.text = intervalToLabel(interval);
                        ann.bgColor = interval === 0 ? "#cc3333" : "#f9e0a0";
                        ann.textColor = interval === 0 ? "#ffffff" : "#2c2c2c";
                    } else {
                        ann.text = curNote;
                        const c = this.renderer._getCanvasColors();
                        ann.bgColor = c.annBg;
                        ann.textColor = c.annText;
                    }
                }
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
                for(let f = 1; f <= 12; f++) {
                    if(notesSet.includes(getNoteAtFret(s, f))) {
                        const y = this.renderer.getStringY(s);
                        const cx = this.renderer.leftMargin + (f-0.5)*this.renderer.getFretStep();
                        this.annotations.push({ x: cx, y: y, text: "", stringIdx: s, fret: f, 
                            bgColor: "#ffffff", textColor: "#1e2a1a", isTemplate: true, templateType: 'scale' });
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
        
        generateChordBase(key, scaleType, chordFamily, degree, isSolfege, isNoteName) {
            this.clearAll();
            const { rootNote, intervals } = getDiatonicChordIntervals(key, scaleType, degree, chordFamily);
            this.currentTemplate = {
                type: 'chord', root: rootNote, chordIntervals: intervals, family: chordFamily, 
                degree, scaleType, isSolfegeMode: isSolfege, isNoteNameMode: isNoteName, 
                baseTonic: key, scaleTypeForSolfege: scaleType
            };
            
            const rootIdx = NOTE_ORDER.indexOf(rootNote);
            for(let s = 0; s < 6; s++) {
                for(let f = 1; f <= 12; f++) {
                    const note = getNoteAtFret(s, f);
                    const interval = (NOTE_ORDER.indexOf(note) - rootIdx + 12) % 12;
                    if(intervals.some(raw => raw % 12 === interval)) {
                        const y = this.renderer.getStringY(s);
                        const cx = this.renderer.leftMargin + (f-0.5)*this.renderer.getFretStep();
                        this.annotations.push({ x: cx, y: y, text: "", stringIdx: s, fret: f, 
                            bgColor: "#ffffff", textColor: "#1e2a1a", isTemplate: true, templateType: 'chord' });
                    }
                }
            }
            this.refreshAllTemplateStyles();
            
            const roman = ["I","II","III","IV","V","VI","VII"][degree-1];
            let suffix = isNoteName ? (currentLang === 'zh' ? " (音名)" : " (Note Name)") 
                : isSolfege ? (currentLang === 'zh' ? " (唱名)" : " (Solfege)") 
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
                theme: currentTheme
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
            if(data.theme) {
                currentTheme = data.theme;
                document.body.setAttribute('data-theme', currentTheme);
                DOM.themeToggle.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
            }
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
    function applyPresetTuning(presetKey) {
        const preset = PRESET_TUNINGS[presetKey];
        if(!preset) return;
        TUNING_CONFIG.name = preset.name;
        for(let i = 0; i < 6; i++) {
            TUNING_CONFIG.strings[i].openNote = preset.strings[i];
        }
        updateTuningUI(presetKey); // 传递预设key，避免被覆盖为custom
        renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
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
        renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
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

        // 2. 清空指板
        controller.clearAll();

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

        // 7. 重置主题为浅色
        if (currentTheme !== 'light') toggleTheme();

        // 8. 清除自动保存
        if (G.autoSave) G.autoSave.clear();

        // 9. 重新绘制
        renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
    }

    // ============================================
    // 事件绑定 - 使用事件委托优化
    // ============================================
    function bindEvents() {
        // 语言/主题切换
        DOM.langToggle.addEventListener('click', switchLanguage);
        DOM.themeToggle.addEventListener('click', toggleTheme);
        
        // 调音面板
        DOM.tuningToggle.addEventListener('click', () => {
            DOM.tuningToggle.classList.toggle('active');
            DOM.tuningPanel.classList.toggle('open');
            DOM.mainPanel.classList.toggle('shift-down');
        });
        
        DOM.tuningPreset.addEventListener('change', (e) => applyPresetTuning(e.target.value));
        
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
            
            const key = DOM.globalKey.value;
            const scale = DOM.scaleMode.value;
            const chord = DOM.chordFamily.value;
            const degree = parseInt(DOM.chordDegree.value);
            
            switch(btn.id) {
                case 'genScaleBtn':
                    controller.generateScale(key, scale);
                    break;
                case 'genChordBtn':
                    controller.generateChordBase(key, scale, chord, degree, false, false);
                    break;
                case 'genSolfegeChordBtn':
                    controller.generateChordBase(key, scale, chord, degree, true, false);
                    break;
                case 'genNoteNameChordBtn':
                    controller.generateChordBase(key, scale, chord, degree, false, true);
                    break;
            }
        });
        
        // 清空按钮
        DOM.clearAllBtn.addEventListener('click', resetAll);
        
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
        
        DOM.bgColorPicker.addEventListener('input', updateStyleFromInputs);
        DOM.textColorPicker.addEventListener('input', updateStyleFromInputs);
        DOM.labelText?.addEventListener('input', updateStyleFromInputs);
        DOM.labelTextMobile?.addEventListener('input', updateStyleFromInputs);
        
        // 颜色预设按钮 - 事件委托
        document.querySelector('.color-preset')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.color-btn');
            if(btn) {
                DOM.bgColorPicker.value = btn.dataset.bg;
                DOM.textColorPicker.value = btn.dataset.text;
                updateStyleFromInputs();
            }
        });
        
        updateStyleFromInputs();
        
        // Canvas交互 - 使用Pointer Events统一触控
        let dragIndex = -1, isDragging = false;
        
        const getCoords = (e) => {
            const rect = DOM.canvas.getBoundingClientRect();
            // 使用逻辑尺寸（HiDPI 下 canvas buffer 已缩放，但坐标系统仍是逻辑像素）
            const sx = renderer._logicalWidth / rect.width;
            const sy = renderer._logicalHeight / rect.height;
            let cx = e.clientX, cy = e.clientY;
            let mx = (cx - rect.left) * sx;
            let my = (cy - rect.top) * sy;
            mx = Math.min(renderer._logicalWidth - renderer.rightMargin + 20, Math.max(renderer.leftMargin - 30, mx));
            my = Math.min(renderer._logicalHeight - renderer.bottomMargin + 20, Math.max(renderer.topMargin - 15, my));
            return { mx, my };
        };
        
        const handlePointerDown = (e) => {
            e.preventDefault();
            DOM.canvas.setPointerCapture(e.pointerId);
            const { mx, my } = getCoords(e);
            const pos = renderer.getStringAndFretFromCoord(mx, my);
            if(!pos) return;
            const anns = controller.getAnnotations();
            let hit = anns.findIndex(a => Math.hypot(a.x - mx, a.y - my) < 32);
            if(hit !== -1) { dragIndex = hit; isDragging = true; }
            else { controller.addOrReplaceAnnotation(pos, controller.currentMode === 'manual'); }
            renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        };
        
        const handlePointerMove = (e) => {
            if(!isDragging || dragIndex === -1) return;
            e.preventDefault();
            const { mx, my } = getCoords(e);
            const newPos = renderer.getStringAndFretFromCoord(mx, my);
            if(newPos) {
                const oldAnn = controller.getAnnotations()[dragIndex];
                if(oldAnn && (oldAnn.stringIdx !== newPos.stringIdx || oldAnn.fret !== newPos.fret)) {
                    controller.dragUpdate(oldAnn, newPos);
                }
            }
        };
        
        const handlePointerUp = () => { isDragging = false; dragIndex = -1; };
        
        const handleDoubleClick = (e) => {
            e.preventDefault();
            const { mx, my } = getCoords(e);
            const anns = controller.getAnnotations();
            for(let i = 0; i < anns.length; i++) {
                if(Math.hypot(anns[i].x - mx, anns[i].y - my) < 32) {
                    anns.splice(i, 1);
                    renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
                    break;
                }
            }
        };
        
        // 使用Pointer Events统一鼠标和触摸事件
        DOM.canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
        DOM.canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
        DOM.canvas.addEventListener('pointerup', handlePointerUp);
        DOM.canvas.addEventListener('pointercancel', handlePointerUp);
        DOM.canvas.addEventListener('dblclick', handleDoubleClick);
        
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
                        a.href = DOM.canvas.toDataURL();
                        a.click();
                    }
                    break;
                case 'exportData':
                    try {
                        let t = sanitizeTitle();
                        let data = controller.exportData();
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
            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    var d = JSON.parse(ev.target.result);
                    var s = d.state || d;
                    controller.importData(s);
                    if (s.bpm) metro.setBpm(s.bpm);
                    if (s.beatPerBar) metro.setBeatPerBar(s.beatPerBar);
                    if (s.rhythmDiv) metro.setRhythmDiv(s.rhythmDiv);
                    if (s.accent !== undefined) { metro.accent = s.accent; DOM.accentToggle.classList.toggle('active', s.accent); }
                    if (s.timerActive !== undefined) { metro.timerActive = s.timerActive; DOM.timerToggle.classList.toggle('active', s.timerActive); }
                    if (s.timerMinutes) DOM.timerMinutes.value = s.timerMinutes;
                    updateBeatSubdivDisplay();
                    renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
                } catch(ex) { alert('导入失败：' + ex.message); }
            };
            reader.onerror = function() { alert('无法读取文件'); };
            reader.readAsText(file);
        };
        
        // 节拍器
        DOM.bpmSlider.addEventListener('input', (e) => metro.setBpm(parseInt(e.target.value)));
        DOM.bpmDisplay.addEventListener('dblclick', () => {
            let v = prompt("BPM 30-240", metro.bpm);
            if(v) { let nb = parseInt(v); if(nb >= 30 && nb <= 240) metro.setBpm(nb); }
        });
        DOM.beatDown.addEventListener('click', () => metro.setBeatPerBar(metro.beatPerBar - 1));
        DOM.beatUp.addEventListener('click', () => metro.setBeatPerBar(metro.beatPerBar + 1));
        DOM.rhythmSelect.addEventListener('change', (e) => metro.setRhythmDiv(parseInt(e.target.value)));
        DOM.accentToggle.addEventListener('click', () => metro.toggleAccent());
        DOM.timerToggle.addEventListener('click', () => metro.toggleTimer());
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
        // 缓存DOM元素
        cacheDOMElements();
        
        // 初始化渲染器和控制器
        renderer = new FretboardRenderer(DOM.canvas);
        controller = new FretboardController(renderer);
        metro = new MetronomeController();
        
        // 自动保存恢复
        if (G.AutoSaveManager) {
            G.autoSave = new G.AutoSaveManager(controller);
            G.autoSave.restore();
            window.addEventListener('beforeunload', () => G.autoSave.save());
        }
        
        // 绑定事件
        bindEvents();
        
        // 初始化节拍器状态
        DOM.accentToggle.classList.add('active');
        metro.setBeatPerBar(4);
        metro.setBpm(90);
        metro.setRhythmDiv(1);
        updateBeatSubdivDisplay();
        
        // 初始化select选项文本
        updateSelectOptions();
        
        // 初始绘制
        renderer.draw(controller.getAnnotations(), controller.currentTemplate, DOM.boardTitle.value);
        

    });
// Expose runtime state for other modules
    G.DOM = DOM;
    G.currentLang = currentLang;
    G.lang = lang;
    G.currentTheme = currentTheme;
})(window.GuitarFB = window.GuitarFB || {});
