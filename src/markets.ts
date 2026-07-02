// Currency/unit that a raw tgju value is expressed in.
export type Unit = 'IRR' | 'USD'

export interface MarketDef {
  /** Stable key used in our API responses. */
  key: string
  /** The `data-market-row` code used on tgju.org. */
  code: string
  /** English label. */
  label: string
  /** Persian label (as shown on tgju). */
  labelFa: string
  unit: Unit
  category: 'gold' | 'currency' | 'crypto' | 'coin'
}

// The markets we scrape. Codes verified against the live tgju.org homepage.
export const MARKETS: MarketDef[] = [
  { key: 'gold_18k',    code: 'geram18',          label: 'Gold 18k (gram)',   labelFa: 'طلای ۱۸ عیار', unit: 'IRR', category: 'gold' },
  { key: 'gold_24k',    code: 'geram24',          label: 'Gold 24k (gram)',   labelFa: 'طلای ۲۴ عیار', unit: 'IRR', category: 'gold' },
  { key: 'gold_mesghal',code: 'mesghal',          label: 'Gold Mesghal',      labelFa: 'مثقال طلا',    unit: 'IRR', category: 'gold' },
  { key: 'gold_ounce',  code: 'ons',              label: 'Gold Ounce (world)',labelFa: 'انس طلا',       unit: 'USD', category: 'gold' },

  { key: 'usd',         code: 'price_dollar_rl',  label: 'US Dollar',         labelFa: 'دلار',          unit: 'IRR', category: 'currency' },
  { key: 'eur',         code: 'price_eur',        label: 'Euro',              labelFa: 'یورو',          unit: 'IRR', category: 'currency' },

  { key: 'tether',      code: 'crypto-tether-irr',label: 'Tether (USDT)',     labelFa: 'تتر',           unit: 'IRR', category: 'crypto' },
  { key: 'bitcoin',     code: 'crypto-bitcoin',   label: 'Bitcoin',           labelFa: 'بیت‌کوین',      unit: 'USD', category: 'crypto' },

  { key: 'coin_emami',  code: 'sekee',            label: 'Emami Coin',        labelFa: 'سکه امامی',     unit: 'IRR', category: 'coin' },
  { key: 'coin_bahar',  code: 'sekeb',            label: 'Bahar Azadi Coin',  labelFa: 'سکه بهار آزادی',unit: 'IRR', category: 'coin' },
]
