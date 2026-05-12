# 颜色系统重构设计大纲

---

## 一、目标

| 当前 | 目标 |
|------|------|
| ~78 种颜色（CSS 变量） | **≤10 种颜色 / 每套主题** |
| 14 处硬编码色值 | **0 处硬编码** |
| 仅浅色 / 深色 两套 | **8 套风格化主题**（用户可自由选择） |
| 颜色选择随意 | **基于潮流设计语言的配色方案** |

---

## 二、10 种颜色如何覆盖整个页面

### 核心理念：亮度排序 + 前景色自主声明

10 种颜色按**亮度从高到低**排列编号 C01~C10。每套主题的 10 色必须满足：

- **C01 最亮**（接近白色）— 适合大面积背景
- **C10 最暗**（接近黑色）— 适合最深的分割/描边
- **C05 和 C06 居中** — 主文字和次要文字的基底参照系

但仅靠亮度排序不够——同一个颜色在不同主题中可能做"按钮底色"或"背景色"的用途不同。
因此引入**独立的前景色变量**，让每个可交互区域明确声明文字色：

| 变量 | 用途 | 取值规则 |
|------|------|---------|
| `--clr-text` | 正文文字 | 始终选择 C01~C04 中亮度最远的那个的**反色**（见下方亮度对照表） |
| `--clr-text-btn` | 按钮上的文字 | 根据 C07 亮度：若 C07 亮度 < 50% → 白色；≥ 50% → `--clr-text` |
| `--clr-text-accent` | 强调色上的文字 | 根据 C08 亮度：同上规则 |
| `--clr-text-danger` | 危险按钮上的文字 | 根据 C09 亮度：同上规则 |
| `--clr-text-ann` | 标注圈内的文字 | 跟随 `--clr-text`（标注圈底色用 `--clr-card`） |

### 亮度判定标准

```
亮度（relative luminance）≈ 0.299×R + 0.587×G + 0.114×B   (0~255)
标准化 = 亮度 / 255
若标准化 ≥ 0.5 → 「浅色」，文字用深色
若标准化 < 0.5 → 「深色」，文字用浅色（#fff 或 #f0f0f0）
```

每个主题设计完成后，用此公式验证 C01~C10 的亮度是否严格递减，以及每个前景/背景对是否符合 WCAG 3:1 最低对比度。

---

## 10 种颜色如何覆盖整个页面

### 颜色分配表

| 编号 | 角色 | CSS 变量名 | 亮度范围 | 文字色来源 |
|------|------|-----------|---------|-----------|
| C01 | **页面底色** | `--clr-bg` | 最亮（85~100%） | 用 `--clr-text` |
| C02 | **卡片底色** | `--clr-card` | 亮（70~90%） | 用 `--clr-text` |
| C03 | **面板底色** | `--clr-panel` | 中亮（55~80%） | 用 `--clr-text` |
| C04 | **画布底色** | `--clr-canvas` | 中亮（50~75%） | 用 `--clr-text` |
| C05 | **主文字** | `--clr-text` | 暗（5~25%） | 自身 |
| C06 | **次要文字** | `--clr-muted` | 中暗（25~45%） | 自身（在深底上用`--clr-text`）|
| C07 | **主按钮** | `--clr-btn` | 中暗（15~40%） | 用 `--clr-text-btn`（自动浅色）|
| C08 | **强调色** | `--clr-accent` | 中（35~60%） | 用 `--clr-text-accent`（自动判断）|
| C09 | **危险色** | `--clr-danger` | 中暗（15~35%） | 用 `--clr-text-danger`（自动浅色）|
| C10 | **边框** | `--clr-border` | 中（30~55%） | 不承载文字，仅描边 |

| 编号 | 角色 | CSS 变量名 | 覆盖范围 |
|------|------|-----------|---------|
| C01 | **页面底色** | `--clr-bg` | `body`, 节拍器面板 |
| C02 | **卡片底色** | `--clr-card` | `.container`, `.tool-group`, `.tuning-panel-inner`, 输入框 |
| C03 | **面板底色** | `--clr-panel` | `.main-panel`, `.annotation-group-wrapper`, `.color-row` |
| C04 | **画布底色** | `--clr-canvas` | 指板 Canvas 背景 |
| C05 | **主文字** | `--clr-text` | 所有正文、按钮文字、画布文字 |
| C06 | **次要文字** | `--clr-muted` | 标签、副标题、画布副文字、占位符 |
| C07 | **主按钮** | `--clr-btn` | ✨ 音阶 🎼 和弦 按钮、保存/JSON/导入 按钮、指板操作按钮底色 |
| C08 | **强调色** | `--clr-accent` | 🟢 标注开关、🔘 开关滑块激活、节拍/重音点亮、橙黄按钮 |
| C09 | **危险色** | `--clr-danger` | ✕ 删除按钮、🗑️ 全部清空 |
| C10 | **边框** | `--clr-border` | 分割线、输入框边框、画布品丝/弦/标记 |

### 派生颜色与交互状态

| 派生 | 来源 | 方法 | 用途 |
|------|------|------|------|
| 按钮 hover | C07 | `filter: brightness(1.15)` | 按钮悬停态 |
| 危险 hover | C09 | `filter: brightness(1.2)` | 删除悬停态 |
| 强调 hover | C08 | `filter: brightness(0.85)` | 开关激活态 |
| 输入框底色 | C02 | `opacity: 0.8` | 输入框背景 |
| 画布副线 | C10 | `opacity: 0.6` | 品丝/琴枕 |
| 标注圈底色 | C02 | `--clr-card` | 指板标注圆圈底色 |
| 标注圈文字 | C05 | `--clr-text` | 指板标注文字色 |

### 前景色自动切换逻辑（CSS）

```css
/* 按钮文字 — 如果 C07（--clr-btn）偏暗，用白色；偏亮，用主文字色 */
--clr-text-btn: white;
/* 实际项目中通过 filter 或 JS 判断亮度后切换 */

/* 标注预设圈的 3 组颜色（从 HTML 内联硬编码改为变量） */
--clr-preset-red: #ff4444;
--clr-preset-white: #ffffff;
--clr-preset-black: #2c2c2c;
```

| 派生 | 来源 | 方法 | 用途 |
|------|------|------|------|
| 按钮 hover | C07 | `filter: brightness(1.15)` | 按钮悬停态 |
| 危险 hover | C09 | `filter: brightness(1.2)` | 删除悬停态 |
| 强调 hover | C08 | `filter: brightness(0.85)` | 开关激活态 |
| 输入框底色 | C02 或 C03 | 混合或半透明 | 输入框背景 |
| 画布副线 | C10 | `opacity: 0.6` | 品丝/琴枕 |
| 标注圈背景 | C02 | `--clr-card` | 指板标注圆圈底色 |
| 标注圈文字 | C05 | `--clr-text` | 指板标注文字色 |

---

## 三、当前颜色 → 新系统映射

### 白天模式示例映射

| 旧变量 | 旧值 | 新变量 | 说明 |
|--------|------|--------|------|
| `--color-bg-body` | `#2c3e2f` | `--clr-bg` | 页面底色 |
| `--color-bg-container` | `#fdf8e7` | `--clr-card` | 卡片 |
| `--color-bg-panel` | `#ece3d0` | `--clr-panel` | 面板 |
| `--color-bg-group` | `#fff7ea` | → 合并到 `--clr-card` | 不再单独 |
| `--color-bg-tool` | `#e2dccd` | → 合并到 `--clr-card` | 不再单独 |
| `--canvas-bg` | `#f9efdc` | `--clr-canvas` | 画布 |
| `--color-bg-metro` | `#25201a` | → 用 `--clr-bg` | 节拍器 |
| `--color-text-primary` | `#4a2e1e` | `--clr-text` | 主文字 |
| `--color-text-secondary` | `#8b7a65` | `--clr-muted` | 次要文字 |
| `--color-btn-primary` | `#4a6a3b` | `--clr-btn` | 主按钮 |
| `--color-btn-danger` | `#a1220a` | `--clr-danger` | 危险按钮 |
| `--color-border` | `#bcab8a` | `--clr-border` | 边框 |
| `--color-toggle-on` | `#e68a2e` | `--clr-accent` | 强调色 |
| `--canvas-line` | `#aa8c64` | `--clr-border` 派生产品 | 品丝线 |

### 删除的旧变量（合并后）

- `--color-bg-group` → 合并到 `--clr-card`
- `--color-bg-tool` → 合并到 `--clr-card`
- `--color-bg-metro-group` → 合并到 `--clr-card`
- `--color-bg-metro` → 用 `--clr-bg`
- `--color-bg-input` → 用 `--clr-card` 半透明
- `--color-text-metro` → 用 `--clr-text`
- `--color-text-bpm` → 用 `--clr-accent`
- `--color-text-countdown` → 用 `--clr-danger`
- `--color-btn-secondary` → 合并到 `--clr-btn`
- `--color-btn-mode / --color-btn-mode-active` → 合并到 `--clr-btn`
- `--color-btn-secondary-active` → 合并到 `--clr-accent`
- `--color-toggle-off` → 用 `--clr-border`
- `--color-beat-on` → 用 `--clr-accent`
- `--color-beat-off` → 用 `--clr-border`
- `--canvas-subtext` → 用 `--clr-muted`
- `--canvas-text` → 用 `--clr-text`
- `--canvas-nut / --canvas-line / --canvas-marker` → 用 `--clr-border` 系列
- `--canvas-string-dark / --canvas-string-light` → 用 `--clr-border` 系列
- `--canvas-ann-bg` → 用 `--clr-card`
- `--canvas-ann-text` → 用 `--clr-text`
- `--canvas-ann-border` → 用 `--clr-border`
- `--color-border-dark` → 用 `--clr-border`

---

## 四、8 套风格主题设计

### 每套主题必须通过的可读性检查清单

```
[ ] C01 > C02 > C03 > C04 > C05 亮度严格递减
[ ] C05（主文字）亮度 ≤ 25%，与 C01/C02/C03/C04 对比度 ≥ 4.5:1
[ ] C06（次要文字）亮度 ≤ 45%，与浅底对比度 ≥ 3:1
[ ] C07（主按钮）亮度 ≤ 40% → 按钮文字用白色
[ ] C09（危险色）亮度 ≤ 35% → 危险按钮文字用白色
[ ] C08（强调色）若亮度 ≥ 50% → 强调文字用深色；< 50% → 用白色
[ ] 按钮 Hover 状态下文字对比度不降低
[ ] 标注圈文字（C05）在标注圈底色（C02）上对比度 ≥ 4.5:1
```

---

## 8 套风格主题设计

### 主题 1：「奶油原木」Warm Cream（当前白天的精简版）

```
C01 bg        #1E2A1E    深木炭    亮度 15%  ← 注意：作为页面底色偏深
C02 card      #FDF8E7    奶油白    亮度 95%
C03 panel     #ECE3D0    原木色    亮度 85%
C04 canvas    #F9EFDC    米黄      亮度 92%
C05 text      #3A2A1A    深棕      亮度 14%
C06 muted     #9A8A70    暖灰      亮度 50%
C07 btn       #4A6A3B    森林绿    亮度 26% → 按钮文字用 white ✓
C08 accent    #D4892E    琥珀橙    亮度 53% → 文字按需判断（黑/白均可）
C09 danger    #B8321A    砖红      亮度 20% → 文字用 white ✓
C10 border    #BCAB8A    沙色      亮度 62%

亮度排序验证：C02(95%) > C04(92%) > C03(85%) > C10(62%) > C08(53%)
                > C06(50%) > C07(26%) > C09(20%) > C01(15%) > C05(14%)
问题：C01(15%) 比 C05(14%) 暗！C01 作为页面底色过暗 → 建议调亮至 #3A4A3A（亮度25%）
     以确保 C01(25%) > C05(14%) 的亮度递减成立
```
```
C01 bg        #1E2A1E    深木炭（取代 #2c3e2f）
C02 card      #FDF8E7    奶油白
C03 panel     #ECE3D0    原木色
C04 canvas    #F9EFDC    米黄
C05 text      #3A2A1A    深棕（不是#4a2e1e）
C06 muted     #9A8A70    暖灰（不是#8b7a65）
C07 btn       #4A6A3B    森林绿
C08 accent    #D4892E    琥珀橙（不是#e68a2e）
C09 danger    #B8321A    砖红（不是#a1220a）
C10 border    #BCAB8A    沙色
```

### 主题 2：「冷夜星辰」Cool Midnight（当前黑夜的精简版）
```
C01 bg        #0A0E1A    深蓝黑
C02 card      #16213E    藏蓝
C03 panel     #0D1B2A    深海蓝
C04 canvas    #0D1B2A    同面板
C05 text      #E8E8F0    冷白
C06 muted     #8890A0    灰蓝
C07 btn       #4A69BD    柔和蓝
C08 accent    #F0A030    暖金
C09 danger    #E53935    亮红
C10 border    #3A4A60    钢蓝
```

### 主题 3：「极简黑白」Monochrome
```
C01 bg        #FFFFFF    纯白
C02 card      #F5F5F5    极浅灰
C03 panel     #EEEEEE    浅灰
C04 canvas    #FAFAFA    近白
C05 text      #1A1A1A    近黑
C06 muted     #999999    中灰
C07 btn       #333333    深灰
C08 accent    #000000    纯黑
C09 danger    #CC3333    暗红（唯一色彩）
C10 border    #CCCCCC    亮灰
```

### 主题 4：「复古暖屏」Retro Warm
```
C01 bg        #2B2522    深褐
C02 card      #E8DCC8    旧纸
C03 panel     #D4C5A9    泛黄
C04 canvas    #F0E4C8    浅旧纸
C05 text      #3D322A    深褐
C06 muted     #8C7A60    土黄
C07 btn       #7A5E3A    皮革棕
C08 accent    #B87A2E    古铜
C09 danger    #8B3A1A    铁锈红
C10 border    #B8A482    陶土
```

### 主题 5：「赛博霓虹」Cyber Neon
```
C01 bg        #0A0A1A    极黑
C02 card      #181830    深紫黑
C03 panel     #1A1A40    靛蓝
C04 canvas    #101030    暗紫
C05 text      #E0E0FF    冷白蓝
C06 muted     #7070AA    灰紫
C07 btn       #FF3366    霓虹粉
C08 accent    #00FFCC    青绿
C09 danger    #FF2255    亮红
C10 border    #333366    深紫罗兰
```

### 主题 6：「北欧清新」Nordic Fresh
```
C01 bg        #2C3E50    灰蓝
C02 card      #F8F9FA    近白
C03 panel     #ECF0F1    冷灰
C04 canvas    #FFFFFF    纯白
C05 text      #2C3E50    灰蓝
C06 muted     #95A5A6    灰绿
C07 btn       #3498DB    天蓝
C08 accent    #E67E22    暖橙
C09 danger    #E74C3C    珊瑚红
C10 border    #BDC3C7    银灰
```

### 主题 7：「森林绿意」Forest
```
C01 bg        #1A2E1A    深墨绿
C02 card      #F0F7E6    嫩绿白
C03 panel     #DCE8C8    草绿
C04 canvas    #F5FAEE    青白
C05 text      #2A3A1A    深绿
C06 muted     #7A9A5A    灰绿
C07 btn       #3D7A3A    叶绿
C08 accent    #D4A030    芥末黄
C09 danger    #A04020    红褐
C10 border    #AAB890    橄榄灰
```

### 主题 8：「和风」Wabi-Sabi
```
C01 bg        #3A3530    炭灰
C02 card      #F5EDE0    宣纸白
C03 panel     #E8DDD0    浅茶
C04 canvas    #F8F0E0    米白
C05 text      #3D3530    墨色
C06 muted     #9A8A78    鼠色
C07 btn       #8B4513    柿色（#8B4513 → 改用柔和版 #A0502A）
C08 accent    #C84040    朱红（节制使用）
C09 danger    #A03030    胭脂
C10 border    #BCAAA0    茶色
```

---

## 五、实施步骤

1. 重写 CSS 变量系统：`--clr-*` 替换所有 `--color-*`
2. 合并冗余变量为 10 色体系
3. 移除所有硬编码色值（`#4CAF50`、`#ff4444`、`#2c4a1e` 等），映射到 `--clr-*`
4. 将 `.color-btn` 预设颜色（`#ff4444` 等）也纳入变量
5. 主题切换：`<body data-theme="nordic">` 替代 `data-theme="light"` / `"dark"`
6. 主题选择器 UI：新增下拉或按钮面板让用户选择 8 套主题
7. 保存到 localStorage 并随自动存档恢复

---

确认后说「开始实施」进入第一步。
