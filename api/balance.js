// api/balance.js
export default async function handler(req, res) {
  const { user_id = 'default' } = req.query;
  
  // Simulate balance
  const balance = Math.floor(Math.random() * 100000) + 100000;
  
  res.json({
    success: true,
    user_id,
    balance,
    timestamp: new Date().toISOString()
  });
}
