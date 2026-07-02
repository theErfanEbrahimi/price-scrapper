// Local dev server. On Vercel the app is served via api/index.ts instead.
import { serve } from '@hono/node-server'
import app from './app.js'

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`price-scanner listening on http://localhost:${info.port}`)
})
