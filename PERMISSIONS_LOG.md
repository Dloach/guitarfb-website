# GuitarFB — 权限需求记录

> 用途：记录开发过程中需要的所有工具/权限，在每个版本开发前预读并批量申请，减少中断。
> 更新规则：每次遇到新的权限需求（被拒绝/被拦截），立即追加到对应版本节。

---

## 通用权限（所有版本都可能需要）

| 权限/工具 | 用途 | 拦截情况 |
|-----------|------|---------|
| `edit_file` / `write_file` | 修改/创建项目文件 | 编辑闸门控制（auto 模式直接通过） |
| `run_command` — 内联 Python (`python -c "..."`) | 快速文件操作、验证 | ✅ 通常放行 |
| `run_command` — 文件复制 (`copy`, `xcopy`) | 跨目录复制文件 | ⚠️ 偶发拦截 |
| `run_command` — Git 操作 (`git -C ...`) | 提交、推送、标签 | ⚠️ 网络操作可能拦截 |
| `run_command` — 目录创建 (`mkdir`) | 创建新目录 | ⚠️ 可能拦截 |
| `run_background` | 启动 HTTP 服务器 | ✅ 放行 |
| `run_command` — Python 脚本文件 (`python script.py`) | 执行预写脚本 | ❌ 拦截 |
| `run_command` — heredoc (`python << EOF`) | 多行脚本执行 | ❌ 拦截 |

---

## v6 — 初始提交 + 设计优化

| 申请内容 | 结果 |
|---------|------|
| `git init` | ✅ |
| `write_file` 创建 .gitignore | ✅ |
| `commit` / `push` | ❌ 网络拦截 → 重试后通过 |
| `git pull --allow-unrelated-histories` | ❌ 网络超时 |
| `git push --force` | ⚠️ 需确认覆盖 |
| 修改 CSS/JS 文件 | ✅ auto 模式通过 |
| `run_background` HTTP 服务器 | ✅ |
| `curl` 测试服务器 | ⚠️ 有时超时 |
| `ipconfig` 查局域网 IP | ✅ |

---

## v7 Phase 1 — 本地预设系统

### 预申请权限

> 开始开发前一次性申请以下权限，避免中途打断：

| 序号 | 操作 | 原因 |
|------|------|------|
| 1 | `copy "G:\tmp\test\guitarfb-fixed-v6\_*.md" "G:\tmp\test\guitarfb-fixed-v7\"` | 复制文件到 v7 目录（sandbox 外） |
| 2 | `mkdir "G:\tmp\test\guitarfb-fixed-v7"` | 创建 v7 开发目录 |
| 3 | `python -c` (多段内联脚本) | 在 sandbox 外写入/追加文件内容 |
| 4 | `run_background python -m http.server 8080 --directory "G:\tmp\test\guitarfb-fixed-v6"` | 启动测试服务器 |

### 已记录权限需求

| 日期 | 操作 | 结果 | 备注 |
|------|------|------|------|
| 2026-05-11 | `python script.py` | ❌ 拦截 | Python 脚本文件执行被命令闸门拦住 |
| 2026-05-11 | `python << HEREDOC` | ❌ 拦截 | 多行 heredoc 被命令闸门拦住 |
| 2026-05-11 | `copy` 文件到 v7 | ✅ 通过 | 简单文件复制放行 |

---

## 模板 — 新版本预留

```
## vN — [版本名称]
### 预申请权限
| 序号 | 操作 | 原因 |
|------|------|------|
### 已记录权限需求
| 日期 | 操作 | 结果 | 备注 |
|------|------|------|------|
```
