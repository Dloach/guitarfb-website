# 颜色系统统计 · 白天 & 黑夜模式

> 注：硬编码色值（未通过变量控制）标记 ⚠️

---

## 一、背景色

| 用途 | CSS 变量 | 白天 | 黑夜 |
|------|---------|------|------|
| 页面主体 | `--color-bg-body` | `#2c3e2f` | `#1a1a2e` |
| 容器 | `--color-bg-container` | `#fdf8e7` | `#16213e` |
| 标题栏 | `--color-bg-title` | `#e2dccd` | `#0f3460` |
| 主面板 | `--color-bg-panel` | `#ece3d0` | `#0d1b2a` |
| 分组/工具栏 | `--color-bg-group` | `#fff7ea` | `#16213e` |
| 标注工具栏 | `--color-bg-tool` | `#e2dccd` | `#0f3460` |
| 节拍器面板 | `--color-bg-metro` | `#25201a` | `#1a1a2e` |
| 节拍器分组 | `--color-bg-metro-group` | `#3e3327` | `#1b263b` |
| 指板画布 | `--color-bg-canvas` | `#f9f2dc` | `#0d1b2a` |
| 输入框 | `--color-bg-input` | `rgba(255,255,255,0.9)` | `rgba(30,40,60,0.9)` |

## 二、文字色

| 用途 | CSS 变量 | 白天 | 黑夜 |
|------|---------|------|------|
| 主文字 | `--color-text-primary` | `#4a2e1e` | `#eaeaea` |
| 次要文字 | `--color-text-secondary` | `#8b7a65` | `#a0a0a0` |
| 节拍器文字 | `--color-text-metro` | `#f0e3c9` | `#e0e0e0` |
| BPM 数值 | `--color-text-bpm` | `#ffcc77` | `#ffd93d` |
| 倒计时 | `--color-text-countdown` | `#ffaa66` | `#ff9f43` |

## 三、按钮色

| 用途 | CSS 变量 | 白天 | 黑夜 |
|------|---------|------|------|
| 主要按钮（生成） | `--color-btn-primary` | `#4a6a3b` | `#4a69bd` |
| 次要按钮（模式） | `--color-btn-secondary` | `#6b5c48` | `#5c6bc0` |
| 次要按钮激活 | `--color-btn-secondary-active` | `#4a3a2a` | `#3949ab` |
| 模态按钮（暗色）⚠️ | `--color-btn-mode` | `#7c5a88` | `#7c5a88` |
| 模态按钮激活⚠️ | `--color-btn-mode-active` | `#5a3a66` | `#5a3a66` |
| 危险（红色） | `--color-btn-danger` | `#a1220a` | `#e53935` |
| 生成悬停 | 硬编码 | `#2c4a1e` | `#2c4a1e` ⚠️ |

## 四、指板操作按钮（硬编码 ⚠️）

| 按钮 | 白天 | 黑夜 |
|------|------|------|
| 上移/下移（▲▼） | `var(--color-toggle-on)` → `#e68a2e` / `#ff9800` |
| 删除（✕） | `var(--color-btn-danger)` → `#a1220a` / `#e53935` |
| 复制/新增/调音（⧉ + 𝄞） | **`#4CAF50`** ⚠️（两端一致） |
| 调音按钮激活 | **`#2E7D32`** ⚠️（两端一致） |

## 五、标注开关（硬编码 ⚠️）

| 状态 | 色值 |
|------|------|
| 标注开关激活 | `#4CAF50` ⚠️ |
| 开启位置 | `left: 16px` |

## 六、颜色预设（HTML 内联 ⚠️）

| 名称 | 背景色 | 文字色 |
|------|-------|--------|
| 预设红 | `#ff4444` | `#ffffff` |
| 预设白 | `#ffffff` | `#1e2a1a` |
| 预设黑 | `#2c2c2c` | `#ffffff` |

## 七、边框与分割线

| 用途 | CSS 变量 | 白天 | 黑夜 |
|------|---------|------|------|
| 边框（浅） | `--color-border` | `#bcab8a` | `#424242` |
| 边框（深） | `--color-border-dark` | `#5a4a3a` | `#37474f` |

## 八、开关与节拍器

| 用途 | CSS 变量 | 白天 | 黑夜 |
|------|---------|------|------|
| 开关关闭 | `--color-toggle-off` | `#5a4a3a` | `#455a64` |
| 开关开启 | `--color-toggle-on` | `#e68a2e` | `#ff9800` |
| 节拍关 | `--color-beat-off` | `#3a2e24` | `#455a64` |
| 节拍开 | `--color-beat-on` | `#ffaa33` | `#ff9800` |
| 重音/定时开关 | — | `var(--color-toggle-on)` | `var(--color-toggle-on)` |

## 九、Canvas 绘制颜色

| 用途 | CSS 变量 | 白天 | 黑夜 |
|------|---------|------|------|
| 画布底色 | `--canvas-bg` | `#f9efdc` | `#0d1b2a` |
| 画布文字 | `--canvas-text` | `#3a2a1a` | `#eaeaea` |
| 画布副文字 | `--canvas-subtext` | `#8b7a65` | `#888888` |
| 品丝线 | `--canvas-line` | `#aa8c64` | `#4a5568` |
| 琴枕 | `--canvas-nut` | `#7c5a38` | `#2d3748` |
| 指板标记 | `--canvas-marker` | `#cfbc8c` | `#4a5568` |
| 弦（深） | `--canvas-string-dark` | `#8b7a65` | `#555566` |
| 弦（浅） | `--canvas-string-light` | `#8b7a65` | `#4a4a5a` |
| 标注背景 | `--canvas-ann-bg` | `#ffffff` | `#2d3748` |
| 标注边框 | `--canvas-ann-border` | `#b0a07c` | `#4a5568` |
| 标注文字 | `--canvas-ann-text` | `#1e2a1a` | `#eaeaea` |

---

## 硬编码色值统计（⚠️ 需修复为 CSS 变量）

| 文件 | 色值 | 用途 |
|------|------|------|
| `main.css` | `#4CAF50` | ⧉ 复制按钮背景 |
| `main.css` | `#4CAF50` | + 新增按钮背景 |
| `main.css` | `#4CAF50` | 𝄞 调音按钮背景 |
| `main.css` | `#2E7D32` | 𝄞 调音按钮激活 |
| `main.css` | `#4CAF50` | 标注开关激活背景 |
| `main.css` | `#2c4a1e` | 生成按钮 hover |
| `main.css` | `#3a2e24` | 调音面板 hover |
| `main.css` | `#7a1a08` | 清除全部 hover |
| `main.css` | `#7c5a88` | 深色模式按钮底色 |
| `main.css` | `#5a3a66` | 深色模式按钮激活 |
| `main.css` | `#ffd966` | 模式按钮激活高光 |
| `index.html` | `#ff4444` | 预置红色 |
| `index.html` | `#ffffff` | 预置白色 |
| `index.html` | `#2c2c2c` | 预置黑色 |
