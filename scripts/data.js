/**
 * GuitarFB - Data & Utilities Module
 * Version: 1.4.0
 */
(function(G) {
    'use strict';

    G.perfMonitor = {
        frameCount: 0, lastTime: performance.now(), fps: 0, renderTime: 0, drawCount: 0,
        _debug: typeof localStorage !== 'undefined' && localStorage.getItem('guitarfb_debug') === '1',
        startRender() { this.renderStart = performance.now(); },
        endRender() { this.renderTime = performance.now() - this.renderStart; this.drawCount++; },
        update() {
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastTime >= 1000) {
                this.fps = this.frameCount; this.frameCount = 0; this.lastTime = now;
                if (this._debug && this.drawCount > 0) {
                    console.log('[Perf] FPS:'+this.fps+' Render:'+this.renderTime.toFixed(2)+'ms Calls:'+this.drawCount);
                    this.drawCount = 0;
                }
            }
        }
    };

    G.NOTE_ORDER = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

    G.LANG = {
        zh: {
            title:"吉他指板 · 调式音阶与和弦工坊", boardTitle:"吉他指板练习", boardTitlePlaceholder:"自动或手动填写",
            labelBoardTitle:"🎸 标题", tuning:"调音设置", preset:"预设", custom:"自定义",
            key:"🎼 调性", scale:"🎵 音阶", chord:"🎸 和弦", degree:"🎼 级数",
            generateScale:"✨ 音阶", generateChord:"🎼 和弦(音级)", generateSolfegeChord:"🎵 和弦(唱名)", generateNoteNameChord:"🎶 和弦(音名)",
            clearAll:"🗑️ 清空", exportImage:"📸 保存", exportData:"💾 JSON", importData:"📂 导入",
            annotation:"📌 标注", manual:"✏️ 手动", pitch:"🎵 音高", text:"📝 文本", color:"🎨", circle:"圈", font:"字",
            bpm:"BPM", beat:"拍号", rhythm:"节奏", subdiv:"细分", accent:"重音", timer:"定时",
            start:"▶ 启动", stop:"⏸ 停止", lightMode:"☀️ 浅色", darkMode:"🌙 暗色",
            scales: { major:"自然大调", dorian:"多利亚", phrygian:"弗里吉亚", lydian:"利底亚", mixolydian:"混合利底亚", minor:"自然小调", locrian:"洛克里亚", harmonic_minor:"和声小调", melodic_minor:"旋律小调", pentatonic_major:"大调五声", pentatonic_minor:"小调五声", blues:"布鲁斯", japanese:"日本音阶", hungarian:"匈牙利小调" },
            chords: { triad:"三和弦", seventh:"七和弦", ninth:"九和弦", eleventh:"十一和弦", thirteenth:"十三和弦" },
            rhythms: { "1":"四分音符", "2":"八分音符", "4":"十六分音符", "3":"三连音", "6":"六连音" },
            about:"关于我们", privacy:"隐私政策",
            presetSave:"💾 保存预设", presetLoad:"📂 载入预设", presetDelete:"🗑️ 删除",
            presetName:"预设名称", presetDesc:"预设描述（可选）",
            presetSaved:"预设已保存", presetLoaded:"预设已载入",
            presetDeleted:"预设已删除", presetImportSuccess:"预设导入成功",
            presetImportError:"预设导入失败", presetExportTitle:"导出预设",
            presetAutoSave:"自动保存已恢复", presetNoName:"请填写预设名称",
            presetConfirmDelete:"确认删除此预设？",
            presetListEmpty:"暂无保存的预设"
        },
        en: {
            title:"Guitar Fretboard · Scale & Chord Workshop", boardTitle:"Guitar Fretboard", boardTitlePlaceholder:"Auto or manual input",
            labelBoardTitle:"🎸 Title", tuning:"Tuning", preset:"Preset", custom:"Custom",
            key:"🎼 Key", scale:"🎵 Scale", chord:"🎸 Chord", degree:"🎼 Degree",
            generateScale:"✨ Scale", generateChord:"🎼 Chord(Interval)", generateSolfegeChord:"🎵 Chord(Solfege)", generateNoteNameChord:"🎶 Chord(note)",
            clearAll:"🗑️ Clear", exportImage:"📸 Save", exportData:"💾 JSON", importData:"📂 Import",
            annotation:"📌 Annotation", manual:"✏️ Manual", pitch:"🎵 Pitch", text:"📝 Text", color:"🎨", circle:"BG", font:"Txt",
            bpm:"BPM", beat:"Beat", rhythm:"Rhythm", subdiv:"Subdiv", accent:"Accent", timer:"Timer",
            start:"▶ Start", stop:"⏸ Stop", lightMode:"☀️ Light", darkMode:"🌙 Dark",
            scales: { major:"Major", dorian:"Dorian", phrygian:"Phrygian", lydian:"Lydian", mixolydian:"Mixolydian", minor:"Minor", locrian:"Locrian", harmonic_minor:"Harmonic Minor", melodic_minor:"Melodic Minor", pentatonic_major:"Major Pentatonic", pentatonic_minor:"Minor Pentatonic", blues:"Blues", japanese:"Japanese", hungarian:"Hungarian Minor" },
            chords: { triad:"Triad", seventh:"7th", ninth:"9th", eleventh:"11th", thirteenth:"13th" },
            rhythms: { "1":"Quarter", "2":"Eighth", "4":"Sixteenth", "3":"Triplet", "6":"Sextuplet" },
            about:"About Us", privacy:"Privacy Policy",
            presetSave:"💾 Save Preset", presetLoad:"📂 Load Preset", presetDelete:"🗑️ Delete",
            presetName:"Preset Name", presetDesc:"Description (optional)",
            presetSaved:"Preset saved", presetLoaded:"Preset loaded",
            presetDeleted:"Preset deleted", presetImportSuccess:"Preset imported successfully",
            presetImportError:"Preset import failed", presetExportTitle:"Export Preset",
            presetAutoSave:"Auto-save restored", presetNoName:"Please enter a preset name",
            presetConfirmDelete:"Delete this preset?",
            presetListEmpty:"No saved presets"
        }
    };

    G.PRESET_TUNINGS = {
        standard: { name:"Standard (EADGBE)", strings:["E","B","G","D","A","E"] },
        dropD: { name:"Drop D (EADGBD)", strings:["E","B","G","D","A","D"] },
        dropC: { name:"Drop C (EADGCD)", strings:["E","B","G","D","A","C"] },
        openG: { name:"Open G (DGDGBD)", strings:["D","B","G","D","G","D"] },
        openD: { name:"Open D (DADF#AD)", strings:["D","A","G","F#","D","A"] },
        dadgad: { name:"DADGAD", strings:["D","A","G","D","G","A"] },
        halfDown: { name:"Half Step Down (Eb)", strings:["Eb","Bb","Gb","Db","Ab","Eb"] },
        fullDown: { name:"Full Step Down (D)", strings:["D","G","C","F","A","D"] }
    };

    G.TUNING_CONFIG = {
        name:"Standard (EADGBE)",
        strings: [
            { string:0, openNote:"E" }, { string:1, openNote:"B" },
            { string:2, openNote:"G" }, { string:3, openNote:"D" },
            { string:4, openNote:"A" }, { string:5, openNote:"E" }
        ]
    };

    G.SCALE_INTERVALS = {
        major:[0,2,4,5,7,9,11], dorian:[0,2,3,5,7,9,10], phrygian:[0,1,3,5,7,8,10],
        lydian:[0,2,4,6,7,9,11], mixolydian:[0,2,4,5,7,9,10], minor:[0,2,3,5,7,8,10],
        locrian:[0,1,3,5,6,8,10], harmonic_minor:[0,2,3,5,7,8,11], melodic_minor:[0,2,3,5,7,9,11],
        pentatonic_major:[0,2,4,7,9], pentatonic_minor:[0,3,5,7,10], blues:[0,3,5,6,7,10],
        japanese:[0,4,5,7,10], hungarian:[0,2,3,6,7,8,11]
    };

    G.getNoteAtFret = function(stringIdx, fret) {
        const open = G.TUNING_CONFIG.strings.find(s => s.string === stringIdx).openNote;
        const idx = G.NOTE_ORDER.indexOf(open);
        return G.NOTE_ORDER[(idx + fret) % 12];
    };

    G.getScaleIntervals = function(type) {
        return G.SCALE_INTERVALS[type] ? [...G.SCALE_INTERVALS[type]] : [...G.SCALE_INTERVALS.major];
    };

    G.intervalToLabel = function(interval) {
        const labels = {0:"R",1:"b2",2:"2",3:"b3",4:"3",5:"11",6:"b5",7:"5",8:"b6",9:"13",10:"b7",11:"7"};
        return labels[interval % 12] || "";
    };

    G.getScaleNoteCount = function(scaleType) {
        return G.SCALE_INTERVALS[scaleType] ? G.SCALE_INTERVALS[scaleType].length : 7;
    };

    G.getNumberForNote = function(note, tonicNote, scaleIntervalsArr) {
        const tonicIdx = G.NOTE_ORDER.indexOf(tonicNote);
        const noteIdx = G.NOTE_ORDER.indexOf(note);
        let d = (noteIdx - tonicIdx + 12) % 12;
        for(let i = 0; i < scaleIntervalsArr.length; i++) {
            if(scaleIntervalsArr[i] === d) return (i+1).toString();
        }
        const f = {0:"1",2:"2",4:"3",5:"4",7:"5",9:"6",11:"7",1:"♯1",3:"♭3",6:"♯4",8:"♭6",10:"♭7"};
        return f[d] || "?";
    };

    G.getDiatonicChordIntervals = function(tonicNote, scaleType, degree, chordFamily) {
        const intervals = G.getScaleIntervals(scaleType);
        const tonicIdx = G.NOTE_ORDER.indexOf(tonicNote);
        const rootInterval = intervals[degree-1];
        const chordRootIdx = (tonicIdx + rootInterval) % 12;
        const chordRoot = G.NOTE_ORDER[chordRootIdx];
        const scaleNotesSet = new Set(intervals.map(i => G.NOTE_ORDER[(tonicIdx + i) % 12]));
        const isInScale = (rootIdx, semitone) => scaleNotesSet.has(G.NOTE_ORDER[(rootIdx + semitone) % 12]);
        const useMajorThird = isInScale(chordRootIdx, 4);
        const third = useMajorThird ? 4 : 3;
        const chordSet = new Set([0, third, 7]);
        if(chordFamily !== 'triad') {
            const seventhCand = useMajorThird ? 11 : 10;
            chordSet.add(isInScale(chordRootIdx, seventhCand) ? seventhCand : 10);
            if(chordFamily === 'ninth' || chordFamily === 'eleventh' || chordFamily === 'thirteenth') chordSet.add(14);
            if(chordFamily === 'eleventh' || chordFamily === 'thirteenth') chordSet.add(17);
            if(chordFamily === 'thirteenth') chordSet.add(21);
        }
        return { rootNote: chordRoot, intervals: Array.from(chordSet).sort((a,b) => a-b) };
    };

})(window.GuitarFB = window.GuitarFB || {});
