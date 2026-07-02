import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { scrapeTgju, type ScrapeResult } from './scraper.js'
import { calculate } from './calc.js'
import { MARKETS } from './markets.js'

// tgju refreshes every few seconds; cache briefly to stay fast and polite.
const CACHE_TTL_MS = 15_000
let cache: { at: number; data: ScrapeResult } | null = null

async function getData(force = false): Promise<ScrapeResult> {
  const now = Date.now()
  if (!force && cache && now - cache.at < CACHE_TTL_MS) return cache.data
  const data = await scrapeTgju()
  cache = { at: now, data }
  return data
}

const app = new Hono()
app.use('*', cors())

app.get('/', (c) =>
  c.json({
    name: 'price-scanner',
    description: 'Live gold, currency, crypto and oil prices scraped from tgju.org',
    endpoints: {
      'GET /prices': 'All tracked markets (raw + Toman conversion)',
      'GET /prices/:key': 'A single market by key',
      'GET /calculate': 'Derived calculations (gold ounce→Toman, per-gram, etc.)',
      'GET /markets': 'List of tracked markets and their keys',
      'GET /health': 'Health check',
    },
    markets: MARKETS.map((m) => m.key),
  })
)

app.get('/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

app.get('/markets', (c) =>
  c.json({
    markets: MARKETS.map(({ key, label, labelFa, unit, category, code }) => ({
      key,
      label,
      labelFa,
      unit,
      category,
      tgjuCode: code,
    })),
  })
)

app.get('/prices', async (c) => {
  try {
    const force = c.req.query('fresh') === '1'
    const data = await getData(force)
    return c.json(data)
  } catch (err) {
    return c.json({ error: 'scrape_failed', message: String(err) }, 502)
  }
})

app.get('/prices/:key', async (c) => {
  try {
    const key = c.req.param('key')
    const data = await getData()
    const quote = data.quotes[key]
    if (!quote) {
      return c.json(
        { error: 'not_found', message: `Unknown or unavailable market '${key}'`, available: Object.keys(data.quotes) },
        404
      )
    }
    return c.json({ scrapedAt: data.scrapedAt, source: data.source, quote })
  } catch (err) {
    return c.json({ error: 'scrape_failed', message: String(err) }, 502)
  }
})

app.get('/calculate', async (c) => {
  try {
    const data = await getData(c.req.query('fresh') === '1')
    return c.json(calculate(data))
  } catch (err) {
    return c.json({ error: 'scrape_failed', message: String(err) }, 502)
  }
})

export default app
