import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: false,
    setupMiddlewares: (middlewares) => {
      middlewares.use('/api/swap', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const chainId = url.searchParams.get('chainId')
            || process.env.VITE_ZEROEX_CHAIN_ID
            || process.env.VITE_MONAD_CHAIN_ID
            || '10143'
          const sellToken = url.searchParams.get('sellToken')
          const buyToken = url.searchParams.get('buyToken')
          const sellAmount = url.searchParams.get('sellAmount')
          const taker = url.searchParams.get('taker')

          if (!sellToken || !buyToken || !sellAmount || !taker) {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing required params: sellToken, buyToken, sellAmount, taker' }))
            return
          }

          const params = new URLSearchParams({
            chainId,
            sellToken,
            buyToken,
            sellAmount,
            taker,
          })

          const apiKey = process.env.ZEROEX_API_KEY || process.env.VITE_ZEROEX_API_KEY || ''
          const upstream = `https://api.0x.org/swap/allowance-holder/quote?${params.toString()}`
          const upstreamRes = await fetch(upstream, {
            headers: {
              '0x-version': 'v2',
              ...(apiKey ? { '0x-api-key': apiKey } : {}),
            },
            cache: 'no-store',
          })

          const text = await upstreamRes.text()
          let data
          try {
            data = JSON.parse(text)
          } catch {
            data = { raw: text }
          }

          res.statusCode = upstreamRes.status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Proxy error'
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })
      return middlewares
    },
  },
})
