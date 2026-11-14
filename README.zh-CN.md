# Hana · 花间

**把看过的、读过的、听过的，一件件压进标本册。**

Hana 是一个自托管的个人作品档案站：电影、剧集、书籍与音乐，逐件编号、分类、注记。
访客无需登录即可浏览与检索全部内容，只有站长需要密码进入后台录入。

[English](./README.md) · [豆瓣导入说明](./docs/douban-import.md) · [搭配豆瓣 MCP 使用](./docs/mcp-douban.md)

---

## 为什么还要做一个「豆瓣收藏」

大多数追踪工具长得像仪表盘，Hana 想做成一册印刷目录：暖白纸感、发丝细线、衬线排印，
每件作品带一个三位编号。页面上唯一高饱和的东西是作品本身——这是刻意的。

- **作品是唯一的主角**：首页错落拼贴、极大留白，元数据被当作标本标签来排。
- **四类收藏，四种墨色**：电影朱砂、剧集靛青、书籍苔绿、音乐琥珀。颜色只出现在细线、
  圆点和标签上，从不铺满整屏。
- **按你记忆的方式检索**：标题、创作者、标签、自己写的短评都能被全文检索，
  筛选条件写在地址栏里，可以直接分享或收藏。

## 功能

| | |
|---|---|
| **公开站点** | 首页拼贴墙、多维筛选藏品库、作品详情、年份年表、编辑式关于页 |
| **检索** | SQLite FTS5 + 子串兜底，⌘K / Ctrl-K 或 `/` 唤起，支持键盘上下选择，另有 `/search` 结果全量页 |
| **后台** | 单密码登录、增删改、批量改状态与「设为精选」、手动上传封面 |
| **豆瓣导入** | 粘贴条目链接/编号，或直接按标题搜索候选；自动填充元数据、封面与豆瓣评分 |
| **封面本地化** | 抓到的图会下载、压缩成 WebP 存进数据目录，规避防盗链导致的图裂 |
| **深色模式** | 跟随系统，也可以手动切换，刷新不闪白 |
| **零配置文件存储** | 一个 SQLite 文件加一个 uploads 目录，都在 `data/` 里，也都挂在 Docker 卷上 |

## 快速开始

### Docker（推荐）

```bash
git clone https://github.com/<you>/hana.git && cd hana
cp .env.example .env      # 修改 ADMIN_PASSWORD 与 AUTH_SECRET
./deploy.sh               # 构建镜像并启动
```

健康检查通过后脚本会打印访问地址。其他命令：

```bash
./deploy.sh logs     # 查看日志
./deploy.sh update   # 重新构建并重启
./deploy.sh stop     # 停止
./deploy.sh reset    # 删除数据卷（会二次确认）
```

### 本地开发

需要 **Node.js ≥ 22.5**（使用内置的 `node:sqlite`，不需要编译任何原生模块）。

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

首次启动会自动创建 `data/hana.db` 并写入 15 件示例藏品（封面是程序生成的），
克隆下来不会是空站。

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `ADMIN_PASSWORD` | `hana` | 后台密码，**务必修改** |
| `AUTH_SECRET` | 开发用兜底值 | 会话签名密钥，`openssl rand -hex 32` 生成。**生产环境必须设置**，否则拒绝签发会话 |
| `DATA_DIR` | `./data` | 数据库与 `uploads/` 所在目录；Docker 内为 `/app/data` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | 生成 metadata 与 sitemap 用的站点地址 |
| `HANA_SEED` | `1` | 设为 `0` 可跳过示例数据 |
| `DOUBAN_USER_AGENT` | Chrome 桌面版 | 提升导入成功率 |
| `DOUBAN_COOKIE` | 空 | 可选，只用于请求公开页面 |
| `DOUBAN_PROXY` | 空 | 例如 `http://127.0.0.1:7890`，服务器直连豆瓣受限时使用 |
| `DOUBAN_TIMEOUT_MS` | `20000` | 单次请求超时 |
| `HANA_PORT` | `3000` | compose 映射到宿主机的端口 |

## 关于豆瓣导入

豆瓣没有公开 API，详情页还有风控——在机房 IP 上，电影条目经常 302 到
`sec.douban.com`。所以在 Hana 里，「抓取成功」被视为加分项而非常态：

1. 先归一化链接或编号，推断类型；
2. 解析顺序为 `application/ld+json` → Open Graph 标签 → `#info` 字段块；
3. 任何一步失败都返回结构化错误码（`IMPORT_BLOCKED` / `IMPORT_NOT_FOUND` /
   `IMPORT_TIMEOUT` / `IMPORT_PARSE_FAILED`）并附人话提示；
4. **表单永远不会被清空**：链接会保留，你只要把剩下的字段手写上去即可。

被拦时可以换网络、降低频率，或配置 `DOUBAN_COOKIE` / `DOUBAN_PROXY`。边界也很清楚：
只读取公开元数据，不做爬虫，内置请求节流与 15 分钟缓存。

解析细节见 [`docs/douban-import.md`](./docs/douban-import.md)；如果你想在自己的 AI 客户端里
配合 `astron-douban-mcp` 使用，见 [`docs/mcp-douban.md`](./docs/mcp-douban.md)。

## 常见问题

**`npm run dev` 报 `SyntaxError: Unexpected token ?`（来自 `commander` 或 `next/dist/bin/next`）**

Node 版本太旧（例如系统自带的 v10）。Hana 需要 **Node ≥ 22.5**：

```bash
node -v                                  # 先确认版本
nvm install 24 && nvm use 24             # 或换用任意 22.5+ 的 node
npm run dev
```

`npm run dev/build/start` 现在会先跑一次版本检查，不满足时直接给出中文提示，而不是抛那段看不懂的 SyntaxError。若 `npm install` 时报 `EBADENGINE`，原因相同。

**`SQLITE_CANTOPEN` 或数据没保存**

检查 `DATA_DIR` 是否可写（Docker 内为 `/app/data`，需要挂载卷）。

**豆瓣导入一直 `IMPORT_BLOCKED`**

见 [`docs/douban-import.md`](./docs/douban-import.md)，通常是机房 IP 被风控，配置 `DOUBAN_PROXY` 或改用住宅网络。

## 目录结构

```
hana/
├─ app/
│  ├─ (site)/                 公开路由（共用导航 / 页脚 / 移动端底栏）
│  │  ├─ page.tsx             首页：主视觉、精选、拼贴墙
│  │  ├─ library/page.tsx     藏品库：多维筛选 + 网格/列表
│  │  ├─ search/page.tsx      搜索结果全量页，无 JavaScript 也可用
│  │  ├─ work/[id]/page.tsx   作品详情 + 相关推荐轨道
│  │  ├─ timeline/page.tsx    按作品年份编年的年表
│  │  └─ about/page.tsx       自述、统计、版记
│  ├─ admin/                  受保护区域（登录、概览、增删改）
│  ├─ actions/                Server Actions（登录、写入、导入）
│  ├─ api/                    search / health
│  ├─ media/[...path]/        从数据卷读取封面
│  ├─ globals.css             设计令牌、纸纹、动效
│  └─ layout.tsx              字体、metadata、主题初始化
├─ components/                前台与后台组件
├─ lib/
│  ├─ db/                     schema、查询、写入、种子数据
│  ├─ douban/                 抓取 / 解析 / 封面 / 编排
│  ├─ auth/                   jose 会话与密码校验
│  └─ search.ts · filters.ts · covers.ts · uploads.ts
├─ scripts/reset-db.mjs
├─ docs/
├─ site.config.ts             站名、标语、收藏类型、关于文案
├─ middleware.ts              保护 /admin
├─ instrumentation.ts         启动时建表与灌种子数据
├─ Dockerfile · docker-compose.yml · deploy.sh
└─ data/                      运行时数据（git 忽略、挂载卷）
```

## 技术说明

- **Next.js 15 App Router**：公开页面全是 Server Component，直接查 SQLite，没有客户端
  数据层，也没有需要额外加固的公开写接口。
- **`node:sqlite`**：Node 22.5 起内置的驱动，稳定可用的同时避免了 `better-sqlite3`
  这类需要 C++ 工具链的原生模块。所有数据库访问都收敛在 `lib/db/client.ts`。
- **写入走 Server Actions**：用 `zod` 校验，鉴权在每个 action 内部再做一次，不只依赖
  中间件。
- **检索**：FTS5（unicode61）与 `LIKE` 结果取并集——因为中文子串并不是按直觉分词的。
  FTS5 不可用时会静默降级，不报错。
- **图片**：导入时用 `sharp` 重新编码，站点通过 `/media/*` 直出，不依赖 `next/image`
  的运行时优化。

## 数据与备份

```bash
docker compose cp hana:/app/data ./backup-$(date +%F)   # 备份
npm run db:reset                                        # 重置（开发用）
```

数据目录里只有两样东西：`hana.db`（WAL 模式）与 `uploads/`（导入和上传的封面）。

## 设计与素材

- 字体：Fraunces（拉丁展示体，自托管，SIL OFL）+ 中文衬线栈
  （Noto Serif SC / Songti SC / SimSun）。
- 示例封面由 `lib/covers.ts` 程序化生成，仓库不包含任何第三方美术资源。
- 豆瓣元数据仅作个人归档引用，版权归原权利人所有。

## 许可证

[MIT](./LICENSE)
