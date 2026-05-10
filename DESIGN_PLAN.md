# GuitarFB 配色与设计语言优化计划

> 版本：v6 · 基于 v5 分析  
> 日期：2026-05-11

---

## 一、当前配色概览

### 浅色主题（暖色系）

| 令牌 | 色值 | 用途 |
|------|------|------|
| `--color-bg-body` | `#2c3e2f` | 页面背景（深橄榄绿） |
| `--color-bg-container` | `#fdf8e7` | 主容器（奶白） |
| `--color-bg-panel` | `#ece3d0` | 参数面板（暖米色） |
| `--color-bg-canvas` | `#f9f2dc` | 指板画布（浅米） |
| `--color-bg-metro` | `#25201a` | 节拍器面板（深棕近黑） |
| `--color-btn-primary` | `#4a6a3b` | 主要按钮（橄榄绿） |
| `--color-btn-danger` | `#a1220a` | 清空按钮（暗红） |
| `--color-toggle-on` | `#e68a2e` | 开关开启（琥珀） |
| `--color-text-primary` | `#4a2e1e` | 主文字（深褐） |
| `--color-border` | `#bcab8a` | 边框（茶色） |

### 深色主题（冷色系）

| 令牌 | 色值 | 用途 |
|------|------|------|
| `--color-bg-body` | `#1a1a2e` | 页面背景（深藏青） |
| `--color-bg-container` | `#16213e` | 主容器（藏青） |
| `--color-bg-panel` | `#0d1b2a` | 参数面板（深蓝黑） |
| `--color-bg-canvas` | `#0d1b2a` | 指板画布 |
| `--color-bg-metro` | `#1a1a2e` | 节拍器面板（同背景） |
| `--color-btn-primary` | `#4a69bd` | 主要按钮（蓝色） |
| `--color-btn-danger` | `#e53935` | 清空按钮（红色） |
| `--color-toggle-on` | `#ff9800` | 开关开启（橙） |
| `--color-text-primary` | `#eaeaea` | 主文字（近白） |
| `--color-border` | `#424242` | 边框（深灰） |

---

## 二、核心问题

### 1. 浅色/深色主题色相完全相反

浅色是 **暖色**（褐/绿/米），深色是 **冷色**（蓝/藏青）。切换主题时用户感觉像换了另一个网站，视觉连续性断裂。

### 2. 按钮颜色种类过多（5+ 种）

| 浅色 | 深色 |
|------|------|
| 主按钮(绿 `#4a6a3b`) | 主按钮(蓝 `#4a69bd`) |
| 模式按钮(棕 `#8b6b42`) | 模式按钮(淡蓝 `#5c6bc0`) |
| 节拍器按钮(褐 `#5f4a32`) | 节拍器按钮(蓝 `#3e50b4`) |
| 危险按钮(暗红 `#a1220a`) | 危险按钮(红 `#e53935`) |
| 生成按钮(同主按钮绿) | 生成按钮(同主按钮蓝) |

*实际上只需要 2-3 种按钮层级（主要动作 / 次要动作 / 危险操作）。*

### 3. 节拍器面板在浅色下游离于整体设计之外

浅色中节拍器面板是 `#25201a`（深棕近黑），而页面其他所有卡片面板都是暖米色。它看起来像被独立硬塞进来的组件，缺乏视觉归属。

### 4. 指板渲染颜色硬编码在 JavaScript 中

Canvas 画线颜色、弦色、品记色等写在 `FretboardRenderer.draw()` 里：

```js
const colors = currentTheme === 'dark' ? {
    bg: '#0d1b2a', line: '#4a5568', stringDark: '#555566', ...
} : {
    bg: '#f9efdc', line: '#aa8c64', stringDark: '#8b7a65', ...
};
```

切换主题时靠 JS 条件判断改变，而不是通过 CSS 变量自动响应。**应该把这些颜色提取到 CSS 自定义属性中，在 `draw()` 里通过 `getComputedStyle()` 读取。**

### 5. 间距体系无规律

```css
--padding-xs: 7px 13px;
--padding-sm: 9px 14px;
--padding-md: 11px 20px;
--padding-lg: 13px 25px;
```

不遵循常见的 **4px / 8px 网格**，视觉上缺乏节奏感，不同组件的边距不一致。

### 6. 圆角值偏高且跨度奇怪

```css
--radius-sm: 25px;   /* "小圆角"就 25px，已经是强圆角 */
--radius-md: 29px;   /* sm→md 只差 4px */
--radius-lg: 36px;   /* md→lg 差 7px */
--radius-xl: 43px;   /* lg→xl 差 7px */
```

### 7. 无表面层级 / 阴影体系

除了容器有一个 `box-shadow` 外，内部面板、卡片之间没有一致的深度区分。弹窗、下拉面板等浮层也没有专属的阴影变量。

---

## 三、优化方向

### 方向 A — 统一色相方向（🔥 推荐优先做）

选择一个主色相方向贯穿两个主题，保证切换主题时视觉连续。

**推荐暖色方案：**

```
令牌              浅色            深色
────────────────────────────────────────────
--bg-body        #f5f0e8  暖白    #1c1a16  深炭
--bg-container   #fdf8e7  奶油    #2a2620  暖深灰
--bg-panel       #ece3d0  米色    #352f28  深褐
--bg-canvas      #f9f2dc  浅米    #2c2821  暖深灰
--bg-metro       #3a3026  深褐    #221e18  近黑
--btn-primary    #4a6a3b  橄榄绿  #3d5a30  哑光橄榄
--accent         #e68a2e  琥珀    #e8a030  同色系调明度
--text-primary   #4a2e1e  深褐    #d4cdc0  暖灰
```

### 方向 B — 精简按钮颜色体系（可配合 A 一起做）

| 层级 | 用途 | 建议颜色变量 |
|------|------|-------------|
| Primary | 生成音阶/和弦、导出 | `--color-btn-primary` |
| Secondary | 模式切换、调音按钮 | `--color-btn-secondary` |
| Danger | 清空 | `--color-btn-danger` |
| Metro | 节拍器按钮 | 使用 `--color-btn-metro`，与面板协调 |

### 方向 C — 用 CSS 变量接管 Canvas 颜色（推荐单独做）

在 `:root` 中添加：

```css
--canvas-bg: #f9f2dc;
--canvas-line: #aa8c64;
--canvas-string-dark: #8b7a65;
--canvas-string-light: #8b7a65;
--canvas-nut: #7c5a38;
--canvas-marker: #cfbc8c;
```

深色主题覆盖：

```css
[data-theme="dark"] {
  --canvas-bg: #0d1b2a;
  --canvas-line: #4a5568;
  --canvas-string-dark: #555566;
  --canvas-string-light: #4a4a5a;
  --canvas-nut: #2d3748;
  --canvas-marker: #4a5568;
}
```

在 `FretboardRenderer.draw()` 中通过 `getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg')` 读取，消除 JS 硬编码。

### 方向 D — 间距体系 8px 网格

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
```

逐步用这些变量替换现有的 `padding` / `margin` / `gap` 值。

### 方向 E — 圆角序列规范化

```css
--radius-sm: 8px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
```

---

## 四、建议执行顺序

1. **方向 C**（纯提取，不影响布局，收益高） → 把 Canvas 颜色移到 CSS 变量
2. **方向 A**（核心视觉统一） → 统一两个主题的色相方向
3. **方向 B**（精简按钮） → 合并多余按钮颜色
4. **方向 D + E**（间距与圆角） → 规范化间距系统和圆角序列
