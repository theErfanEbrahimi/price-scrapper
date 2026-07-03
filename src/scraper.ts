import { MARKETS, type MarketDef } from './markets.js'

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const TGJU_URL = 'https://www.tgju.org/'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

export interface Quote {
  key: string
  label: string
  labelFa: string
  category: MarketDef['category']
  unit: MarketDef['unit']
  /** Raw price in the market's native unit. */
  price: number
  /** Same price converted to Toman (only for IRR markets, else null). */
  priceToman: number | null
  /** Daily change percent (positive = up), or null if not found. */
  changePercent: number | null
  direction: 'up' | 'down' | 'none'
}

/**
 * Extract one market's data from the tgju homepage HTML.
 *
 * Each market is a `<tr ... data-market-row="CODE" ...>` row, but tgju serves
 * two shapes depending on the market:
 *
 *   A) Tooltip rows (world/USD markets like the gold ounce, BTC, and some
 *      crypto): the `data-title` attribute holds a tooltip whose first
 *      `tooltip-row-txt` value is the latest live price, e.g.
 *      `...tooltip-row-txt'>4182.79 در ۱۱:۴۱...`, followed by
 *      `<span class='type high'>(1.44%) 59.47</span>`.
 *
 *   B) Cell rows (domestic IRR spot markets like 18k gold, USD, EUR, coins):
 *      `data-title` is empty; the price lives in the `data-price="..."`
 *      attribute and the daily change in the row's second
 *      `<td class="nf"><span class="high|low">(1.44%) ...</span></td>` cell.
 *
 * We try (A) first and fall back to (B) so both shapes work. Each row is
 * bounded to its closing `</tr>` so a match never bleeds into the next row.
 */
function parseMarket(html: string, def: MarketDef): Quote | null {
  // A code can appear both in a "summary widget" card (`data-market-row="CODE">`,
  // immediately closed) and in the prices table row. Anchor on the table row,
  // which always carries a following `data-title`/`data-price` attribute.
  const startRe = new RegExp(`data-market-row=["']${escapeRegex(def.code)}["']\\s+data-`)
  const start = startRe.exec(html)
  if (!start) return null
  const rowIdx = start.index
  const rowEnd = html.indexOf('</tr>', rowIdx)
  const row = html.slice(rowIdx, rowEnd === -1 ? rowIdx + 800 : rowEnd)

  let price: number | null = null
  let direction: Quote['direction'] = 'none'
  let changePercent: number | null = null

  const tip = /tooltip-row-txt['"]>([\d.,]+) /.exec(row)
  if (tip) {
    // Format A: price + change come from the data-title tooltip.
    price = Number(tip[1].replace(/,/g, ''))
    const after = row.slice(tip.index + tip[0].length, tip.index + tip[0].length + 300)
    const dirMatch = /class=['"]type (high|low)['"]/.exec(after)
    const pctMatch = /\(([\d.]+)%\)/.exec(after)
    if (pctMatch) {
      changePercent = Number(pctMatch[1])
      if (dirMatch) {
        direction = dirMatch[1] === 'high' ? 'up' : 'down'
        if (direction === 'down') changePercent = -changePercent
      }
    }
  } else {
    // Format B: price from data-price attr, change from the first cell span.
    const dp = /data-price=["']([\d.,]+)["']/.exec(row)
    if (dp) price = Number(dp[1].replace(/,/g, ''))
    const cell = /<span class=["'](high|low)?["']>\(([\d.]+)%\)/.exec(row)
    if (cell) {
      changePercent = Number(cell[2])
      if (cell[1]) {
        direction = cell[1] === 'high' ? 'up' : 'down'
        if (direction === 'down') changePercent = -changePercent
      }
    }
  }

  if (price == null || !Number.isFinite(price)) return null

  return {
    key: def.key,
    label: def.label,
    labelFa: def.labelFa,
    category: def.category,
    unit: def.unit,
    price,
    priceToman: def.unit === 'IRR' ? price / 10 : null,
    changePercent,
    direction,
  }
}

export interface ScrapeResult {
  scrapedAt: string
  source: string
  quotes: Record<string, Quote>
  missing: string[]
}

export async function scrapeTgju(): Promise<ScrapeResult> {
  const res = await fetch(TGJU_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  })
  if (!res.ok) {
    throw new Error(`tgju.org responded with ${res.status} ${res.statusText}`)
  }
  const html = await res.text()

  const quotes: Record<string, Quote> = {}
  const missing: string[] = []
  for (const def of MARKETS) {
    const quote = parseMarket(html, def)
    if (quote) quotes[def.key] = quote
    else missing.push(def.key)
  }

  return {
    scrapedAt: new Date().toISOString(),
    source: TGJU_URL,
    quotes,
    missing,
  }
}
