// api/webhook.js - FULLY COMPATIBLE DENGAN QRISPY
import crypto from 'crypto';

export default async function handler(req, res) {
  // 1. SECURITY: Verify Signature
  const signature = req.headers['x-qrispy-signature'];
  const webhookSecret = 'whsec_zDeREwEHWvE8y8xmyhSGJsPJkOSxIsMf';
  const rawBody = await getRawBody(req);
  
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
    
  if (!crypto.timingSafeEqual(
    Buffer.from(signature || ''), 
    Buffer.from(`whsec_${expectedSignature}`)
  )) {
    console.log('❌ INVALID SIGNATURE');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Parse Payload
  const payload = JSON.parse(rawBody);
  console.log('🔔 QRISPY WEBHOOK PAYLOAD:', payload);
  
  if (req.method === 'POST' && payload.event === 'payment.received') {
    const { qris_id, amount, metadata } = payload.data;
    
    // 3. AUTO WITHDRAW KE DANA
    await autoWithdrawToDana(qris_id, metadata?.dana_number, amount);
    
    console.log('✅ Webhook processed:', qris_id);
  }
  
  return res.status(200).json({ 
    success: true, 
    event: payload.event 
  });
}

// Helper: Get raw body untuk signature verification
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req.body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
}

async function autoWithdrawToDana(qris_id, danaNumber, totalAmount) {
  if (!danaNumber) {
    console.log('⚠️ No dana number in metadata');
    return;
  }
  
  const ADMIN_FEE = 2000;
  const topupAmount = totalAmount - ADMIN_FEE;
  
  console.log(`🤖 AUTO WITHDRAW: Rp${topupAmount} → ${danaNumber}`);
  
  try {
    const response = await fetch('https://api.qrispy.id/api/payment/withdraw', {
      method: 'POST',
      headers: {
        'X-API-Token': 'cki_MDT3cC14ASTcV9yCcZOEOROZFqVgNvZlWjsC5ofjrp3x2DBe',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: topupAmount,
        phone_number: danaNumber,
        method: 'DANA',
        reference: `topup_${qris_id}`
      })
    });
    
    const result = await response.json();
    console.log('💰 WITHDRAW RESULT:', result);
    
  } catch (error) {
    console.error('💥 WITHDRAW ERROR:', error);
  }
      }
