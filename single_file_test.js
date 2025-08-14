#!/usr/bin/env node

// Test con un solo archivo que sabemos que funcionó
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function singleFileTest() {
  const api = axios.create({
    baseURL: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
    timeout: 30000
  });
  
  // Autenticación
  const authResponse = await api.post('/auth-api/v2/authenticate', {
    userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
    userSecret: process.env.SMARTLING_USER_SECRET
  });
  
  const accessToken = authResponse.data.response.data.accessToken;
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  
  const projectId = '7528efacc';
  const testFile = 'wix-premium/messages/WixStores_VIP_Services/WixStores_VIP_Services_en.properties';
  
  console.log('🧪 PRUEBA CON ARCHIVO ESPECÍFICO');
  console.log(`Archivo: ${testFile}`);
  
  try {
    const response = await api.get(`/strings-api/v2/projects/${projectId}/source-strings`, {
      params: { fileUri: testFile }
    });
    
    console.log('✅ ÉXITO!');
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data));
    
    const strings = response.data.response?.data?.items || [];
    console.log(`Strings encontradas: ${strings.length}`);
    
    if (strings.length > 0) {
      console.log('Primera string:', JSON.stringify(strings[0], null, 2));
      
      // Probar tagging con el primer hashcode
      const hashcode = strings[0].hashcode;
      if (hashcode) {
        console.log(`\n🏷️ Probando tagging con hashcode: ${hashcode}`);
        try {
          await api.post(`/tags-api/v2/projects/${projectId}/strings/tags/add`, {
            stringHashcodes: [hashcode],
            tags: ['Cursor 2025']
          });
          console.log('✅ Tagging exitoso!');
        } catch (tagError) {
          console.log('❌ Error tagging:', tagError.response?.status, tagError.message);
          if (tagError.response?.data) {
            console.log('Tag Error Data:', JSON.stringify(tagError.response.data, null, 2));
          }
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

singleFileTest().catch(console.error);
