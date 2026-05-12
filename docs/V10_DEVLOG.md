# GuitarFB v10 开发日志 · 关键记录

> **版本：v1.0.5**
> 日期：2026-05-12
> 起点：从 v9（v1.0.4）复制而来
> Git tag: `v1.0.5` | Commit: `ce09042`
> 推送命令：`git push --force origin main --tags`

---

## 架构与术语

- **两端** = PC端 + 手机端（响应式通过 CSS 媒体查询实现）
- **V10_BTN_REORG.md** 记录了按钮功能重组计划

---

## 核心文件依赖

| 文件 | 职责 | 备注 |
|------|------|------|
| `index.html` | DOM 结构、i18n data-* 属性 | 勿直接改按钮文本，改 `data.js` |
| `styles/main.css` | 响应式布局、按钮显隐、颜色 | 三个断点：659px / 800px / 1080px |
| `scripts/main.js` | 所有逻辑：指板绘制、事件、自动保存、调音 | IIFE 结构，`G.xxx` 挂全局 |
| `scripts/fretboard-manager.js` | 多指板管理：add/remove/move/activate/导出 | 每个指板独立 controller |
| `scripts/data.js` | 调音预设、音阶定义、i18n 翻译 | 双语言（zh/en） |
| `scripts/preset.js` | AutoSaveManager（localStorage 自动存档） | `beforeunload` 保存 |

---

## 指板操作按钮（每指板独立）

每个指板 wrapper 内含：

```
┌─────────────────────┐
│   指板 Canvas    ▲  │
│                 ▼  │
│               ✕   │
│           [⧉] [+] │
└─────────────────────┘
```

- **▲/▼** — 橙黄色，上移/下移一位
- **✕** — 红色，删除该指板（至少保留一个）
- **⧉** — 绿色，复制该指板（含标注、模板、标题）
- **+** — 绿色，在下方插入空白指板

### 显隐规则（`pointer-events` + `opacity`）

| 状态 | 可见 | 可点击 |
|------|------|--------|
| 默认 | ❌ opacity: 0 | ❌ pointer-events: none |
| PC hover | ✅ | ✅ |
| 点击指板（两端） | ✅ | ✅（`.show-buttons`） |
| 点击指板外部 | ❌ | ❌ |

CSS 关键：`.fretboard-wrapper.show-buttons .fretboard-*` 控制激活显示

---

## 激活保护（`main.js`）

- `requireActiveFretboard()` — 所有主功能区功能执行前检查
- 无激活指板时显示底部 toast（非 alert），2 秒自动消失
- `requireActiveFretboard` / `showToast` / `isInteractive` **必须在 `bindEvents` 外部**（IIFE 顶层）定义，否则 `setAnnotationMode` 访问不到

---

## 标注模式系统

- 模式：`'note'`（音名）| `'solfege'`（唱名）| `'interval'`（音程）
- 每个指板**独立**模式（`controller.annotationMode`）
- 切换指板时 `syncModeUI()` 同步按钮高亮
- 切换模式只影响当前激活指板

### 自动重生成

- 下拉菜单（调性/音阶/和弦/级数）change → `autoRegenerate()`
- `G._suppressAutoGen` 标志抑制切换指板时的误触发

---

## 调音系统

- 每个指板独立调音（`fb.tuning`）
- 切换指板时 `_saveState` + `_loadState` 保存/恢复
- 调音变化时 `regenerateActiveFretboard()` 重新计算标注位置和文字

---

## 空弦标注

- `generateScale` / `generateChord` 循环改为 `f = 0` 起（原 `f = 1`）
- 空弦标注位置：`leftMargin - 65px`
- `leftMargin` 设为 200（后在 UI 调整中改为 140）

---

## 导出按钮布局

Desktop: 6 个按钮同一行等宽（`flex: 1`）
Mobile: 3 行 × 2 列，顺序：
```
📸 保存    | 📸 保存全部
💾 JSON    | 📂 导入
🗑️ 清除标注 | 🗑️ 全部清空
```

---

## 响应式断点（CSS media queries）

| 断点 | 调性/音阶/和弦/级数 | 导出按钮 | 备注 |
|------|-------------------|---------|------|
| <659px | 两两一行 | 两列 flex | 手机 |
| 660~800px | 四列一行 | 两列 flex | 手机横屏/小平板 |
| 801~1080px | 两两一行 | 两列 flex | 中屏 |
| >1080px | 四列一行 | 一行等宽 flex | 桌面 |

---

## 关键 CSS 类

| 类 | 用途 |
|----|------|
| `.fretboard-del` | 删除按钮（红色，右上） |
| `.fretboard-up` / `.fretboard-down` | 上下移动（橙黄，右上） |
| `.fretboard-copy` | 复制按钮（绿色，右下） |
| `.fretboard-add` | 新增按钮（绿色，右下） |
| `.show-buttons` | 指板按钮显示状态（JS 控制） |
| `.fretboard-active` | 激活指板橙色边框 |
| `.color-bar` | 颜色选项条（指板下方，调音上方） |
| `#annotationToggle` | 标注开关（绿色滑块） |
| `#exportRow` | 导出按钮容器 |

---

## 数据流：自动保存

```
beforeunload → G.autoSave.save() → exportAll() → localStorage
DOMContentLoaded → G.autoSave.restore() → importAll() → 恢复
```

- `exportAll()` 保存：freboards、metronome、theme、lang、activeIdx
- `importAll()` 恢复后需 syncModeUI()
- `_restoreOk` 变量决定是否设置节拍器默认值

---

## i18n 注意

- 按钮文本通过 `data-i18n` + `updateI18N()` 更新
- 添加新按钮时必须同时加 `data.js` 的中英文键值
- 预留的旧键（如 `generateSolfegeChord`）不会导致错误，可清理

---

---

## 颜色行（`.color-row`）

- 位置：工具栏下方，导出按钮上方（独立于 toolbar）
- 底色：`var(--color-bg-panel)`（与主面板一致）
- 无外框线，圆角框
- PC 端与标注行同一行等高（`#annotToolbar` flex row）
- 手机端在标注行下方（`flex-direction: column`）
- 内嵌 `bgColorPickerMobile` / `textColorPickerMobile` 手机端独立拾色器，与桌面端双向同步

## 细分显示（`.beat-subdiv-row`）

- 移出调音设置行，独立一行位于指板下方、调音按钮上方
- 两端通用，PC 显示 `#beatSubdivDisplay`，手机显示 `#beatSubdivDisplayMobile`
- 文字 label 已移除，仅保留节拍圆点

## 标注行术语

```
┌─────────────────────────────────────────────┐
│ 📌 标注  [🟢]  [🎵 音高]  [✏️ 自定义]  [●] │  ← 标注行（标注工具栏）
├─────────────────────────────────────────────┤
│  [🔴][⚪][⚫]  圈:[■]  字:[■]              │  ← 颜色行
└─────────────────────────────────────────────┘
```

- 主功能区 = 主面板（`.main-panel`）

---

## 常见问题修复记录

### 1. `requireActiveFretboard` 未定义
**症状**：点击切换标注模式时 `ReferenceError`  
**原因**：函数定义在 `bindEvents()` 内，`setAnnotationMode` 在 `bindEvents()` 外  
**修复**：将 `requireActiveFretboard` / `showToast` / `isInteractive` 移到 IIFE 顶层

### 2. 取消激活后标注丢失
**症状**：全部清空 → 生成和弦 → 点击空白 → 改下拉 → 点指板，标注消失  
**原因**：取消激活时未 `_saveState`，`_loadState` 读取 undefined 清空控制器  
**修复**：文档点击处理器中先 `_saveState(old)` 再取消激活

### 3. 点击功能按钮取消激活
**症状**：点生成/模式按钮后橙框消失  
**原因**：文档点击处理器无排除交互元素  
**修复**：`isInteractive(e.target)` 排除 button/select/input

### 4. `setPointerCapture` 异常
**症状**：`InvalidStateError`  
**原因**：快速点击时指针状态异常  
**修复**：`try { cvs.setPointerCapture(e.pointerId); } catch(ex) {}`

### 5. 自动保存节拍器不恢复
**症状**：刷新后节拍器回到默认  
**原因**：`G.autoSave.hasSaved()` 不存在导致始终重置  
**修复**：用 `_restoreOk` 变量捕获 `restore()` 返回值

### 6. `exportAllImage` 英文不生效
**症状**：切换英语后按钮仍是中文  
**原因**：`data.js` 中 `exportAllImage` 键值丢失  
**修复**：补回中英文键值

### 7. 空壳 wrapper 残留，DOM 位置错乱
**症状**：绿色 + 插入位置错误  
**原因**：`importAll` 只 `canvas.remove()` 没删 `_wrapper`  
**修复**：改为 `fb._wrapper.remove()`

### 8. CSS 文件误删
**恢复方法**：浏览器缓存中提取 `f_*.css` 文件放回 `styles/main.css`

### 9. GitHub Push 失败（Connection reset）
**症状**：`Failed to connect to github.com port 443`  
**原因**：网络防火墙阻断 HTTPS（443端口）  
**临时解决**：改用 HTTP（port 80）绕过：
```bash
git remote set-url origin http://github.com/Dloach/guitarfb-website.git
git push --force origin main --tags
git remote set-url origin https://github.com/Dloach/guitarfb-website.git  # 恢复 HTTPS
```

### 10. 调音变化不重算标注
**症状**：切换调音预设后标注文字/位置不变  
**原因**：`applyPresetTuning` 只调了 `refreshAllTemplateStyles()`，未重新生成  
**修复**：添加 `regenerateActiveFretboard()` 函数，有模板时执行完整 `generateScale()` / `generateChord()`
**恢复方法**：浏览器缓存中提取 `f_*.css` 文件放回 `styles/main.css`
