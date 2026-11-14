# Using `astron-douban-mcp` alongside Hana

[`astron-douban-mcp`](https://pypi.org/project/astron-douban-mcp/) is a Model Context
Protocol server published by the iFlytek Astron team (Apache-2.0). It exposes Douban's
public pages to an AI client.

**Hana does not depend on it.** Hana is a Next.js app; the MCP server speaks stdio to AI
clients, so the two cannot call each other at runtime. The MCP is useful *next to* Hana:
you can ask your assistant to collect or check metadata, then paste the result into the
admin form — or use it to plan a batch of imports before doing them one by one.

## What the package is

| | |
|---|---|
| Package | `astron-douban-mcp` (v0.1.4) |
| Requires | Python ≥ 3.10 |
| Credentials | none |
| Transport | stdio |
| Tools | `get_hot_list`, `get_feed_list`, `search_content`, `get_content_detail`, `get_author_profile`, `get_author_content_list` |

It reads Douban's guest-visible endpoints, which means it is subject to exactly the same
rate limiting described in [`douban-import.md`](./douban-import.md).

## Install and configure

```bash
# recommended: run without installing globally
uvx --from astron-douban-mcp astron-douban-mcp

# or
pip install astron-douban-mcp
douban-mcp
```

Client configuration (Claude Desktop, CodeBuddy, Cursor, …):

```json
{
  "mcpServers": {
    "douban-mcp": {
      "command": "uvx",
      "args": ["--from", "astron-douban-mcp", "astron-douban-mcp"],
      "env": {
        "DOUBAN_MCP_TIMEOUT_SECONDS": "30"
      }
    }
  }
}
```

`DOUBAN_MCP_USER_AGENT` is also supported if you need to look like a browser.

## A workflow that actually helps

1. Ask the assistant to search a title: *"use douban-mcp to find the film 一一 and give me
   the subject id, year and directors"*.
2. Copy the numeric id into Hana's import box (`一一` → `1292277`), pick 电影, press
   **抓取并填表**.
3. If Hana's own fetch is blocked but the MCP succeeded, use the MCP output to fill the
   title / creator / year fields by hand — Hana's form is the same either way.

The MCP is therefore a **research assistant**, not a data pipeline. Do not wire it into a
scheduled job: it hits the same public endpoints Hana does, and doubling the traffic only
gets both of you blocked faster.

## Status of this document

The package details above were taken from the PyPI project page. The six tools were **not
executed while building this repository**: the build environment had Python 3.8 (below the
package's 3.10 floor) and could not reach PyPI or the uv installer. Nothing in Hana relies
on the result — the importer in `lib/douban/` was written and verified independently.

If you try it, expect the same failure modes as the built-in importer, and keep the request
volume low.
