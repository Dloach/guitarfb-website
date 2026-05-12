# V9 标注模式切换系统 · 可行性分析

> 目标：精简生成按钮为「音阶」「和弦」两个，新增三个标注模式开关（音名/唱名/音级），让用户自由选择音阶和和弦的标记方式。

---

## 一、当前状态分析

### 1.1 现有按钮与行为

| 当前按钮 | 行为 | 标注方式 |
|---------|------|---------|
| ✨ 音阶 | `generateScale(key, scaleType)` | **固定音名**（如 C, D, E…） |
| 🎼 和弦(音级) | `generateChordBase(..., false, false)` | 和弦内→音级（1, 3, 5），和弦外→音名 |
| 🎵 和弦(唱名) | `generateChordBase(..., true, false)` | 和弦内→唱名数字（do, re, mi…），和弦外→音名 |
| 🎶 和弦(音名) | `generateChordBase(..., false, true)` | 和弦内外→音名（C, D, E…） |

### 1.2 关键方法

**`generateScale(key, scaleType)`**
- 查找音阶所有音符 → 创建空标注 → `refreshAllTemplateStyles()` 填充
- **当前问题**：`refreshAnnotationStyle` 中 scale 分支**固定写死**为音名，无法切换

**`generateChordBase(key, scaleType, chordFamily, degree, isSolfege, isNoteName)`**
- 查找和弦内音 → 创建空标注 → `refreshAllTemplateStyles()` 填充
- 通过 `isSolfege` / `isNoteName` 两个布尔值控制三种模式：
  - `false, false` → 音级（Interval）
  - `true, false` → 唱名（Solfege）
  - `false, true` → 音名（Note Name）

**`refreshAnnotationStyle(ann)`**
- scale 分支：`ann.text = note`（固定音名）
- chord 分支：根据 `isNoteNameMode` / `isSolfegeMode` 判断

### 1.3 `currentTemplate` 对象结构

```javascript
// 音阶模板
{ type: 'scale', root: 'C', scaleType: 'major' }

// 和弦模板
{ type: 'chord', root: 'C', chordIntervals: [...], family: 'triad',
  degree: 1, scaleType: 'major',
  isSolfegeMode: false,    // 唱名模式
  isNoteNameMode: false    // 音名模式（false = 音级模式）
}
```

---

## 二、目标设计

### 2.1 UI 布局变化

```
当前:                             目标:
┌─────────────────────┐         ┌─────────────────────┐
│ ✨ 音阶             │         │ ✨ 音阶              │
│ 🎼 和弦(音级)       │    →    │ 🎼 和弦              │
│ 🎵 和弦(唱名)       │         │                      │
│ 🎶 和弦(音名)       │         ├─ 标注模式 ──────────┤
│                     │         │ ○ 音名  ● 唱名  ○ 音级 │
└─────────────────────┘         └─────────────────────┘
```

### 2.2 行为变化

| 场景 | 当前 | V9 目标 |
|------|------|---------|
| 点击「音阶」 | 固定音名标注 | 按当前选中的标注模式渲染 |
| 点击「和弦」 | 固定音级标注 | 按当前选中的标注模式渲染 |
| 切换标注模式 | 需重新生成 | 即时切换已有标注的标记方式，无需重新生成 |

---

## 三、数据模型变更

### 3.1 新增状态

```javascript
// 全局标注模式（独立于模板类型）
annotationMode: 'note' | 'solfege' | 'interval'

// currentTemplate 不再需要 isSolfegeMode / isNoteNameMode
// 改为通过全局模式统一判断
```

### 3.2 currentTemplate 简化

```javascript
// 音阶模板（不变）
{ type: 'scale', root: 'C', scaleType: 'major' }

// 和弦模板（去掉模式标志）
{ type: 'chord', root: 'C', chordIntervals: [...], family: 'triad',
  degree: 1, scaleType: 'major' }
```

### 3.3 自动保存新增字段

```javascript
// exportAll() 新增
annotationMode: 'note' | 'solfege' | 'interval'
```

---

## 四、核心逻辑变更

### 4.1 refreshAnnotationStyle 重写

```
当前：scale 分支固定音名，chord 分支判断 isSolfege/isNoteName
目标：统一根据全局 annotationMode 决定渲染方式

scale 分支三种模式：
  音名 → ann.text = getNoteAtFret(...)
  唱名 → ann.text = getNumberForNote(...) ← 需要 scaleIntervals
  音级 → ann.text = intervalToLabel(interval) ← 需要 tonic

chord 分支三种模式：
  音名 → ann.text = getNoteAtFret(...)
  唱名 → ann.text = getNumberForNote(...) ← 需要 scaleIntervals + baseTonic
  音级 → ann.text = intervalToLabel(interval) ← 需要 root
```

### 4.2 技术难点：音阶的「音级」标注

音阶模式下标注「音级」需要知道每个音符相对于**主音（root）**的音程：

```
C 大调音阶：C(1) D(2) E(3) F(4) G(5) A(6) B(7)
```
这需要通过 `NOTE_ORDER.indexOf(note) - NOTE_ORDER.indexOf(root)` 计算半音差，再映射到级数。

当前 `data.js` 中已有 `getNumberForNote(note, baseTonic, scaleIntervals)` 函数（用于唱名），可复用或参考。

### 4.3 生成流程简化

```javascript
generateScale(key, scaleType) {
    // 1. 清空
    // 2. 查找音符位置
    // 3. 创建空标注 + 设置模板（不再传模式参数）
    // 4. refreshAllTemplateStyles() 按 annotationMode 渲染
    // 5. 绘制
}

generateChord(key, scaleType, chordFamily, degree) {
    // 同上，去掉 isSolfege / isNoteName 参数
}
```

### 4.4 模式切换

```javascript
function setAnnotationMode(mode) {
    annotationMode = mode;  // 'note' | 'solfege' | 'interval'
    // 更新全局 toggle 按钮高亮
    // 刷新当前指板的所有标注样式
    controller.refreshAllTemplateStyles();
    controller.renderer.draw(controller.annotations, controller.currentTemplate, DOM.boardTitle.value);
    // 如果有多指板，刷新全部
}
```

---

## 五、涉及文件变更清单

| 文件 | 变更内容 | 工作量 |
|------|---------|--------|
| `index.html` | 删除 2 个生成按钮，新增 3 个 toggle 按钮 | ⭐ |
| `styles/main.css` | toggle 按钮样式（与 mode-btn 共用或新增） | ⭐ |
| `scripts/main.js` | `refreshAnnotationStyle` 重写 scale 分支、删除 `isSolfegeMode`/`isNoteNameMode`、新增 `setAnnotationMode`、更新事件绑定 | ⭐⭐⭐ |
| `scripts/data.js` | 新增 i18n 键（音名/唱名/音级） | ⭐ |
| `scripts/fretboard-manager.js` | `exportAll`/`importAll` 新增 `annotationMode` 字段 | ⭐ |

---

## 六、实现步骤建议

```
Phase 1（推荐）
┌─────────────────────────────────────────────┐
│ 1. 修改 refreshAnnotationStyle             │
│    scale 分支支持三种模式                   │
│    chord 分支改为读取全局 annotationMode    │
├─────────────────────────────────────────────┤
│ 2. 新增 annotationMode 全局变量             │
│    默认 'interval'（兼容旧和弦行为）        │
├─────────────────────────────────────────────┤
│ 3. 修改 generateScale / generateChordBase   │
│    去掉 chord 中的 isSolfege/isNoteName     │
│    currentTemplate 不再存模式标志           │
├─────────────────────────────────────────────┤
│ 4. 实现 setAnnotationMode(mode) 函数        │
│    切换 → 刷新标注 → 重绘                  │
├─────────────────────────────────────────────┤
│ 5. 更新 HTML / 事件绑定                     │
│    2 个生成按钮 + 3 个 toggle 按钮          │
├─────────────────────────────────────────────┤
│ 6. 更新自动保存                             │
│    exportAll/importAll 支持 annotationMode  │
└─────────────────────────────────────────────┘
```

---

## 七、风险与兼容性

| 风险 | 说明 | 缓解 |
|------|------|------|
| 旧版 JSON 导入 | 旧 JSON 的 chord 含 `isSolfegeMode`/`isNoteNameMode` | `importData` 检测旧字段并映射到 `annotationMode` |
| 音阶音级标注 | 目前音阶只有音名，新增音级需验证计算逻辑 | 复用已有 `getNumberForNote` 的偏移计算 |
| 多指板同步 | 每个指板独立 template，但 annotationMode 是全局的 | 确认切换时所有指板都刷新 |
| 用户习惯 | 原来 4 个按钮直接对应不同模式 | toggle 方式需要用户多一步操作但更灵活 |

---

*本文档为可行性分析，具体实现细节在开发前将进一步细化。*
