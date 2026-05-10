/**
 * GuitarFB - Metronome Module
 * Version: 1.4.0
 */
(function(G) {
    'use strict';

    G.MetronomeController = class MetronomeController {
        constructor() {
            this.active = false;
            this.audioCtx = null;
            this.timerId = null;
            this.beatIdx = 0;
            this.nextTime = 0;
            this.bpm = 90;
            this.beatPerBar = 4;
            this.rhythmDiv = 1;
            this.accent = true;
            this.timerActive = false;
            this.timerEnd = null;
            this.timerInterval = null;
            this.countdownInterval = null;
        }

        get $() { return G.DOM; }
        get _lang() { return G.currentLang; }

        intervalSec() { return 60 / this.bpm / this.rhythmDiv; }

        updateSubdivDisplay() {
            const D = this.$;
            const displays = [D.beatSubdivDisplay, D.beatSubdivDisplayMobile].filter(d => d);
            if(displays.length === 0) return;
            const total = this.beatPerBar * this.rhythmDiv;
            displays.forEach(display => {
                display.innerHTML = '';
                for(let i = 0; i < total; i++) {
                    const div = document.createElement('div');
                    div.className = 'beat-subdiv' + (i % this.rhythmDiv === 0 ? ' accent' : '');
                    display.appendChild(div);
                }
            });
            this.highlightSubdiv(this.beatIdx);
        }

        highlightSubdiv(idx) {
            const D = this.$;
            const displays = [D.beatSubdivDisplay, D.beatSubdivDisplayMobile].filter(d => d);
            displays.forEach(display => {
                const divs = display.querySelectorAll('.beat-subdiv');
                if(idx < 0 || idx >= divs.length) return;
                const prev = display.querySelector('.beat-subdiv.active');
                if(prev) prev.classList.remove('active');
                divs[idx].classList.add('active');
            });
        }

        playClick(audioTime, isAcc) {
            if(!this.audioCtx) return;
            try {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.frequency.value = isAcc ? 880 : 660;
                gain.gain.setValueAtTime(0.25, audioTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.25);
                osc.start(audioTime);
                osc.stop(audioTime + 0.25);
            } catch(_) {}
        }

        stop() {
            if(this.timerId) clearTimeout(this.timerId);
            this.timerId = null;
            this.active = false;
            this.beatIdx = 0;
            this.nextTime = 0;
            const D = this.$;
            D.metroStartStop.innerHTML = '\u25B6 ' + (this._lang === 'zh' ? '\u542F\u52A8' : 'Start');
            D.metroStartStop.classList.remove('metro-btn-active');
            if(this.timerInterval) clearInterval(this.timerInterval);
            if(this.countdownInterval) clearInterval(this.countdownInterval);
            D.countdownDisplay.innerText = '--:--';
            if(D.beatSubdivDisplay) {
                D.beatSubdivDisplay.querySelectorAll('.beat-subdiv').forEach(d => d.classList.remove('active'));
            }
        }

        scheduleNext() {
            if(!this.active) return;
            if(!this.audioCtx) { this._fallback(); return; }
            const interval = this.intervalSec();
            let now = this.audioCtx.currentTime;
            if(this.nextTime < now) {
                let missed = Math.ceil((now - this.nextTime) / interval);
                this.beatIdx = (this.beatIdx + missed) % (this.beatPerBar * this.rhythmDiv);
                this.nextTime = now + interval;
            }
            const delay = this.nextTime - now;
            this.timerId = setTimeout(() => {
                if(!this.active) return;
                this.highlightSubdiv(this.beatIdx);
                this.playClick(this.nextTime, this.accent && (this.beatIdx % (this.beatPerBar * this.rhythmDiv) === 0));
                this.beatIdx = (this.beatIdx + 1) % (this.beatPerBar * this.rhythmDiv);
                this.nextTime += interval;
                this.scheduleNext();
            }, Math.max(4, delay * 1000));
        }

        _fallback() {
            const intervalMs = this.intervalSec() * 1000;
            let now = performance.now();
            if(this.nextTime < now) {
                let missed = Math.ceil((now - this.nextTime) / intervalMs);
                this.beatIdx = (this.beatIdx + missed) % (this.beatPerBar * this.rhythmDiv);
                this.nextTime = now + intervalMs;
            }
            const delay = Math.max(4, this.nextTime - now);
            this.timerId = setTimeout(() => {
                if(!this.active) return;
                this.highlightSubdiv(this.beatIdx);
                this.beatIdx = (this.beatIdx + 1) % (this.beatPerBar * this.rhythmDiv);
                this.nextTime += intervalMs;
                this._fallback();
            }, delay);
        }

        start() {
            if(this.active) this.stop();
            const D = this.$;
            try {
                if(!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if(this.audioCtx.state === 'suspended') this.audioCtx.resume();
            } catch(e) { this.audioCtx = null; }
            this.active = true;
            this.beatIdx = 0;
            this.nextTime = this.audioCtx ? this.audioCtx.currentTime + 0.05 : performance.now() + 50;
            this.scheduleNext();
            D.metroStartStop.innerHTML = '\u23F8 ' + (this._lang === 'zh' ? '\u505C\u6B62' : 'Stop');
            D.metroStartStop.classList.add('metro-btn-active');

            if(this.timerActive) {
                let mins = parseInt(D.timerMinutes.value) || 1;
                if(mins > 0) this.timerEnd = Date.now() + mins * 60 * 1000; else this.timerActive = false;
                if(this.timerInterval) clearInterval(this.timerInterval);
                this.timerInterval = setInterval(() => {
                    if(this.active && this.timerActive && this.timerEnd && Date.now() >= this.timerEnd) this.stop();
                }, 300);
                if(this.countdownInterval) clearInterval(this.countdownInterval);
                this.countdownInterval = setInterval(() => {
                    if(this.timerActive && this.timerEnd && this.active) {
                        let r = Math.max(0, this.timerEnd - Date.now());
                        D.countdownDisplay.innerText = Math.floor(r/60000).toString().padStart(2,'0') + ':' + Math.floor((r%60000)/1000).toString().padStart(2,'0');
                        if(r <= 0) this.stop();
                    } else { D.countdownDisplay.innerText = '--:--'; }
                }, 200);
            } else { D.countdownDisplay.innerText = '--:--'; }
        }

        setBpm(val) {
            this.bpm = Math.min(240, Math.max(30, val));
            const D = this.$;
            D.bpmSlider.value = this.bpm;
            D.bpmDisplay.innerText = this.bpm;
            if(this.active) { this.stop(); this.start(); }
        }

        setBeatPerBar(val) {
            if(val >= 1 && val <= 12) this.beatPerBar = val;
            this.$.beatPerBar.innerText = this.beatPerBar;
            this.updateSubdivDisplay();
            if(this.active) { this.stop(); this.start(); }
        }

        setRhythmDiv(val) {
            this.rhythmDiv = val;
            this.updateSubdivDisplay();
            if(this.active) { this.stop(); this.start(); }
        }

        toggleAccent() {
            this.accent = !this.accent;
            this.$.accentToggle.classList.toggle('active', this.accent);
            if(this.active) { this.stop(); this.start(); }
        }

        toggleTimer() {
            this.timerActive = !this.timerActive;
            const D = this.$;
            D.timerToggle.classList.toggle('active', this.timerActive);
            if(this.timerActive) {
                let mins = parseInt(D.timerMinutes.value) || 1;
                if(mins <= 0) this.timerActive = false;
                else this.timerEnd = Date.now() + mins * 60 * 1000;
            }
            // 让 start() 统一管理倒计时 interval
            if(this.active) { this.stop(); this.start(); }
        }

        tapTempo() {
            const now = performance.now();
            if(!this._tapHistory) this._tapHistory = [];
            this._tapHistory.push(now);
            if(this._tapHistory.length > 8) this._tapHistory.shift();
            clearTimeout(this._tapTimer);
            this._tapTimer = setTimeout(() => { this._tapHistory = []; }, 2000);
            if(this._tapHistory.length >= 2) {
                let intervals = [];
                for(let i = 1; i < this._tapHistory.length; i++) {
                    intervals.push(this._tapHistory[i] - this._tapHistory[i-1]);
                }
                intervals.sort((a,b) => a-b);
                let cut = Math.floor(intervals.length * 0.2);
                let filtered = intervals.slice(cut, intervals.length - cut);
                if(filtered.length === 0) return;
                let avg = filtered.reduce((s,v) => s+v, 0) / filtered.length;
                let tapped = Math.round(60000 / avg);
                if(tapped >= 30 && tapped <= 240) this.setBpm(tapped);
            }
        }
    };

})(window.GuitarFB = window.GuitarFB || {});
