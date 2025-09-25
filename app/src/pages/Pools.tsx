import { Contract, JsonRpcProvider, formatUnits } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { ERC20ABI, UniswapV2FactoryABI, UniswapV2PairABI } from '../lib/abi'
import { DEFAULT_RPC, MONAD_ADDRESSES } from '../lib/monad'

type PoolRow = {
  pair: string
  token0: string
  token1: string
  symbol0: string
  symbol1: string
  reserve0: string
  reserve1: string
}

const CANDIDATE_TOKENS = [
  MONAD_ADDRESSES.WMON,
  MONAD_ADDRESSES.USDC,
  MONAD_ADDRESSES.WETH,
  MONAD_ADDRESSES.USDT,
  MONAD_ADDRESSES.WBTC,
  MONAD_ADDRESSES.WSOL,
]

export default function Pools() {
  const [rows, setRows] = useState<PoolRow[]>([])
  const [loading, setLoading] = useState(false)
  const provider = useMemo(() => new JsonRpcProvider(DEFAULT_RPC), [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const factory = new Contract(MONAD_ADDRESSES.UniswapV2Factory, UniswapV2FactoryABI, provider)

        const pairs: string[] = []
        for (let i = 0; i < CANDIDATE_TOKENS.length; i++) {
          for (let j = i + 1; j < CANDIDATE_TOKENS.length; j++) {
            const a = CANDIDATE_TOKENS[i]
            const b = CANDIDATE_TOKENS[j]
            const pair = await factory.getPair(a, b)
            if (pair && pair !== '0x0000000000000000000000000000000000000000') pairs.push(pair)
          }
        }

        const fetched: PoolRow[] = []
        for (const pair of pairs) {
          const pc = new Contract(pair, UniswapV2PairABI, provider)
          const [t0, t1] = await Promise.all([pc.token0(), pc.token1()])
          const [reserve0, reserve1] = await pc.getReserves().then((r: any) => [r._reserve0, r._reserve1])

          const [sym0, dec0, sym1, dec1] = await Promise.all([
            new Contract(t0, ERC20ABI, provider).symbol(),
            new Contract(t0, ERC20ABI, provider).decimals(),
            new Contract(t1, ERC20ABI, provider).symbol(),
            new Contract(t1, ERC20ABI, provider).decimals(),
          ])

          fetched.push({
            pair,
            token0: t0,
            token1: t1,
            symbol0: sym0,
            symbol1: sym1,
            reserve0: formatUnits(reserve0, dec0),
            reserve1: formatUnits(reserve1, dec1),
          })
        }
        setRows(fetched)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [provider])

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Pools on Monad Testnet</h2>
      {loading && <div className="text-sm text-neutral-400">Loading pools…</div>}
      {!loading && rows.length === 0 && <div className="text-sm text-neutral-400">No candidate pools found.</div>}
      <div className="grid grid-cols-1 gap-3">
        {rows.map((r) => (
          <div key={r.pair} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="font-medium">{r.symbol0}/{r.symbol1}</div>
            <div className="text-xs text-neutral-400">{r.token0} · {r.token1}</div>
            <div className="mt-2 text-sm text-neutral-200">Reserves: {r.reserve0} / {r.reserve1}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


