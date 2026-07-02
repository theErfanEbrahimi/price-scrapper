// Vercel entry point. The catch-all rewrite in vercel.json routes every
// request here, and Hono handles routing from the original URL path.
import { handle } from 'hono/vercel'
import app from '../src/app.js'

export const config = { runtime: 'edge' }

export default handle(app)
