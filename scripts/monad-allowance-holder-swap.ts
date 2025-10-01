import { config as dotenv } from "dotenv";
import {
  createWalletClient,
  http,
  getContract,
  erc20Abi,
  parseUnits,
  maxUint256,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Chain } from "viem";
import { MONAD_TESTNET_TOKENS } from "@/utils/constants";

// Load env vars
dotenv();
const { PRIVATE_KEY, ZEROX_API_KEY, MONAD_HTTP_TRANSPORT_URL } = process.env as Record<string, string | undefined>;

if (!PRIVATE_KEY) throw new Error("missing PRIVATE_KEY.");
if (!ZEROX_API_KEY) throw new Error("missing ZEROX_API_KEY.");
if (!MONAD_HTTP_TRANSPORT_URL) throw new Error("missing MONAD_HTTP_TRANSPORT_URL.");

// Minimal Monad testnet chain config (id from utils/constants)
const monadTestnet: Chain = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_HTTP_TRANSPORT_URL] },
    public: { http: [MONAD_HTTP_TRANSPORT_URL] },
  },
};

// Headers for 0x API
const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": ZEROX_API_KEY,
  "0x-version": "v2",
});

// Wallet client
const client = createWalletClient({
  account: privateKeyToAccount(("0x" + PRIVATE_KEY) as `0x${string}`),
  chain: monadTestnet,
  transport: http(MONAD_HTTP_TRANSPORT_URL),
}).extend(publicActions);

const [address] = await client.getAddresses();

// Pick tokens from constants: sell WMON -> buy USDT
const WMON = MONAD_TESTNET_TOKENS[0];
const USDT = MONAD_TESTNET_TOKENS[1];

const wmon = getContract({ address: WMON.address, abi: erc20Abi, client });

async function main() {
  // 1) Specify sell amount (e.g. 0.1 WMON)
  const sellAmount = parseUnits("0.1", WMON.decimals);

  // 2) Fetch price (AllowanceHolder price)
  const priceParams = new URLSearchParams({
    chainId: client.chain.id.toString(),
    sellToken: WMON.address,
    buyToken: USDT.address,
    sellAmount: sellAmount.toString(),
  });

  console.log("Fetching price to swap 0.1 WMON for USDT");
  const priceUrl = `https://api.0x.org/swap/allowance-holder/price?${priceParams.toString()}`;
  console.log(priceUrl);
  const priceResponse = await fetch(priceUrl, { headers });
  const price = await priceResponse.json();
  console.log("price:", price);

  // 3) Approve AllowanceHolder if needed
  if (price?.issues?.allowance) {
    try {
      const spender = price.issues.allowance.spender as `0x${string}`;
      const { request } = await wmon.simulate.approve([spender, maxUint256]);
      console.log("Approving AllowanceHolder to spend WMON...", request);
      const approveHash = await wmon.write.approve(request.args);
      const receipt = await client.waitForTransactionReceipt({ hash: approveHash });
      console.log("Approved AllowanceHolder to spend WMON.", receipt);
    } catch (error) {
      console.error("Error approving AllowanceHolder:", error);
    }
  } else {
    console.log("WMON already approved for AllowanceHolder");
  }

  // 4) Fetch quote (AllowanceHolder quote)
  const quoteParams = new URLSearchParams(priceParams);
  quoteParams.append("taker", address);

  console.log("Fetching quote to swap 0.1 WMON for USDT");
  const quoteUrl = `https://api.0x.org/swap/allowance-holder/quote?${quoteParams.toString()}`;
  console.log(quoteUrl);
  const quoteResponse = await fetch(quoteUrl, { headers });
  const quote = await quoteResponse.json();
  console.log("quote:", quote);

  if (!quote?.transaction?.to || !quote?.transaction?.data) {
    const reason = quote?.validationErrors?.[0]?.reason || quote?.code || "Unknown";
    throw new Error(`Invalid quote or pair not supported: ${reason}`);
  }

  // 5) Send transaction
  const txHash = await client.sendTransaction({
    to: quote.transaction.to,
    data: quote.transaction.data,
    value: quote.transaction.value ? BigInt(quote.transaction.value) : undefined,
  });

  console.log("Tx hash:", txHash);
  console.log(`See tx details on your Monad explorer for hash ${txHash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


