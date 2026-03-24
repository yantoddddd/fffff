// api/webhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-qrispy-signature'];
  const payload = JSON.stringify(req.body);
  const WEBHOOK_SECRET = 'whsec_IXaGostGaonC0AvumOBWSgaMfZl0AffC';

  // ✅ Verify Qrispy Signature
  const crypto = await import('crypto');
  const expectedSignature = crypto.webcrypto.subtle
    .importKey('raw', new TextEncoder().encode(WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(key => crypto.webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
    .then(signature => Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join(''));

  if (signature !== (await expectedSignature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;
  console.log('✅ QRISPY Webhook:', event, data);

  // Simpan ke storage (Vercel KV / Database)
  if (event === 'payment.received') {
    // Update balance + broadcast
    const balance = await updateUserBalance(data.qris_id, data.received_amount);
    
    // Broadcast ke semua client (Server-Sent Events)
    await broadcastBalance(balance);
  }

  res.status(200).json({ success: true, received: event });
}

// Vercel KV Storage
let balances = new Map(); // In-memory (restart = reset)

async function updateUserBalance(qrisId, amount) {
  const userId = qrisId.split('-')[0] || 'default';
  const current = balances.get(userId) || 250000;
  const newBalance = current + amount;
  balances.set(userId, newBalance);
  return newBalance;
}

async function broadcastBalance(balance) {
  // Simulate broadcast ke frontend
  console.log('📢 Balance updated:', formatRp(balance));
  }
