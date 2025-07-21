// 🧪 Ultra-minimal test server for Render
const http = require('http');

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting ultra-minimal server...');
console.log('📊 Environment check:');
console.log('   - PORT:', PORT);
console.log('   - NODE_ENV:', process.env.NODE_ENV);
console.log('   - SMARTLING_USER_IDENTIFIER:', process.env.SMARTLING_USER_IDENTIFIER ? 'SET' : 'MISSING');

const server = http.createServer((req, res) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Basic CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health' || req.url === '/') {
    const response = {
      status: 'healthy',
      message: '✅ Ultra-minimal server working on Render!',
      timestamp: new Date().toISOString(),
      port: PORT,
      url: req.url,
      method: req.method
    };
    
    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
    console.log('✅ Health check response sent');
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path: req.url }));
  }
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
}); 