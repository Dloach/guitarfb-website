# V10 按钮功能重组 · 执行计划

---

## 一、目标状态

### 视觉变化

```
当前（v9）：                             目标（v10）：
┌───────────────────┐                  ┌───────────────────┐
│                   │                  │   指板 Canvas      │
│   指板 Canvas     │                  │              [✕]  │
│              [✕] │                  │                   │
│                   │                  │              [+] ← 新增指板
└───────────────────┘                  └───────────────────┘

导出行按钮：
🗑️ 清空  |  ➕ 新增指板               🗑️ 清除标注  |  🗑️ 全部清空
📸 保存   |  📸 保存全部                📸 保存     |  📸 保存全部
💾 JSON   |  📂 导入                   💾 JSON     |  📂 导入
```

### 功能分配

| 按钮 | 当前位置 | v9 功能 | v10 功能 |
|------|---------|---------|---------|
| **绿色 +** | 每个指板右下角 | ❌ 不存在 | **新增指板** |
| 原 **➕ 新增指板** | 导出行 | 新增指板 | **全部清空**（`resetAll()`） |
| 原 **🗑️ 清空** | 导出行 | `resetAll()` | **清除当前指板标注**（`controller.clearAll()`） |

---

## 二、改动清单

### 🆕 A — 指板右下角绿色 + 按钮

| 文件 | 改动 |
|------|------|
| `fretboard-manager.js` → `add()` | 创建 `fretboard-add` 按钮元素，定位到底部右侧，点击调 `add()` |
| `main.css` | 新增 `.fretboard-add` 样式（圆形、绿色 `#4CAF50`、悬浮显示） |

### ✏️ B — 现有按钮改名换功能

| 按钮 | HTML id | text/i18n 改 | 事件绑定改 |
|------|---------|-------------|-----------|
| ~~新增指板~~ → **全部清空** | `fretboardAddBtn` | `data-i18n="clearAllFull"` → "🗑️ 全部清空" | 绑定 `resetAll()` |
| ~~清空~~ → **清除标注** | `clearAllBtn` | `data-i18n="clearAnnot"` → "🗑️ 清除标注" | 绑定 `controller.clearAll()` |

### ✏️ C — data.js i18n 更新

```javascript
// 中文
clearAnnot: "🗑️ 清除标注", clearAllFull: "🗑️ 全部清空"

// English
clearAnnot: "🗑️ Clear Annotations", clearAllFull: "🗑️ Reset All"
```

---

## 三、涉及文件汇总

| 文件 | 改动类型 |
|------|---------|
| `fretboard-manager.js` | 🆕 新增 `add()` 内创建绿色 + 按钮 |
| `main.css` | 🆕 `.fretboard-add` 样式 |
| `main.js` | ✏️ `resetAll()` 和 `controller.clearAll()` 互换绑定 |
| `index.html` | ✏️ 修改按钮 data-i18n 和显示文字 |
| `data.js` | ✏️ 新增/修改 i18n 键 |

---

## 四、执行顺序

```
1. main.js     → 交换 clearAllBtn / fretboardAddBtn 的事件绑定
2. index.html  → 更新两个按钮的 data-i18n 和文字
3. data.js     → 新增 i18n 键
4. fretboard-manager.js → add() 内新增绿色 + 按钮
5. main.css    → .fretboard-add 样式
```

---

准备好后告诉我「开始执行」。
