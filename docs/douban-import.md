# Importing from Douban

Hana reads **public** Douban pages to save you from typing titles, covers and casts by hand.
There is no official API involved, so the importer is built to fail gracefully.

## What is requested

| Purpose | Request |
|---|---|
| Subject page | `https://{movie\|book\|music}.douban.com/subject/{id}/` |
| Title search | `https://{movie\|book\|music}.douban.com/j/subject_suggest?q={query}` |

Nothing else. No login, no private endpoints, no crawling of user lists. Requests are
serialised with a 700 ms minimum gap and cached in memory for 15 minutes.

## Normalisation

`normalizeInput()` accepts three shapes:

```
https://movie.douban.com/subject/1292052/   → type from host, id 1292052
https://m.douban.com/movie/subject/1292052  → falls back to the selected type
1292052                                     → type from the form, id 1292052
```

When the URL host is ambiguous (`m.douban.com`, `www.douban.com`) the type chosen in the
admin form wins. This is why the form asks for the type before importing.

## Parsing order

1. **`application/ld+json`** — Douban emits schema.org data on book pages at least:
   `name`, `author`, `isbn`, `url`. Most reliable, cheapest.
2. **Open Graph** — `og:title`, `og:image`, `og:description` exist on every subject page and
   keep the importer alive when the JSON-LD block is missing.
3. **`#info` block** — the definition list under the poster. It is split on `<br>`, each
   segment is stripped to `key: value`, and the keys are mapped per type:

   | Type | Keys used |
   |---|---|
   | film / series | 导演, 主演, 片长, 制片国家/地区, 语言, 上映日期, 又名, 集数 |
   | book | 作者, 原作名, 出版社, 出版时间, ISBN, 页数, 语言 |
   | album | 表演者, 专辑类型, 介质, 发行时间, 出版者 |
4. **Rating** — `rating_nums` in the DOM, or `aggregateRating.ratingValue` from JSON-LD.
5. **Summary** — `div.intro`, then `[property="v:summary"]`.

Field mapping lives in `lib/douban/parse.ts`; the orchestration and logging live in
`lib/douban/index.ts`.

## Failure codes

| Code | Meaning | What the UI does |
|---|---|---|
| `IMPORT_INVALID` | Not a Douban URL or id | Asks for a URL, offers a title search |
| `IMPORT_BLOCKED` | 3xx redirect (usually `sec.douban.com`) or 403 | Shows the hint, keeps the URL |
| `IMPORT_NOT_FOUND` | 404 | Suggests searching by title |
| `IMPORT_TIMEOUT` | Aborted after `DOUBAN_TIMEOUT_MS` | Suggests retrying later |
| `IMPORT_NETWORK` | DNS / TLS / proxy error | Suggests checking the network |
| `IMPORT_PARSE_FAILED` | Page fetched but no title found | Suggests manual entry |

After a failure the panel runs a title search and lists candidates — clicking one retries
with that subject URL.

## Raising the success rate

```bash
# .env
DOUBAN_USER_AGENT=Mozilla/5.0 ...      # a realistic desktop UA
DOUBAN_COOKIE=bid=...; dbcl2=...       # browser cookies, public pages only
DOUBAN_PROXY=http://127.0.0.1:7890     # residential egress usually works best
DOUBAN_TIMEOUT_MS=15000
```

Observations from real requests:

- `book.douban.com` and `music.douban.com` subject pages answer `200` from most IPs.
- `movie.douban.com` subject pages frequently `302` to `sec.douban.com` from datacenter IPs.
- `www.douban.com/j/search` is usually `Access denied`; the per-site `subject_suggest`
  endpoint is more tolerant (books and music work, films often return an empty array).

None of this is your fault, and none of it blocks the workflow: Hana is a cataloguing tool,
not a scraper.

## Covers

`localizeCover()` downloads the image, resizes it to at most 1000×1500, converts to WebP and
stores it in `DATA_DIR/uploads/import-<hash>.webp`. The remote URL is kept in
`cover_remote` as a runtime fallback, so a failed download still shows something.

## Etiquette

- Metadata is fetched only when **you** press the import button.
- One request per subject; the same subject is not re-fetched for 15 minutes.
- Do not lower `MIN_INTERVAL` in `lib/douban/fetch.ts` — it is there to keep the service
  usable for everyone, and it is what keeps your IP unblocked.
