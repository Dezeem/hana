# Hana · 花间

**A private herbarium for the films, series, books and albums you keep.**

Hana is a self-hosted alternative to keeping a Douban shelf: a quiet, editorial archive
where every work is numbered, classified and annotated by hand. Visitors browse freely;
only you log in to add or edit.

[中文说明](./README.zh-CN.md) · [Importing from Douban](./docs/douban-import.md) · [Using the Douban MCP](./docs/mcp-douban.md)

---

## Why another media tracker

Most trackers look like dashboards. Hana is designed like a printed catalogue — warm paper,
hairline rules, serif type, a three-digit specimen number on every item. The artwork is the
only saturated thing on the page, which is the point.

- **The work is the hero** — asymmetric cover collage on the home page, generous margins,
  metadata treated as scientific labels.
- **Four collections, four inks** — films (vermilion), series (indigo), books (moss),
  albums (amber). The colour only ever appears in hairlines, dots and tags.
- **Retrieval that respects how you remember** — full-text search over titles, creators,
  tags and your own notes, plus faceted filtering that lives in the URL.

## Features

| | |
|---|---|
| **Public archive** | Home collage, library with multi-facet filters, work detail, year timeline, editorial about page |
| **Search** | SQLite FTS5 + substring fallback, ⌘K / Ctrl-K overlay, keyboard navigation |
| **Admin** | Single-password login, create / edit / delete, bulk status & feature toggles, cover upload |
| **Douban import** | Paste a subject URL or numeric id, or search by title; metadata, cover and rating are fetched and filled in |
| **Cover localisation** | Imported artwork is downloaded, resized and stored as WebP — no hotlinking, no broken images |
| **Dark mode** | Follows the system, with a manual toggle and no flash on load |
| **Zero-config storage** | One SQLite file plus an uploads folder, both inside `data/` and both on a Docker volume |

## Quick start

### Docker (recommended)

```bash
git clone https://github.com/<you>/hana.git && cd hana
cp .env.example .env      # then edit ADMIN_PASSWORD and AUTH_SECRET
./deploy.sh               # builds the image and starts the container
```

`./deploy.sh` prints the URL when the health check passes. Other commands:

```bash
./deploy.sh logs     # tail logs
./deploy.sh update   # rebuild and restart
./deploy.sh stop     # stop
./deploy.sh reset    # delete the data volume (asks for confirmation)
```

### Local development

Requires **Node.js ≥ 22.5** (Hana uses the built-in `node:sqlite`, so there is no native
module to compile).

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

The first boot creates `data/hana.db` and seeds fifteen demo works with procedurally
generated cover art, so the site is never empty on a fresh clone.

## Environment

| Variable | Default | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | `hana` | Password for `/admin`. **Set this.** |
| `AUTH_SECRET` | dev fallback | Signs the session cookie. `openssl rand -hex 32` |
| `DATA_DIR` | `./data` | SQLite file + `uploads/` live here. `/app/data` in Docker |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical URL for metadata and sitemap |
| `HANA_SEED` | `1` | Set to `0` to skip seeding the demo archive |
| `DOUBAN_USER_AGENT` | Chrome desktop | Raise the success rate of imports |
| `DOUBAN_COOKIE` | – | Optional; only public pages are ever requested |
| `DOUBAN_PROXY` | – | e.g. `http://127.0.0.1:7890`, useful when the server cannot reach Douban |
| `DOUBAN_TIMEOUT_MS` | `20000` | Per-request timeout |
| `HANA_PORT` | `3000` | Host port published by compose |

## Importing from Douban

Douban has no public API, and subject pages are rate-limited — from a datacenter IP the
movie pages in particular often redirect to `sec.douban.com`. Hana treats a successful
fetch as a bonus:

1. the importer normalises the URL or id and infers the type;
2. it parses `application/ld+json` first, then Open Graph tags, then the `#info` block;
3. on any failure it returns a structured code (`IMPORT_BLOCKED`, `IMPORT_NOT_FOUND`,
   `IMPORT_TIMEOUT`, `IMPORT_PARSE_FAILED`) with a human hint;
4. the admin form **never clears**: the URL is kept and you simply type the rest by hand.

If you get blocked, try a different network, lower the frequency, or set `DOUBAN_COOKIE` /
`DOUBAN_PROXY`. Note the limits: only public metadata is read, there is no crawling, and
requests are throttled and cached for fifteen minutes.

See [`docs/douban-import.md`](./docs/douban-import.md) for the parsing details and
[`docs/mcp-douban.md`](./docs/mcp-douban.md) if you want to drive `astron-douban-mcp`
from your own AI client alongside Hana.

## Project structure

```
hana/
├─ app/
│  ├─ (site)/                 public routes (shared header / footer / mobile nav)
│  │  ├─ page.tsx             home — hero, spotlight, collage wall
│  │  ├─ library/page.tsx     faceted library with grid / list views
│  │  ├─ work/[id]/page.tsx   work detail + related rail
│  │  ├─ timeline/page.tsx    chronology by work year
│  │  └─ about/page.tsx       colophon and collection stats
│  ├─ admin/                  protected area (login, dashboard, CRUD)
│  ├─ actions/                server actions (auth, works, douban import)
│  ├─ api/                    search, health
│  ├─ media/[...path]/        serves uploads from the data volume
│  ├─ globals.css             design tokens, paper grain, motion
│  └─ layout.tsx              fonts, metadata, theme bootstrap
├─ components/                UI primitives (public + admin)
├─ lib/
│  ├─ db/                     schema, queries, mutations, seed
│  ├─ douban/                 fetch / parse / cover / orchestrator
│  ├─ auth/                   jose session + password check
│  └─ search.ts, filters.ts, covers.ts, uploads.ts
├─ scripts/reset-db.mjs
├─ docs/
├─ site.config.ts             name, tagline, collections, about copy
├─ middleware.ts              guards /admin
├─ instrumentation.ts         migrate + seed on boot
├─ Dockerfile · docker-compose.yml · deploy.sh
└─ data/                      runtime (git-ignored, volume-mounted)
```

## Tech notes

- **Next.js 15 App Router** — every public page is a server component querying SQLite
  directly; there is no client-side data layer and no separate API to secure.
- **`node:sqlite`** — the built-in driver, stable since Node 22.5. A native module such as
  `better-sqlite3` was deliberately avoided so `npm install` never needs a C++ toolchain.
  All database access goes through `lib/db/client.ts`.
- **Writes via server actions** — validation with `zod`, auth enforced inside each action,
  not only in middleware.
- **Search** — FTS5 with `unicode61` plus a `LIKE` union, because CJK substrings are not
  tokenised the way you would expect. If FTS5 is missing, search degrades silently.
- **Images** — covers are re-encoded with `sharp` on import; the site serves them from
  `/media/*` so `next/image` optimisation is not required.

## Data & backup

Everything lives in `data/`:

```
data/
├─ hana.db         SQLite database (WAL mode)
└─ uploads/        imported and uploaded covers
```

```bash
docker compose cp hana:/app/data ./backup-$(date +%F)   # back up
npm run db:reset                                        # start over (dev)
```

## Design credits

- Type: Fraunces (Latin display, self-hosted, SIL OFL) with a CJK serif stack
  (Noto Serif SC / Songti SC / SimSun).
- Demo covers are generated procedurally in `lib/covers.ts` — no third-party artwork ships
  with this repository.
- Metadata referenced from Douban is used for personal archival purposes only.

## License

[MIT](./LICENSE)
