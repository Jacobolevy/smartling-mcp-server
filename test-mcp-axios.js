import axios from 'axios';

const figmaUrl = 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b0da98b4-173c-4e66-bda8-0d15534491d3';

async function testMCPConfiguration() {
  console.log('🧪 Testing exact MCP axios configuration...\n');

  // Create axios instance like in MCP
  const api = axios.create({
    baseURL: 'https://api.smartling.com',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Test 1: Using MCP's axios instance (but external URL)
  console.log('Test 1: Using MCP-style axios instance');
  try {
    const response1 = await api.get(figmaUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Smartling-Bot/1.0)',
        'Accept': 'image/png,image/jpeg,image/webp,image/*,*/*',
        'Accept-Encoding': 'identity'
      },
      timeout: 30000,
      maxRedirects: 5
    });
    console.log('✅ SUCCESS - Status:', response1.status, 'Data length:', response1.data.byteLength, 'bytes');
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
    if (error.response?.data) {
      console.log('Response data:', error.response.data);
    }
  }

  // Test 2: Simplest working config
  console.log('\nTest 2: Simplest config that worked');
  try {
    const response2 = await api.get(figmaUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': '*/*'
      },
      timeout: 30000
    });
    console.log('✅ SUCCESS - Status:', response2.status, 'Data length:', response2.data.byteLength, 'bytes');
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }

  // Test 3: No headers override (let axios decide)
  console.log('\nTest 3: No headers override');
  try {
    const response3 = await api.get(figmaUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    console.log('✅ SUCCESS - Status:', response3.status, 'Data length:', response3.data.byteLength, 'bytes');
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }

  // Test 4: Check if Content-Type header from instance causes issues
  console.log('\nTest 4: Fresh axios instance without Content-Type');
  try {
    const freshApi = axios.create();
    const response4 = await freshApi.get(figmaUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Smartling-Bot/1.0)',
        'Accept': 'image/png,image/jpeg,image/webp,image/*,*/*',
        'Accept-Encoding': 'identity'
      },
      timeout: 30000
    });
    console.log('✅ SUCCESS - Status:', response4.status, 'Data length:', response4.data.byteLength, 'bytes');
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }
}

testMCPConfiguration().catch(console.error);
