import { MARKETS, type MarketDef } from './markets.js'

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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract one market's data from the tgju homepage HTML.
 *
 * Each market is a `<tr data-market-row="CODE" data-title="...">` row. The
 * latest live price is the first `tooltip-row-txt` value inside data-title,
 * e.g. `...tooltip-row-txt'>174514000 در ۱۱:۲۹...`. We use that (rather than
 * the `data-price` attribute) because a few rows, like WTI oil, omit it.
 */
function parseMarket(html: string, def: MarketDef): Quote | null {
  // Bound the search to the start of this row's data-title tooltip.
  const rowRe = new RegExp(
    `data-market-row="${escapeRegex(def.code)}"([\\s\\S]{0,600}?)tooltip-row-txt['"]>([\\d.,]+) `
  )
  const m = rowRe.exec(html)
  if (!m) return null

  const price = Number(m[2].replace(/,/g, ''))
  if (!Number.isFinite(price)) return null

  // Change direction + percent follow the price in the same tooltip row:
  // ...NUMBER در TIME </span>...<span class='type high'>(1.13%) 1944000</span>
  const after = html.slice(m.index + m[0].length, m.index + m[0].length + 300)
  const dirMatch = /class=['"]type (high|low)['"]/.exec(after)
  const pctMatch = /\(([\d.]+)%\)/.exec(after)

  let direction: Quote['direction'] = 'none'
  let changePercent: number | null = null
  if (pctMatch) {
    changePercent = Number(pctMatch[1])
    if (dirMatch) {
      direction = dirMatch[1] === 'high' ? 'up' : 'down'
      if (direction === 'down') changePercent = -changePercent
    }
  }

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
