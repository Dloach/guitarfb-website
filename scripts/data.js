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
            generateScale:"✨ 音阶", generateChord:"🎼 和弦", generateSolfegeChord:"🎵 和弦(唱名)", generateNoteNameChord:"🎶 和弦(音名)",
            clearAll:"🗑️ 清空", exportImage:"📸 保存", exportAllImage:"📸 保存全部", exportData:"💾 JSON", importData:"📂 导入",
            annotation:"📌 手动标注", manual:"✏️ 自定义", pitch:"🎵 音高", text:"📝 文本", color:"🎨", circle:"圈", font:"字",
            bpm:"BPM", beat:"拍号", rhythm:"节奏", subdiv:"细分", accent:"重音", timer:"定时",
            start:"▶ 启动", stop:"⏸ 停止", lightMode:"☀️ 浅色", darkMode:"🌙 暗色",
            scales: { major:"自然大调", dorian:"多利亚", phrygian:"弗里吉亚", lydian:"利底亚", mixolydian:"混合利底亚", minor:"自然小调", locrian:"洛克里亚", harmonic_minor:"和声小调", melodic_minor:"旋律小调", pentatonic_major:"大调五声", pentatonic_minor:"小调五声", blues:"布鲁斯", japanese:"日本音阶", hungarian:"匈牙利小调" },
            chords: { triad:"三和弦", seventh:"七和弦", ninth:"九和弦", eleventh:"十一和弦", thirteenth:"十三和弦" },
            rhythms: { "1":"四分音符", "2":"八分音符", "4":"十六分音符", "3":"三连音", "6":"六连音" },
            about:"关于我们", privacy:"隐私政策",
            clearAnnot:"🗑️ 清除标注", clearAllFull:"🗑️ 全部清空", annotToggle:"🖊️",
            modeNote:"🎵 音名", modeSolfege:"🔢 唱名", modeInterval:"🎼 音程"
        },
        en: {
            title:"Guitar Fretboard · Scale & Chord Workshop", boardTitle:"Guitar Fretboard", boardTitlePlaceholder:"Auto or manual input",
            labelBoardTitle:"🎸 Title", tuning:"Tuning", preset:"Preset", custom:"Custom",
            key:"🎼 Key", scale:"🎵 Scale", chord:"🎸 Chord", degree:"🎼 Degree",
            generateScale:"✨ Scale", generateChord:"🎼 Chord", generateSolfegeChord:"🎵 Chord(Solfege)", generateNoteNameChord:"🎶 Chord(note)",
            clearAll:"🗑️ Clear", exportImage:"📸 Save", exportAllImage:"📸 Export All", exportData:"💾 JSON", importData:"📂 Import",
            annotation:"📌 Annotation", manual:"✏️ Custom", pitch:"🎵 Pitch", text:"📝 Text", color:"🎨", circle:"BG", font:"Txt",
            bpm:"BPM", beat:"Beat", rhythm:"Rhythm", subdiv:"Subdiv", accent:"Accent", timer:"Timer",
            start:"▶ Start", stop:"⏸ Stop", lightMode:"☀️ Light", darkMode:"🌙 Dark",
            scales: { major:"Major", dorian:"Dorian", phrygian:"Phrygian", lydian:"Lydian", mixolydian:"Mixolydian", minor:"Minor", locrian:"Locrian", harmonic_minor:"Harmonic Minor", melodic_minor:"Melodic Minor", pentatonic_major:"Major Pentatonic", pentatonic_minor:"Minor Pentatonic", blues:"Blues", japanese:"Japanese", hungarian:"Hungarian Minor" },
            chords: { triad:"Triad", seventh:"7th", ninth:"9th", eleventh:"11th", thirteenth:"13th" },
            rhythms: { "1":"Quarter", "2":"Eighth", "4":"Sixteenth", "3":"Triplet", "6":"Sextuplet" },
            about:"About Us", privacy:"Privacy Policy",
            clearAnnot:"🗑️ Clear", clearAllFull:"🗑️ Reset All", annotToggle:"🖊️",
            modeNote:"🎵 Note", modeSolfege:"🔢 Solfege", modeInterval:"🎼 Interval"
        }
    };

    // 颜色主题 ——————————————————————————————————————
    G.PALETTES = {
        'warm-cream': {
            name: { zh: '晨露', en: 'Morning Dew' },
            colors: { bg:'#3A4A3A', card:'#F2F0E8', panel:'#E8E4D8', canvas:'#F5F2E8',
                text:'#3A3A2A', muted:'#909080', btn:'#5A7A6A', accent:'#D49840', danger:'#6A5A3A', border:'#B0AA90' }
        },
        'cool-midnight': {
            name: { zh: '冷夜星辰', en: 'Cool Midnight' },
            colors: { bg:'#0E1520', card:'#1A2744', panel:'#14213A', canvas:'#1A2744',
                text:'#E0E4F0', muted:'#7888A0', btn:'#4A7AB8', accent:'#C89840', danger:'#2A3A5A', border:'#3A4A60' }
        },
        'monochrome': {
            name: { zh: '极简黑白', en: 'Monochrome' },
            colors: { bg:'#1A1A1A', card:'#F8F8F8', panel:'#E8E8E8', canvas:'#F0F0F0',
                text:'#1A1A1A', muted:'#888888', btn:'#444444', accent:'#666666', danger:'#222222', border:'#AAAAAA' }
        },
        'retro-warm': {
            name: { zh: '复古暖屏', en: 'Retro Warm' },
            colors: { bg:'#2A2420', card:'#E6D8C0', panel:'#D4C5A9', canvas:'#F0E4C8',
                text:'#3A3028', muted:'#887A62', btn:'#8A6A44', accent:'#A8803A', danger:'#5A3A28', border:'#B8A482' }
        },
        'cyber-neon': {
            name: { zh: '赛博霓虹', en: 'Cyber Neon' },
            colors: { bg:'#0A0812', card:'#1E1428', panel:'#14101E', canvas:'#1E1428',
                text:'#FFE8EE', muted:'#887088', btn:'#FF2266', accent:'#FF8800', danger:'#4A1840', border:'#3A2A48' }
        },
        'nordic': {
            name: { zh: '北欧清新', en: 'Nordic Fresh' },
            colors: { bg:'#2C3E50', card:'#F5F7FA', panel:'#E8ECF0', canvas:'#FFFFFF',
                text:'#2C3E50', muted:'#8899A8', btn:'#3A8AC8', accent:'#D4883A', danger:'#4A6070', border:'#BCC8D0' }
        },
        'forest': {
            name: { zh: '森林绿意', en: 'Forest' },
            colors: { bg:'#1A2E1A', card:'#EEF5E4', panel:'#DCE8C8', canvas:'#F5FAEE',
                text:'#2A3A1A', muted:'#7A9A5A', btn:'#4A8A3A', accent:'#C8A030', danger:'#3A5A2A', border:'#AAB890' }
        },
        'ember-night': {
            name: { zh: '烬夜', en: 'Ember Night' },
            colors: { bg:'#181818', card:'#222230', panel:'#1A1A28', canvas:'#222230',
                text:'#E0D8CC', muted:'#888898', btn:'#CC6633', accent:'#E08840', danger:'#333345', border:'#3A3A4A' }
        }
    };

    G.PRESET_TUNINGS = {
        standard: { name:"Standard (EADGBE)", strings:["E","B","G","D","A","E"] },
        dropD: { name:"Drop D (EADGBD)", strings:["E","B","G","D","A","D"] },
        dropC: { name:"Drop C (EADGCD)", strings:["E","B","G","D","A","C"] },
        openG: { name:"Open G (DGDGBD)", strings:["D","B","G","D","G","D"] },
        openD: { name:"Open D (DADF#AD)", strings:["D","A","G","F#","D","A"] },
        dadgad: { name:"DADGAD", strings:["D","A","G","D","A","D"] },
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

    /** 完整音程名称（用于音级标注模式） */
    G.intervalFullName = function(interval, zh) {
        var names = zh
            ? {0:"R",1:"小二",2:"大二",3:"小三",4:"大三",5:"纯四",6:"减五",7:"纯五",8:"小六",9:"大六",10:"小七",11:"大七"}
            : {0:"R",1:"m2",2:"M2",3:"m3",4:"M3",5:"P4",6:"b5",7:"P5",8:"m6",9:"M6",10:"m7",11:"M7"};
        return names[interval % 12] || "";
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
