# GuitarFB v7 — 开发日志

> 用途：记录每次开发会话的进度与决策，方便 AI 重启后快速恢复上下文。

---

## 2026-05-11 — Session 1：预设系统 Phase 1 完成确认

### 状态
- Phase 1 预设系统已完整实现（preset.js + UI + 自动保存/恢复）
- v6 为稳定基座，v7 从 v6 复制而来

### 已完成的 Phase 1 功能
- 自动保存/恢复（localStorage `guitarfb_autosave`，页面关闭/打开时）
- 命名预设 CRUD（保存/列表/载入/删除，上限 20 条）
- 预设导出为含元数据的 .json 文件
- 安全导入（白名单校验、类型检查、XSS 净化、旧版兼容）
- UI：预设按钮在导出行、下拉面板、预设列表

### 待定
- Phase 2：预设共享池、排行榜（需后端或 GitHub Gist API）
- 配色优化（参考 DESIGN_PLAN.md）
- 其他 feature 由用户决定

### 技术备忘
- 脚本加载顺序：data.js → preset.js → metronome.js → main.js
- AutoSaveManager 通过 `G.autoSave` 访问
- 自动保存/恢复：页面关闭 `beforeunload` → 保存，打开时自动恢复
- 预设 UI 已全部移除，改为纯后台自动记录

---

## 2026-05-11 — Session 2：移除预设 UI，转为纯自动保存

### 变更
- **预设 UI 全部移除**：HTML 中的预设按钮/面板、CSS 的 `.preset-*` 样式、main.js 中的事件绑定和渲染函数、data.js 中预设相关的翻译键
- **preset.js 重写**：从 PresetManager 类（CRUD + 导入/导出 + 安全校验）精简为 AutoSaveManager 类（仅 save/restore/hasSaved/clear）
- **导入逻辑简化**：移除了对 `G.presetMgr.importFromFile` 的调用，改为直接的 JSON 解析 + controller.importData
- **自动保存保持**：`beforeunload` 保存、`DOMContentLoaded` 恢复，静默运行
