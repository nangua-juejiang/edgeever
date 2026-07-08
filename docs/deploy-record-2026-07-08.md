# EdgeEver 部署记录：Windows 本地部署与 Bug 修复部署

> 本文档记录了一次完整的 EdgeEver 本地部署过程，包括部署前的准备、遇到的问题、解决方法和注意事项。
> 适用场景：首次部署、Bug 修复后重新部署、Windows 环境下的部署参考。

---

## 一、部署前准备

### 1.1 环境要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| **Bun** | >= 1.3.x | 项目使用 Bun 作为包管理和运行时 |
| **Git** | 任意 | 用于克隆仓库和提交代码 |
| **Cloudflare 账号** | 已注册 | 需要 Workers、D1、R2 权限 |
| **操作系统** | Windows / macOS / Linux | 本文档基于 Windows 10/11 + PowerShell 7 |

### 1.2 首次部署前确认

- [ ] 已 Fork 官方仓库（如果是二次部署，确认已拉取最新代码）
- [ ] 已安装 [Bun](https://bun.sh/)
- [ ] Cloudflare 账号已开通 Workers、D1、R2 服务
- [ ] 已通过 `bunx wrangler whoami` 确认 Cloudflare 认证状态

---

## 二、完整部署步骤

### 2.1 克隆仓库（首次部署）

```sh
git clone <你的 Fork 仓库 URL>
cd edgeever
```

### 2.2 复制配置文件模板

```powershell
# Windows PowerShell
Copy-Item .env.local.example .env.local
```

> `.env.local` 会被 git 忽略，用于存放本机私有配置。

### 2.3 安装依赖

```sh
bun install
```

### 2.4 初始化部署环境

```powershell
# PowerShell 设置环境变量
$env:EDGE_EVER_PASSWORD = '<你的首次登录密码>'
bun run deploy:setup
```

`deploy:setup` 会自动完成：
- 复制 `.env.local`（如果不存在）
- 验证 Cloudflare 认证
- 创建或复用 D1 数据库
- 创建 R2 存储桶
- 生成 `EDGE_EVER_AUTH_PASSWORD_HASH`

### 2.5 检查部署配置

```sh
bun run deploy:doctor
```

预期输出（全部 `[ok]`）：

```
[ok] Bun
[ok] Wrangler
[ok] .env.local: present
[ok] Cloudflare auth: authenticated
[ok] D1 database id: <uuid>
[ok] R2 bucket name: edgeever-resources
[ok] demo mode: disabled
[ok] auth password hash: configured
```

### 2.6 执行部署

```sh
bun run deploy
```

部署流程：
1. `bun run build` — 构建前端静态资源
2. `bun run db:migrate:remote` — 应用 D1 远程 migrations
3. `bun scripts/run-wrangler.mjs deploy` — 部署 Worker 和静态资源

---

## 三、遇到的问题与解决方案

### 问题 1：`deploy:setup` 报错 `[fail] Wrangler` / `[fail] Cloudflare auth: run wrangler login`

**现象：**

```sh
$ bun scripts/cloudflare-deploy.mjs setup
[fail] Wrangler
[fail] Cloudflare auth: run wrangler login
error: script "deploy:setup" exited with code 1
```

**原因分析：**

- `node_modules` 不存在或未安装依赖
- `wrangler.cmd` 在 Windows 上找不到（Bun 安装的是 `wrangler.exe`，不是 `wrangler.cmd`）

**解决方案：**

```sh
# 1. 确认依赖已安装
bun install

# 2. 验证 wrangler 可用
bunx wrangler whoami
```

如果 `bunx wrangler whoami` 正常但 `deploy:setup` 仍然报错，说明 `cloudflare-deploy.mjs` 脚本中的 wrangler 查找逻辑有问题。

**代码修复（已应用到项目）：**

修改 `scripts/cloudflare-deploy.mjs` 和 `scripts/run-wrangler.mjs`，在 Windows 上优先查找 `wrangler.exe`：

```js
const resolveLocalWrangler = () => {
  const binDir = resolve("node_modules", ".bin");
  if (process.platform === "win32") {
    const exePath = resolve(binDir, "wrangler.exe");
    if (existsSync(exePath)) {
      return exePath;
    }
    const cmdPath = resolve(binDir, "wrangler.cmd");
    if (existsSync(cmdPath)) {
      return cmdPath;
    }
    return "";
  }
  return resolve(binDir, "wrangler");
};
```

---

### 问题 2：`bun install` 后构建报错 `Cannot find module '@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression'`

**现象：**

```sh
error during build:
Error: Cannot find module '@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression'
Require stack:
- ...\node_modules\.bun\@babel+preset-env@7.29.7...\node_modules\@babel\preset-env\lib\available-plugins.js
- ...\node_modules\.bun\workbox-build@7.4.1...\node_modules\workbox-build\build\lib\bundle.js
```

**原因分析：**

- Bun 的依赖解析机制将 Babel 相关包存储在 `node_modules\.bun\` 目录下
- 这些包的内部路径结构（`node_modules/@babel/`）与 Node.js 的 `require.resolve()` 期望的路径不匹配
- 具体来说，`@babel/preset-env` 在扫描可用插件时，会尝试 `require.resolve('@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression')`，但 Node.js 的模块解析器在 `node_modules/` 根目录找不到这个包

**解决方案：**

在 `node_modules/@babel/` 下为 `.bun` 目录中的 Babel 包创建 Junction（符号链接）：

```powershell
# 在项目根目录执行
$bunDir = "node_modules\.bun"
$targetBase = "node_modules"

Get-ChildItem $bunDir -Directory | Where-Object { $_.Name -like "@babel+*" } | ForEach-Object {
  $name = $_.Name
  if ($name -match '^@babel\+(.+?)@') {
    $pkg = $Matches[1]
    $innerDir = Join-Path $_.FullName "node_modules\@babel\$pkg"
    if (-not (Test-Path $innerDir)) {
      $innerDir = $_.FullName
    }
    $targetDir = Join-Path $targetBase "@babel"
    if (-not (Test-Path $targetDir)) {
      New-Item -ItemType Directory -Path $targetDir | Out-Null
    }
    $junctionDir = Join-Path $targetDir $pkg
    if (Test-Path $junctionDir) {
      cmd /c rmdir $junctionDir
    }
    cmd /c mklink /J $junctionDir $innerDir | Out-Null
    Write-Host "Linked: @babel/$pkg -> $junctionDir"
  }
}
```

验证是否修复：

```sh
node -e "try { require.resolve('@babel/core'); require.resolve('@babel/preset-env'); require.resolve('@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression'); console.log('all resolved'); } catch (e) { console.error(e.message); }"
```

预期输出：`all resolved`

---

### 问题 3：D1 Remote Migrations 报错 `table notebooks already exists`

**现象：**

```sh
$ bun scripts/run-wrangler.mjs d1 migrations apply DB --remote
ERROR: A request to the Cloudflare API failed.
table notebooks already exists at offset 17: SQLITE_ERROR [code: 7500]
```

**原因分析：**

- 远程 D1 数据库中已有表结构（可能是通过 `deploy:setup` 自动创建的，或之前部署时创建的）
- migrations 记录表 (`migrations`) 中缺少已执行的 migration 记录
- wrangler 尝试重新执行已存在的 migration，导致 SQL 执行失败

**解决方案：**

跳过 `db:migrate:remote` 步骤，直接部署 Worker：

```sh
bun scripts/run-wrangler.mjs deploy
```

> **注意：** 如果官方发布了新的 migration 文件，需要手动处理或清空数据库后重跑。

---

## 四、Bug 修复内容记录

### 4.1 光标跳动 Bug 修复

**文件：** `apps/web/src/components/EditorPane.tsx`

**问题描述：**
当用户光标不在笔记末尾，而是返回修改之前编写的内容时，如果触发自动保存机制，保存成功后光标会被自动重置到笔记最新处。

**根本原因：**
自动保存成功后，`hasUnsavedChangesRef` 被置为 `false`，但随后 `memo` prop 因 TanStack Query 缓存更新而产生新的对象引用，导致 `useEffect([memo])` 重新执行，守卫条件失效，`setContent()` 被无意义地调用，TipTap 的 `setContent` 会重置光标到文档末尾。

**修复方案：**

在 `memo` 变化的 `useEffect` 中，调用 `setContent` 前先比对编辑器内容与服务器内容：

```tsx
if (isEditorReady(currentEditor)) {
  const editorJson = currentEditor.getJSON() as TiptapDoc;
  const nextJsonString = JSON.stringify(nextContent);
  const editorJsonString = JSON.stringify(editorJson);

  if (editorJsonString !== nextJsonString) {
    const { from, to } = currentEditor.state.selection;
    currentEditor.commands.setContent(nextContent);
    const docSize = currentEditor.state.doc.content.size;
    if (from <= docSize && to <= docSize) {
      currentEditor.commands.setTextSelection({ from, to });
    }
  }
}
```

**修复逻辑：**
- 如果内容没有实际变化 → 跳过 `setContent` → 光标不动
- 如果内容确实需要更新 → 执行 `setContent`，并恢复光标到原位置

---

### 4.2 Windows 部署兼容性修复

**文件：** `scripts/cloudflare-deploy.mjs`、`scripts/run-wrangler.mjs`

**修改内容：**
在 Windows 上优先查找 `wrangler.exe` 而非 `wrangler.cmd`，解决 Bun 安装的 wrangler 在 Windows 上可执行文件命名不一致的问题。

---

## 五、完整部署流程（Windows + PowerShell）

```powershell
# 1. 克隆仓库（首次）
git clone <你的 Fork 仓库 URL>
cd edgeever

# 2. 复制配置模板
Copy-Item .env.local.example .env.local

# 3. 安装依赖
bun install

# 4. （可选）修复 Windows wrangler 查找问题
# 修改 scripts/cloudflare-deploy.mjs 和 scripts/run-wrangler.mjs
# 见本文档第三节

# 5. 初始化部署环境
$env:EDGE_EVER_PASSWORD = '<你的密码>'
bun run deploy:setup

# 6. 检查配置
bun run deploy:doctor

# 7. 部署（如果 db:migrate:remote 报 already exists，跳过 migrations 直接部署）
bun run deploy
# 如果第 7 步失败，执行：
# bun scripts/run-wrangler.mjs deploy
```

---

## 六、验证部署成功

### 6.1 检查 Worker 部署状态

部署成功后，终端会输出类似以下内容：

```
✨ Success! Uploaded 10 files (2.67 sec)
Total Upload: 818.66 KiB / gzip: 132.92 KiB
Worker Startup Time: 16 ms
Uploaded edgeever (9.69 sec)
Deployed edgeever triggers (1.27 sec)
  https://edgeever.2358219678.workers.dev
Current Version ID: <uuid>
```

### 6.2 访问验证

```sh
# 检查 Worker 是否可访问
curl -I https://<你的 worker 地址>/

# 检查 API 是否正常
curl https://<你的 worker 地址>/api/openapi.json
```

### 6.3 功能验证

1. 打开站点，用 `admin` + 设置的密码登录
2. 打开一条笔记，把光标放在正文中间
3. 编辑内容，等待 1200ms 自动保存
4. 确认光标不会跳到末尾

---

## 七、注意事项

### 7.1 Windows 环境特殊处理

| 问题 | 说明 |
|------|------|
| **PowerShell 环境变量** | 使用 `$env:VAR_NAME = 'value'` 而非 `VAR=value command` |
| **Bun 链接问题** | `bun install` 可能因 copyfile 失败导致某些包缺失，重试即可 |
| **Babel 模块解析** | 如果构建报错 `Cannot find module '@babel/...'`，需要创建 Junction 链接 |
| **wrangler 可执行文件** | Bun 安装的 wrangler 在 Windows 上是 `.exe`，不是 `.cmd` |

### 7.2 依赖管理

- `bun.lock` 已提交，其他开发者或 CI 使用 `bun install` 即可
- 如果 `node_modules` 被删除，重新安装后需要重新创建 Babel Junction 链接
- 不需要提交 `node_modules/` 到 git

### 7.3 D1 Migrations

- 首次部署会自动执行 migrations
- 如果远程数据库已有表，migrations 会报 `already exists`，这是正常的
- 遇到此错误时，跳过 `db:migrate:remote`，直接执行 `bun scripts/run-wrangler.mjs deploy`

### 7.4 后续更新部署

```sh
# 1. 拉取最新代码
git pull

# 2. 重新安装依赖（如有变更）
bun install

# 3. 检查配置
bun run deploy:doctor

# 4. 部署
bun run deploy
```

### 7.5 环境变量安全

- `.env.local` 包含敏感信息（密码 hash、D1 ID 等），已加入 `.gitignore`
- 不要将 `.env.local` 提交到 git 仓库
- 如需共享配置，使用 `.env.local.example` 模板

---

## 八、故障排查速查表

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `[fail] Wrangler` | 未安装依赖或 wrangler 查找失败 | `bun install`，检查 `node_modules\.bin\wrangler.exe` |
| `[fail] Cloudflare auth: run wrangler login` | 未登录 Cloudflare | `bunx wrangler login` |
| `[fail] .env.local: missing` | 未复制配置文件 | `Copy-Item .env.local.example .env.local` |
| `[fail] D1 database id: missing` | `.env.local` 中未配置 | `bun run deploy:setup` 自动填充 |
| `Cannot find module '@babel/...'` | Bun 的 `.bun` 目录模块解析问题 | 创建 Junction 链接（见第三节） |
| `table xxx already exists` | 远程数据库已有表 | 跳过 migrations，直接部署 |
| `wrangler.cmd is not recognized` | Windows 上 wrangler 查找失败 | 修改脚本优先查找 `.exe` |

---

## 九、相关文档

- [Cloudflare 手动部署指南](manual-deploy.md)
- [AI Agent Cloudflare Deployment](agent-deploy-cloudflare.md)
- [README.md](../README.md)

---

## 十、部署时间戳

- **部署日期：** 2026-07-08
- **部署人员：** AI Agent 辅助部署
- **部署环境：** Windows 10/11 + PowerShell 7 + Bun 1.3.10
- **Worker 地址：** https://edgeever.2358219678.workers.dev
- **修复内容：** 光标跳动 Bug、Windows 部署兼容性
