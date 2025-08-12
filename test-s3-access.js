import axios from 'axios';

const figmaUrl = 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b0da98b4-173c-4e66-bda8-0d15534491d3';

async function testDifferentConfigurations() {
  console.log('🧪 Testing different axios configurations for S3 access...\n');

  // Test 1: Minimal headers like curl
  console.log('Test 1: Minimal headers (like curl)');
  try {
    const response1 = await axios.get(figmaUrl, {
      headers: {
        'Accept': '*/*'
      },
      timeout: 10000
    });
    console.log('✅ SUCCESS - Status:', response1.status, 'Content-Type:', response1.headers['content-type']);
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }

  // Test 2: No custom headers at all
  console.log('\nTest 2: No custom headers');
  try {
    const response2 = await axios.get(figmaUrl, {
      timeout: 10000
    });
    console.log('✅ SUCCESS - Status:', response2.status, 'Content-Type:', response2.headers['content-type']);
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }

  // Test 3: Current implementation headers
  console.log('\nTest 3: Current implementation headers');
  try {
    const response3 = await axios.get(figmaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Smartling-Bot/1.0)',
        'Accept': 'image/png,image/jpeg,image/webp,image/*,*/*',
        'Accept-Encoding': 'identity'
      },
      timeout: 10000
    });
    console.log('✅ SUCCESS - Status:', response3.status, 'Content-Type:', response3.headers['content-type']);
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }

  // Test 4: Only User-Agent
  console.log('\nTest 4: Only User-Agent');
  try {
    const response4 = await axios.get(figmaUrl, {
      headers: {
        'User-Agent': 'curl/8.7.1'
      },
      timeout: 10000
    });
    console.log('✅ SUCCESS - Status:', response4.status, 'Content-Type:', response4.headers['content-type']);
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }

  // Test 5: With arraybuffer response type
  console.log('\nTest 5: With arraybuffer response type (our use case)');
  try {
    const response5 = await axios.get(figmaUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': '*/*'
      },
      timeout: 10000
    });
    console.log('✅ SUCCESS - Status:', response5.status, 'Data length:', response5.data.byteLength, 'bytes');
  } catch (error) {
    console.log('❌ FAILED -', error.response?.status || error.code, error.message);
  }
}

testDifferentConfigurations().catch(console.error);
