# price-scanner

A small [Hono](https://hono.dev) API that scrapes [tgju.org](https://www.tgju.org)
for live **gold, currency, crypto, coin and oil prices** and serves them as clean
JSON — including Toman conversions and a few derived calculations (e.g. the world
gold ounce priced in Toman via the live USD rate).

## Features

- Live quotes for gold (18k/24k/mesghal/world ounce), USD, EUR, Tether, Bitcoin,
  and Iranian coins (Emami, Bahar Azadi).
- Raw price plus automatic **Toman** conversion for IRR-denominated markets.
- Daily change percent and direction (up/down) per market.
- Derived calculations: ounce→Toman, implied per-gram gold, mesghal cross-check.
- In-memory caching (15s TTL) to stay fast and polite to the source.
- Runs locally with Node, or deploys to Vercel Edge out of the box.

## Getting started

```bash
npm install
npm run dev      # start local dev server (tsx watch) on http://localhost:3000
```

Other scripts:

```bash
npm run build    # type-check with tsc (--noEmit)
npm start        # run the server without watch mode
```

## API

| Method & path        | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `GET /`              | Service info and list of available endpoints/markets. |
| `GET /prices`        | All tracked markets (raw + Toman conversion).         |
| `GET /prices/:key`   | A single market by key.                               |
| `GET /calculate`     | Derived calculations (ounce→Toman, per-gram, etc.).   |
| `GET /markets`       | List of tracked markets and their keys.               |
| `GET /health`        | Health check.                                         |

Pass `?fresh=1` to `/prices` or `/calculate` to bypass the cache and force a
fresh scrape.

### Example

```bash
curl http://localhost:3000/prices/gold_18k
```

```json
{
  "scrapedAt": "2026-07-02T08:00:00.000Z",
  "source": "https://www.tgju.org/",
  "quote": {
    "key": "gold_18k",
    "label": "Gold 18k (gram)",
    "labelFa": "طلای ۱۸ عیار",
    "category": "gold",
    "unit": "IRR",
    "price": 174514000,
    "priceToman": 17451400,
    "changePercent": 1.13,
    "direction": "up"
  }
}
```

## Tracked markets

| Key            | Market                | Unit |
| -------------- | --------------------- | ---- |
| `gold_18k`     | Gold 18k (gram)       | IRR  |
| `gold_24k`     | Gold 24k (gram)       | IRR  |
| `gold_mesghal` | Gold Mesghal          | IRR  |
| `gold_ounce`   | Gold Ounce (world)    | USD  |
| `usd`          | US Dollar             | IRR  |
| `eur`          | Euro                  | IRR  |
| `tether`       | Tether (USDT)         | IRR  |
| `bitcoin`      | Bitcoin               | USD  |
| `coin_emami`   | Emami Coin            | IRR  |
| `coin_bahar`   | Bahar Azadi Coin      | IRR  |

## Project structure

```
api/index.ts     Vercel edge entry point (Hono handler)
src/server.ts    Local Node dev server
src/app.ts       Hono routes + caching
src/scraper.ts   Fetches and parses the tgju.org homepage
src/markets.ts   Definitions of the markets we track
src/calc.ts      Derived calculations
```

## Deployment

The project is Vercel-ready. `vercel.json` rewrites all requests to `/api`,
where `api/index.ts` runs the Hono app on the Edge runtime. Just connect the
repo to Vercel and deploy.

## Notes

Prices are scraped from a public third-party site and provided as-is with no
guarantee of accuracy or availability. Use responsibly.
