import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { z } from 'zod';
import { createChainWatcher } from './chain.js';
import { ethers } from 'ethers';

const stats = {
  totalDonations: 0n,
  totalDisbursed: 0n,
  totalDonationCount: 0n,
  uniqueDonorCount: 0n,
};

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/stats', (_req, res) => {
  res.json({
    totalDonations: stats.totalDonations.toString(),
    totalDisbursed: stats.totalDisbursed.toString(),
    totalDonationCount: stats.totalDonationCount.toString(),
    uniqueDonorCount: stats.uniqueDonorCount.toString(),
    avgDonation:
      stats.totalDonationCount === 0n
        ? '0'
        : (stats.totalDonations / stats.totalDonationCount).toString(),
  });
});

const DonationIntent = z.object({
  beneficiaryId: z.string().min(1),
  amountWei: z.string().regex(/^\d+$/),
});

app.post('/api/donation-intent', (req, res) => {
  const parsed = DonationIntent.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  res.json({ ok: true });
});

const ClaimIntent = z.object({
  beneficiaryId: z.string().min(1),
  wallet: z.string().min(1),
  disasterId: z.string().min(1),
  userUniqueHash: z.string().min(1),
  docHash: z.string().min(1),
});

app.post('/api/claim-intent', (req, res) => {
  const parsed = ClaimIntent.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  res.json({ ok: true });
});

// Auth (wallet signature) — ephemeral, in-memory
const nonces = new Map(); // address -> nonce
const sessions = new Map(); // token -> address

app.get('/api/auth/nonce', (req, res) => {
  const address = String(req.query.address || '').toLowerCase();
  if (!address) return res.status(400).json({ error: 'address required' });
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  nonces.set(address, nonce);
  res.json({ nonce, message: `Mon-Aid login nonce: ${nonce}` });
});

app.post('/api/auth/verify', async (req, res) => {
  const schema = z.object({ address: z.string(), signature: z.string(), message: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { address, signature, message } = parsed.data;
  const expected = nonces.get(address.toLowerCase());
  if (!expected || !message.includes(expected)) return res.status(400).json({ error: 'bad nonce' });
  try {
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) return res.status(401).json({ error: 'bad signature' });
    const token = `sess_${Math.random().toString(36).slice(2)}${Date.now()}`;
    sessions.set(token, address.toLowerCase());
    res.json({ token });
  } catch (e) {
    res.status(400).json({ error: 'verify failed' });
  }
});

// Disasters API (in-memory; replace with DB in production)
const disasters = [];
app.get('/api/disasters', (_req, res) => {
  res.json({ items: disasters });
});
app.post('/api/disasters', (req, res) => {
  const adminKey = process.env.ADMIN_KEY || '';
  const token = req.headers['x-auth'];
  const hasSession = token && sessions.has(String(token));
  if (!hasSession && (!adminKey || req.headers['x-admin-key'] !== adminKey)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const schema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    region: z.string().min(1),
    description: z.string().default(''),
    beneficiaryId: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  disasters.push({ ...parsed.data, createdAt: Date.now() });
  broadcast({ type: 'disasters', payload: { items: disasters } });
  res.json({ ok: true });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const server = app.listen(port, () => {
  console.log(`Backend listening on :${port}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

setInterval(() => {
  broadcast({ type: 'heartbeat', t: Date.now() });
}, 10000);

const rpc = process.env.MONAD_RPC || 'http://127.0.0.1:8545';
const contractAddress = process.env.RELIEF_CONTRACT_ADDRESS;
const beneficiaryRegistryAddress = process.env.BENEFICIARY_REGISTRY_ADDRESS;
if (contractAddress) {
  createChainWatcher({
    rpcUrl: rpc,
    contractAddress,
    beneficiaryRegistryAddress,
    onStats: (s) => {
      stats.totalDonations = s.totalDonations;
      stats.totalDisbursed = s.totalDisbursed;
      stats.totalDonationCount = s.totalDonationCount;
      stats.uniqueDonorCount = s.uniqueDonorCount;
      broadcast({ type: 'stats', payload: {
        totalDonations: s.totalDonations.toString(),
        totalDisbursed: s.totalDisbursed.toString(),
        totalDonationCount: s.totalDonationCount.toString(),
        uniqueDonorCount: s.uniqueDonorCount.toString(),
        avgDonation: s.totalDonationCount === 0n ? '0' : (s.totalDonations / s.totalDonationCount).toString(),
      }});
    },
  });
} else {
  console.warn('RELIEF_CONTRACT_ADDRESS not set; stats will not auto-update from chain.');
}


