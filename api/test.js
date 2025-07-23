// NEW ROUTE TEST - Bypass cache
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  res.status(200).json({
    SUCCESS: 'API TEST WORKING!',
    message: '🎉 API test endpoint functioning properly!',
    version: 'API-TEST',
    timestamp: new Date().toISOString(),
    cache_bypass: true
  });
}; 