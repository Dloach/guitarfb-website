# 颜色主题选择器 · UI 设计文档

---

## 一、交互流程

```
┌─────────────────────────────────────┐
│  🎸 标题  [输入框]  [EN]  [🎨]      │  ← 标题栏，日夜切换改为 🎨 调色板按钮
└─────────────────────────────────────┘
         ▼ 点击 🎨 按钮展开 ▼
┌─────────────────────────────────────┐
│  选择配色方案                         │
│                                      │
│  [●●●●●●●●●●]  [●●●●●●●●●●]       │  行1 奶油原木 / 冷夜星辰
│      奶油原木        冷夜星辰          │
│                                      │
│  [●●●●●●●●●●]  [●●●●●●●●●●]       │  行2 极简黑白 / 复古暖屏
│      极简黑白        复古暖屏          │
│                                      │
│  [●●●●●●●●●●]  [●●●●●●●●●●]       │  行3 赛博霓虹 / 北欧清新
│      赛博霓虹        北欧清新          │
│                                      │
│  [●●●●●●●●●●]  [●●●●●●●●●●]       │  行4 森林绿意 / 和风
│      森林绿意          和风            │
└─────────────────────────────────────┘
         ▼ 点击任一图案 ▼
    ⟳ 切换到该主题
    ⟳ 面板自动折叠
    ⟳ 所有指板重绘
```

---

## 二、按钮位置替换

| 原按钮 | 新按钮 |
|--------|--------|
| `🌙` 主题切换（日夜） | `🎨` 调色板 |
| `data-i18n="lightMode"` / `"darkMode"` | 移除 i18n，始终显示 🎨 |

- 原 `themeToggle` 按钮的 `click` 事件改为 `toggleThemePalette()`
- 主题面板的 HTML 放在标题栏下方，`.container` 内第一个子元素
- 面板默认 `display: none`，展开时 `display: block`

---

## 三、HTML 结构

```html
<!-- 标题栏（不变，仅改 themeToggle 为 🎨） -->
<div class="title-bar">
    <label id="labelBoardTitle" data-i18n="labelBoardTitle">🎸 标题</label>
    <input type="text" id="boardTitle" ...>
    <button id="langToggle" class="lang-toggle">EN</button>
    <button id="paletteToggle" class="palette-toggle">🎨</button>
</div>

<!-- 配色方案选择面板 -->
<div id="palettePanel" class="palette-panel" style="display:none;">
    <div class="palette-grid">
        <!-- 每行两个 palette-card，共 4 行 -->
        <div class="palette-card" data-palette="warm-cream">
            <div class="palette-swatches">
                <span style="background:#1E2A1E"></span>
                <span style="background:#FDF8E7"></span>
                <span style="background:#ECE3D0"></span>
                <span style="background:#F9EFDC"></span>
                <span style="background:#3A2A1A"></span>
                <span style="background:#9A8A70"></span>
                <span style="background:#4A6A3B"></span>
                <span style="background:#D4892E"></span>
                <span style="background:#B8321A"></span>
                <span style="background:#BCAB8A"></span>
            </div>
            <div class="palette-name" data-i18n="palette-warm-cream">奶油原木</div>
        </div>
        <!-- ... 其余 7 个 palette-card，结构同上 ... -->
    </div>
</div>
```

### template 生成（JS）

10 个色块通过 JS 动态生成，减少 HTML 体积。静态 HTML 只需保留 palette-panel 容器骨架，色块在 `DOMContentLoaded` 时由 `initPalettePanel()` 生成：

```js
const PALETTES = {
    'warm-cream': {
        name: { zh: '奶油原木', en: 'Warm Cream' },
        colors: ['#1E2A1E','#FDF8E7','#ECE3D0','#F9EFDC','#3A2A1A','#9A8A70','#4A6A3B','#D4892E','#B8321A','#BCAB8A']
    },
    'cool-midnight': { ... },
    'monochrome': { ... },
    // ... 共 8 组
};
```

---

## 四、CSS 样式

### 调色板按钮

```css
.palette-toggle {
    background: var(--clr-panel);
    border: 2px solid var(--clr-border);
    border-radius: 50px;
    font-size: 18px;
    cursor: pointer;
    padding: 6px 12px;
    transition: 0.2s;
}
.palette-toggle:hover { background: var(--clr-card); }
```

### 调色板面板

```css
.palette-panel {
    max-width: 600px;
    margin: 6px auto 0;
    padding: 16px 20px;
    background: var(--clr-card);
    border-radius: var(--radius-xl);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.palette-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.palette-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 8px;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: 0.2s;
    border: 2px solid transparent;
}
.palette-card:hover { border-color: var(--clr-accent); }
.palette-card.active { border-color: var(--clr-text); background: var(--clr-panel); }

.palette-swatches {
    display: flex;
    gap: 3px;
}
.palette-swatches span {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.1);
}

.palette-name {
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    color: var(--clr-text);
}
```

### 手机端适配（660px/800px）

```css
.palette-swatches span { width: 16px; height: 16px; }
.palette-card { padding: 6px 4px; }
.palette-name { font-size: 10px; }
```

---

## 五、JS 交互逻辑

### 数据结构

```js
// 定义在 data.js 或 main.js 顶部
G.PALETTES = {
    'warm-cream': {
        name: { zh: '奶油原木', en: 'Warm Cream' },
        colors: {
            bg: '#1E2A1E', card: '#FDF8E7', panel: '#ECE3D0',
            canvas: '#F9EFDC', text: '#3A2A1A', muted: '#9A8A70',
            btn: '#4A6A3B', accent: '#D4892E', danger: '#B8321A',
            border: '#BCAB8A'
        }
    },
    // ... 7 more
};
```

### 切换函数

```js
function applyPalette(id) {
    var p = G.PALETTES[id];
    if (!p) return;
    var root = document.documentElement;
    var c = p.colors;
    root.style.setProperty('--clr-bg', c.bg);
    root.style.setProperty('--clr-card', c.card);
    root.style.setProperty('--clr-panel', c.panel);
    root.style.setProperty('--clr-canvas', c.canvas);
    root.style.setProperty('--clr-text', c.text);
    root.style.setProperty('--clr-muted', c.muted);
    root.style.setProperty('--clr-btn', c.btn);
    root.style.setProperty('--clr-accent', c.accent);
    root.style.setProperty('--clr-danger', c.danger);
    root.style.setProperty('--clr-border', c.border);
    // 更新画布
    G.currentPalette = id;
    if (G.fretboardMgr) {
        G.fretboardMgr.getAll().forEach(function(fb) {
            fb.renderer.draw(fb.controller.getAnnotations(), fb.controller.currentTemplate, fb.boardTitle || '');
        });
    }
    // 持久化
    localStorage.setItem('guitarfb-palette', id);
    // 高亮当前
    document.querySelectorAll('.palette-card').forEach(function(card) {
        card.classList.toggle('active', card.dataset.palette === id);
    });
    // 折叠面板
    var panel = document.getElementById('palettePanel');
    if (panel) panel.style.display = 'none';
}

// 初始化
function initPalettePanel() {
    var panel = document.getElementById('palettePanel');
    if (!panel) return;
    var saved = localStorage.getItem('guitarfb-palette') || 'warm-cream';
    // 生成卡片...
    applyPalette(saved);
}
```

### 事件绑定

```js
// 🎨 按钮切换面板
DOM.paletteToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    var panel = document.getElementById('palettePanel');
    if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
});

// 点击面板外部关闭
document.addEventListener('click', function(e) {
    var panel = document.getElementById('palettePanel');
    if (panel && panel.style.display !== 'none' &&
        !panel.contains(e.target) && e.target.id !== 'paletteToggle') {
        panel.style.display = 'none';
    }
});
```

---

## 六、迁移步骤

1. 在 `G.PALETTES` 中定义 8 套颜色数据（每套 10 色 + 中英文名）
2. 替换 `themeToggle` 按钮为 `paletteToggle`（🎨）
3. 在标题栏下方添加 `palette-panel` 容器
4. `initPalettePanel()` 从 `G.PALETTES` 动态生成 `palette-card`
5. `applyPalette(id)` 写入 CSS 变量 + 重绘画布
6. 删除旧 CSS 变量（`--color-*`、`--canvas-*`、`_clr-*`）
7. 替换所有引用 `var(--color-xxx)` → `var(--clr-xxx)` 的 CSS 规则
8. 手机端适配调色板样式
9. 主题持久化（localStorage: `guitarfb-palette`）
10. 自动存档恢复时也恢复主题（importAll 中读取 palette）

---

## 七、效果预览

```
 ┌─────────────────────────────────────┐
 │ 🎸 标题  [吉他指板练习]  [EN]  [🎨] │  ← 🎨 替换了 🌙
 └─────────────────────────────────────┘
 ┌─────────────────────────────────────┐
 │  选择配色方案                         │
 │  ◉◉◉◉◉◉◉◉◉◉  ◉◉◉◉◉◉◉◉◉◉           │
 │  奶油原木 ●    冷夜星辰               │
 │  ◉◉◉◉◉◉◉◉◉◉  ◉◉◉◉◉◉◉◉◉◉           │
 │  极简黑白      复古暖屏               │
 │  ◉◉◉◉◉◉◉◉◉◉  ◉◉◉◉◉◉◉◉◉◉           │
 │  赛博霓虹      北欧清新               │
 │  ◉◉◉◉◉◉◉◉◉◉  ◉◉◉◉◉◉◉◉◉◉           │
 │  森林绿意        和风                 │
 └─────────────────────────────────────┘
```
