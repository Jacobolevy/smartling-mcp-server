// NEW ROUTE TEST - Bypass cache
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  res.status(200).json({
    SUCCESS: 'NEW ROUTE WORKING!',
    message: '🎉 This proves Vercel can load new functions!',
    version: 'NEW-ROUTE-TEST',
    timestamp: new Date().toISOString(),
    cache_bypass: true
  });
}; 