/**
 * GuitarFB - 自动保存模块
 * Version: 2.0.0
 * 
 * 静默地在页面关闭时保存最后状态，打开时自动恢复。
 * 无 UI、无用户交互，完全后台运行。
 */
(function(G) {
    'use strict';

    const STORAGE_KEY = 'guitarfb_autosave';

    /**
     * 检查 localStorage 是否可用
     */
    function storageOk() {
        try {
            const k = '__test__';
            localStorage.setItem(k, k);
            localStorage.removeItem(k);
            return true;
        } catch(e) {
            return false;
        }
    }

    /**
     * 自动保存管理器
     */
    class AutoSaveManager {
        constructor(controller) {
            this.controller = controller;
            this._ok = storageOk();
        }

        /** 保存当前状态 */
        save() {
            if (!this._ok) return;
            try {
                const state = this.controller.exportData();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch(e) {
                /* 静默失败 */
            }
        }

        /** 是否有已保存的状态 */
        hasSaved() {
            if (!this._ok) return false;
            try {
                return localStorage.getItem(STORAGE_KEY) !== null;
            } catch(e) {
                return false;
            }
        }

        /** 恢复已保存的状态，成功返回 true */
        restore() {
            if (!this._ok) return false;
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return false;
                const data = JSON.parse(raw);
                this.controller.importData(data);
                return true;
            } catch(e) {
                return false;
            }
        }

        /** 清除已保存的状态 */
        clear() {
            if (!this._ok) return;
            try { localStorage.removeItem(STORAGE_KEY); } catch(e) { /* ignore */ }
        }
    }

    G.AutoSaveManager = AutoSaveManager;

})(window.GuitarFB = window.GuitarFB || {});
