# GuitarFB v7 — 预设系统可行性研究与开发框架

> 版本：v0.1 · 草案  
> 基于 v6（v1.0.0）代码分析  
> 日期：2026-05-11

---

## 一、现状分析

### 1.1 已有的基础

v6 已经实现了 JSON 的 导出/导入 功能，为预设系统奠定了关键基础：

| 已有组件 | 说明 |
|---------|------|
| `controller.exportData()` | 导出当前完整状态为 JSON 对象 |
| `controller.importData(data)` | 从 JSON 对象恢复完整状态 |
| `DOM.exportData` (💾 JSON) | 按钮 → 下载 JSON 文件 |
| `DOM.importBtn` / `DOM.importFile` (📂 导入) | 按钮 → 上传 JSON 文件 |
| `localStorage` | 已在 data.js 中用于 debug 开关检测 |

### 1.2 现有的状态字段

`exportData()` 输出的 JSON 结构已覆盖全部可恢复状态：

```json
{
  "annotations": [...],
  "currentTemplate": {...},
  "tuningConfig": {...},
  "boardTitle": "...",
  "keySelect": "...",
  "scaleSelect": "...",
  "chordFamilySelect": "...",
  "chordDegreeSelect": "...",
  "manualText": "...",
  "manualBg": "#...",
  "manualTextColor": "#...",
  "bpm": 120,
  "beatPerBar": 4,
  "rhythmDiv": 4,
  "accent": true/false,
  "timerActive": true/false,
  "timerMinutes": 5,
  "theme": "light/dark"
}
```

### 1.3 缺失的能力

| 缺失功能 | 欠缺原因 |
|---------|---------|
| 自动保存/恢复 | 无 localStorage 自动存储逻辑 |
| 命名预设（存多套） | exportData 只有「导出当前」没有「保存多套」 |
| 预设管理面板 | UI 中没有预设列表/选择器 |
| 共享预设 + 排行榜 | 需要后端服务或第三方存储 |
| 预设元数据 | 无 name/description/author/version/date 字段 |

---

## 二、功能需求总览

### 2.1 核心功能

```
┌─────────────────────────────────────────────────┐
│                 预设系统 (v7)                      │
├─────────────────────────────────────────────────┤
│  ① 本地自动保存/恢复                              │
│     └─ 页面关闭 → localStorage 存最新状态          │
│     └─ 页面打开 → 自动恢复到最后操作状态            │
│                                                 │
│  ② 用户命名预设（本地存储）                        │
│     └─ 给当前状态命名并保存到 localStorage          │
│     └─ 列表展示 → 点击载入 / 删除                  │
│     └─ 支持多套预设切换                            │
│                                                 │
│  ③ 预设导入/共享                                 │
│     └─ 导出命名预设为 .json 文件（含元数据）         │
│     └─ 导入他人分享的 .json 文件                   │
│     └─ 上传自己的预设到共享池（需后端）              │
│                                                 │
│  ④ 热门排行榜（需后端）                            │
│     └─ 当前最热 Top 10                            │
│     └─ 历史最热 Top 10                            │
└─────────────────────────────────────────────────┘
```

### 2.2 用户故事

| 用户场景 | 触发条件 | 期望行为 |
|---------|---------|---------|
| 日常练习者 | 每天打开网页 | 上次的调音/音阶/标注自动恢复，直接继续 |
| 多场景用户 | 标准调音 + 特殊调音切换 | 存两套预设「标准-民歌」「Drop D-摇滚」随时切换 |
| 教学分享者 | 做了一套音阶练习 | 导出为 .json 发给学生，学生导入即用 |
| 社区贡献者 | 分享高质量配置 | 上传到共享池 → 冲排行榜 |
| 设备更换者 | 清缓存/换电脑 | 从之前导出的 .json 一键恢复 |

---

## 三、技术可行性评估

### 3.1 本地存储方案

| 方案 | 容量 | 持久性 | 适用场景 | 评级 |
|------|------|--------|---------|------|
| **localStorage** | ~5-10MB | 永久（除非手动清除） | 自动保存 + 命名预设 | ⭐⭐⭐⭐⭐ |
| sessionStorage | ~5-10MB | 标签页关闭即消失 | ❌ 不适合 | ⭐ |
| IndexedDB | ~50MB+ | 永久 | 大量数据（不必要） | ⭐⭐⭐ |
| **File Export** | 不限 | 用户自己保管文件 | 共享/备份 | ⭐⭐⭐⭐⭐ |

**结论：** localStorage 足够承载预设系统。单个预设 JSON 约 2-50KB（主要看标注数量），即使存 50 套也只占 ~2.5MB。

### 3.2 自动保存技术方案

```javascript
// 核心逻辑 — 极其轻量
window.addEventListener('beforeunload', () => {
    const state = controller.exportData();
    localStorage.setItem('guitarfb_autosave', JSON.stringify(state));
});

// 页面加载时恢复
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('guitarfb_autosave');
    if (saved) {
        controller.importData(JSON.parse(saved));
    }
});
```

**可行性：** ✅ 5 行核心代码即可实现。但需要处理异常（JSON 解析失败、版本兼容等）。

### 3.3 命名预设存储方案

使用 localStorage 的 `guitarfb_presets` 键存储预设列表索引，每条预设独立键存储数据：

```
localStorage 结构:
├── guitarfb_autosave          → 最后状态的 JSON
├── guitarfb_presets           → ["preset_abc123", "preset_def456"]
├── guitarfb_preset_abc123     → { id, name, description, data: {...}, createdAt, updatedAt }
├── guitarfb_preset_def456     → { ... }
└── guitarfb_settings          → 非预设的用户偏好（语言、UI设置等）
```

**可行性：** ✅ 成熟方案，适合中小规模数据。

### 3.4 共享预设 + 排行榜方案

这里有两条技术路径：

#### 路径 A：纯前端 + 手动分享（✅ 立即可行，无需后端）

```
用户 A 导出 .json → 发到微信群/论坛 → 用户 B 下载 → 导入
```

- 优点：零服务器成本，立即可用
- 缺点：无排行榜，无发现机制

#### 路径 B：轻量后端（需要额外资源）

| 后端方案 | 成本 | 维护量 | 推荐度 |
|---------|------|--------|-------|
| **GitHub Gist API** (免费) | 免费 | 低 | ⭐⭐⭐⭐⭐ |
| Vercel/Netlify Serverless | 免费额度 | 中 | ⭐⭐⭐⭐ |
| Supabase (BaaS) | 免费额度 | 低 | ⭐⭐⭐⭐ |
| 自建 Node.js 服务器 | 需要 VPS | 高 | ⭐⭐ |
| 纯 LocalStorage 模拟 | 免费 | 零 | 见下 |

#### 路径 B 替代方案：GitHub Gist 方案（最推荐）

利用 GitHub 的 Gist API 作为共享预设的「数据库」：

```
用户上传预设 →
  → 前端调用 GitHub Gist API 创建/更新 Gist
  → Gist 作为预设的存储载体
  → 排行榜从所有预设 Gist 的 star 数/时间戳排序

用户搜索/浏览 →
  → 从预设 Gist 列表拉取数据
  → 按 star 数排序 → "最热"榜单
  → 按时间排序 → "最新"榜单
```

- ✅ 完全免费，无需后端
- ✅ GitHub 账号即可管理
- ❌ 需要 API Token 配置
- ❌ API 有频率限制（但预设场景足够用）

### 3.5 技术选型对比总表

| 功能 | 方案 | 难度 | 建议 |
|------|------|------|------|
| 自动保存/恢复 | localStorage + beforeunload | ⭐ 极低 | **Phase 1 必做** |
| 命名预设 CRUD | localStorage | ⭐ 低 | **Phase 1 必做** |
| 预设导入/导出 | 已有 JSON 导出 + 增加元数据 | ⭐ 低 | **Phase 1 必做** |
| 预设共享（手动） | 导出 .json 文件分享 | ⭐ 已有 | **Phase 1** |
| 预设共享池 + 排行榜 | GitHub Gist API / 后端 | ⭐⭐⭐ 中 | **Phase 2** |

---

## 四、数据模型设计

### 4.1 预设数据模型

```typescript
interface PresetMeta {
    id: string;              // 唯一标识 (nanoid / crypto.randomUUID)
    name: string;            // 用户给定的名称
    description: string;     // 简短描述
    author?: string;         // 作者名（共享时需要）
    version: string;         // 预设格式版本 (v1)
    createdAt: string;       // ISO 日期
    updatedAt: string;       // ISO 日期
    tags?: string[];         // 可选标签
    source: 'local' | 'shared';  // 来源
}

interface GuitarPreset {
    meta: PresetMeta;
    state: {
        annotations: Annotation[];
        currentTemplate: Template | null;
        tuningConfig: TuningConfig;
        boardTitle: string;
        keySelect: string;
        scaleSelect: string;
        chordFamilySelect: string;
        chordDegreeSelect: string;
        manualText: string;
        manualBg: string;
        manualTextColor: string;
        bpm: number;
        beatPerBar: number;
        rhythmDiv: number;
        accent: boolean;
        timerActive: boolean;
        timerMinutes: number;
        theme: 'light' | 'dark';
    };
}
```

### 4.2 localStorage 键名约定

| 键名 | 类型 | 用途 |
|------|------|------|
| `guitarfb_autosave` | JSON string | 自动保存的最近状态（无 meta） |
| `guitarfb_preset_index` | string[] | 已保存预设的 ID 列表 |
| `guitarfb_preset_{id}` | JSON string | 单条命名预设完整数据 |
| `guitarfb_settings` | JSON string | 非预设用户偏好（语言等） |

---

## 五、架构方案

### 5.1 模块划分

```
scripts/
├── data.js                 # 已有 — 共享数据/国际化
├── main.js                 # 已有 — 主逻辑
├── metronome.js            # 已有 — 节拍器
├── preset.js               # 🆕 预设系统核心模块
│   ├── PresetManager        # 预设 CRUD + 本地存储管理
│   ├── AutoSave             # 自动保存/恢复逻辑
│   └── PresetExporter       # JSON 导出（增加元数据）
└── preset-ui.js            # 🆕 预设 UI 模块（可选独立）
    ├── PresetPanel          # 预设面板渲染
    ├── PresetList           # 预设列表组件
    └── PresetShareDialog    # 共享/导出对话框
```

### 5.2 核心类设计

```javascript
class PresetManager {
    // ——— 本地 CRUD ———
    listPresets()              // → PresetMeta[]  列出所有本地预设
    getPreset(id)              // → GuitarPreset  加载单条预设
    savePreset(name, desc)     // → id            保存当前状态为命名预设
    deletePreset(id)           //                 删除预设
    loadPreset(id)             //                 载入预设到应用

    // ——— 自动保存 ———
    saveAuto()                 // 存最后状态到 localStorage
    restoreAuto()              // 页面加载时恢复自动保存
    hasAutoSave()              // → boolean

    // ——— 导入/导出 ———
    exportPreset(id)           // → Blob          下载单条预设
    importPreset(file)         // → id            从 .json 导入
    exportCurrentAsPreset()    // → Blob          导出当前状态

    // ——— 共享（Phase 2） ———
    uploadPreset(id)           // 上传到共享池
    getHotPresets()            // → SharedPreset[] 获取排行榜
    likePreset(id)             // 点赞
}
```

### 5.3 与现有系统的集成点

| 集成点 | 说明 |
|--------|------|
| `controller.exportData()` | PresetManager 内部调用获取当前状态 |
| `controller.importData(data)` | 载入预设时调用恢复状态 |
| `DOM.exportData` / `DOM.importBtn` | 已有按钮 → 扩展为预设导出（含元数据） |
| `document.addEventListener('DOMContentLoaded')` | 插入自动恢复逻辑 |
| `window.addEventListener('beforeunload')` | 插入自动保存逻辑 |
| `data.js` 国际化 (LANG.zh/en) | 预设 UI 文案需要新增翻译键 |

---

## 六、UI 布局建议

### 6.1 现有布局分析

```
┌────────────────────────────────────────────────┐
│  Title Bar (标题 + 搜索输入)                     │
├────────────────────────────────────────────────┤
│  Tuning Panel (调音设置)                        │
├────────────────────────────────────────────────┤
│  Parameter Row (调性/音阶/和弦/级数)            │
├────────────────────────────────────────────────┤
│  Button Row (生成按钮组)                        │
├────────────────────────────────────────────────┤
│  Annotation Tools (标注工具)                    │
├────────────────────────────────────────────────┤
│  Fretboard Canvas (指板画布 — 核心区域)          │
├────────────────────────────────────────────────┤
│  Metronome Panel (节拍器)                      │
├────────────────────────────────────────────────┤
│  Export Row (导出/导入/清空)                    │
└────────────────────────────────────────────────┘
```

### 6.2 三种可选方案

#### 方案 A：侧边栏（推荐）

右侧可折叠侧边栏，280-320px 宽，默认折叠：

```
┌──────────────────────┬─────────────────────────┐
│                      │                         │
│  预设侧边栏           │    主区域               │
│  ┌──────────────┐    │    (现有内容)            │
│  │ 自动保存指示器  │    │                         │
│  ├──────────────┤    │                         │
│  │ 我的预设       │    │                         │
│  │ ├─ 标准调音     │    │                         │
│  │ ├─ Drop D      │    │                         │
│  │ └─ 查看更多 →  │    │                         │
│  ├──────────────┤    │                         │
│  │ [+ 保存当前]  │    │                         │
│  └──────────────┘    │                         │
└──────────────────────┴─────────────────────────┘
```

- **优点：** 不占用布局，随时呼出，适合展示排行榜
- **缺点：** 小屏手机可能太挤

#### 方案 B：标题栏下拉面板

```
┌────────────────────────────────────────────────┐
│  Title Bar | 预设 ▼ | Theme Toggle              │
│             ┌──────────────┐                    │
│             │ 预设管理器     │                    │
│             │ ...           │                    │
│             └──────────────┘                    │
├────────────────────────────────────────────────┤
│                (剩余区域不变)                    │
```

- **优点：** 实现简单，不改布局
- **缺点：** 容量有限，不适合展示排行榜

#### 方案 C：模态弹窗

```
┌──────────────────────────────────────────────┐
│  🎸 预设管理器                          [×]  │
├──────────────────────────────────────────────┤
│  ┌──────┬──────┬──────┬──────┐               │
│  │ 本地  │ 共享  │ 最热  │ 上传  │  ← 标签页  │
│  └──────┴──────┴──────┴──────┘               │
│                                              │
│  预设列表...                                  │
│                                              │
│  [+ 保存当前]                [导入] [导出]     │
└──────────────────────────────────────────────┘
```

- **优点：** 信息量大，可展示完整管理功能 + 排行榜
- **缺点：** 无法实时看到预设备忘录

### 6.3 推荐组合

```
Phase 1 (本地预设):
  标题栏右上角 + 下拉面板（方案 B 简化版）
  └─ 显示自动保存状态指示器
  └─ 快速保存/加载
  └─ 管理入口 → 模态弹窗（方案 C）

Phase 2 (共享 + 排行榜):
  侧边栏（方案 A）+ 模态弹窗（方案 C）
  └─ 侧边栏：显示本地/热门预设快捷入口
  └─ 模态弹窗：完整管理 + 排行榜 + 上传
```

---

## 七、实现阶段规划

### Phase 1 — 本地预设系统（估算：3-5 天）

| 步骤 | 内容 | 涉及文件 | 难度 |
|------|------|---------|------|
| 1.1 | 创建 `preset.js`，实现 `PresetManager` 类（CRUD + localStorage） | 新建 `scripts/preset.js` | ⭐⭐ |
| 1.2 | 自动保存/恢复逻辑（监听 beforeunload + DOMContentLoaded） | `preset.js` + `main.js` init | ⭐ |
| 1.3 | 命名预设 UI：保存对话框 + 预设列表 | `index.html` + `preset.js` | ⭐⭐ |
| 1.4 | 预设导出（含 meta 的 .json 文件） | `preset.js` + 修改 `exportData` | ⭐ |
| 1.5 | 预设导入（解析 meta + 导入数据） | `preset.js` + 修改导入逻辑 | ⭐ |
| 1.6 | 国际化文案补充 | `data.js` | ⭐ |
| 1.7 | 测试：自动保存/恢复、多预设 CRUD、导入导出 | 手动测试 | ⭐ |

### Phase 2 — 共享预设 + 排行榜（估算：5-10 天）

| 步骤 | 内容 | 难度 |
|------|------|------|
| 2.1 | 调研并选定后端方案（推荐 GitHub Gist API） | ⭐⭐ |
| 2.2 | 预设上传逻辑（携带 meta 提交到共享池） | ⭐⭐⭐ |
| 2.3 | 热门排行榜算法（当前热 = 近期下载量，历史热 = 总下载量） | ⭐⭐ |
| 2.4 | 共享预设列表 UI + 排行榜展示 | ⭐⭐ |
| 2.5 | 点赞/下载计数功能 | ⭐⭐⭐ |
| 2.6 | 防滥用机制（频率限制、重复上传检测） | ⭐⭐⭐ |
| 2.7 | 测试 + 部署 | ⭐⭐ |

### 规模估算

```
Phase 1: ~400-600 行新 JS + ~50 行 HTML 改动
Phase 2: ~600-1000 行新 JS + ~100 行 HTML 改动
总计:   ~1000-1600 行
```

---

## 八、风险评估与注意事项

### 8.1 已知风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| localStorage 被用户清除 | 中 | 高 | 自动保存 + 命名预设双重保障；鼓励导出 .json |
| 无痕模式 localStorage 不可用 | 低 | 中 | 检测 localStorage 可用性，不可用时静默降级 |
| 预设数据版本兼容 | 中 | 中 | 数据模型加 `version` 字段，预留迁移函数 |
| 导入恶意 JSON | 低 | 低 | JSON.parse 包裹 try-catch，校验关键字段存在性 |
| 共享池数据质量问题 | 中 | 中 | 上传前校验格式，支持举报/标记机制 |
| GitHub Gist API 限频 | 低 | 中 | 加本地缓存，减少重复请求 |

### 8.2 设计原则

1. **渐进增强** — 本地预设完全离线可用，共享/排行榜是锦上添花
2. **用户可控** — 自动保存不覆盖用户已命名的预设，用户可随时关闭自动保存
3. **最小惊讶** — 预设 UI 遵循应用已有的设计风格
4. **向后兼容** — 导入功能兼容旧版（无 meta）JSON

### 8.3 待确认问题

1. **预设 UI 位置**：推荐 Phase 1 用下拉面板 + 模态窗口组合
2. **预设命名规则**：是否允许重名？推荐允许，以 ID 区分
3. **共享后端选型**：Phase 2 用 GitHub Gist 还是纯本地？
4. **预设最大数量**：建议上限 20 条
5. **是否引入依赖**：建议零依赖，纯原生 JS

---

## 附录：数据流图

```
用户操作 → controller.exportData()
                    │
                    ▼
           ┌─────────────────┐
           │   PresetManager  │
           └─────────────────┘
              │        │
              ▼        ▼
      localStorage    File Download
      (自动/命名)     (共享/备份)

                    ▲
              │        │
         File Upload   🆕 共享池
         (.json)      (Phase 2)
```

---

*本文档为可行性研究，具体实现细节将在 Phase 1 开发前进一步细化。*
