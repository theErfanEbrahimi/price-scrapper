import type { ScrapeResult } from './scraper.js'

const TROY_OUNCE_GRAMS = 31.1034768
const MESGHAL_GRAMS = 4.6083

function round(n: number, digits = 0): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/**
 * Derive calculated values from the raw quotes, e.g. converting the world
 * gold ounce (USD) into local Toman using the live USD rate.
 */
export function calculate(data: ScrapeResult) {
  const q = data.quotes
  const usdToman = q.usd ? q.usd.price / 10 : null
  const ounceUsd = q.gold_ounce?.price ?? null

  // World gold ounce expressed in Toman, and derived per-gram (24k) value.
  const ounceToman = ounceUsd != null && usdToman != null ? ounceUsd * usdToman : null
  const goldGramGlobalToman = ounceToman != null ? ounceToman / TROY_OUNCE_GRAMS : null

  return {
    scrapedAt: data.scrapedAt,
    source: data.source,
    usd: {
      rial: q.usd?.price ?? null,
      toman: usdToman,
    },
    tether: {
      rial: q.tether?.price ?? null,
      toman: q.tether ? q.tether.price / 10 : null,
    },
    gold: {
      ounceUsd,
      ounceToman: ounceToman != null ? round(ounceToman) : null,
      gramGlobal24kToman: goldGramGlobalToman != null ? round(goldGramGlobalToman) : null,
      gram18kToman: q.gold_18k ? q.gold_18k.price / 10 : null,
      gram24kToman: q.gold_24k ? q.gold_24k.price / 10 : null,
      mesghalToman: q.gold_mesghal ? q.gold_mesghal.price / 10 : null,
      // Per-gram implied by the mesghal price (sanity cross-check).
      gramFromMesghalToman: q.gold_mesghal
        ? round(q.gold_mesghal.price / 10 / MESGHAL_GRAMS)
        : null,
    },
    constants: { TROY_OUNCE_GRAMS, MESGHAL_GRAMS },
  }
}
