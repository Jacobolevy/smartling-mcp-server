#!/usr/bin/env node

// Test profundo del endpoint source-strings que parece funcionar
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function deepSourceStringsTest() {
  try {
    console.log('🔬 ANÁLISIS PROFUNDO DEL ENDPOINT SOURCE-STRINGS');
    console.log('================================================\n');
    
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
    
    // 1. Obtener lista de archivos primero
    console.log('1. 📁 Obteniendo lista de archivos...');
    const filesResponse = await api.get(`/files-api/v2/projects/${projectId}/files/list`);
    const files = filesResponse.data.response?.data?.items || [];
    console.log(`Archivos encontrados: ${files.length}`);
    
    if (files.length > 0) {
      console.log('Archivos disponibles:');
      files.slice(0, 5).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.fileUri} (${file.fileType || 'unknown'})`);
      });
    }
    
    // 2. Probar source-strings sin parámetros
    console.log('\n2. 🔍 Probando source-strings sin parámetros...');
    try {
      const response = await api.get(`/strings-api/v2/projects/${projectId}/source-strings`);
      console.log('Response status:', response.status);
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('Error:', error.response?.status, error.message);
      if (error.response?.data) {
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // 3. Probar source-strings con fileUri específico
    if (files.length > 0) {
      console.log('\n3. 🔍 Probando source-strings con fileUri específico...');
      
      for (let i = 0; i < Math.min(3, files.length); i++) {
        const file = files[i];
        console.log(`\n   Probando archivo: ${file.fileUri}`);
        
        const testParams = [
          // Sin encoding
          { fileUri: file.fileUri },
          // Con encoding
          { fileUri: encodeURIComponent(file.fileUri) },
          // Con parámetros adicionales
          { fileUri: file.fileUri, limit: 100, includeInactive: true },
          // Con timestamps
          { fileUri: file.fileUri, includeTimestamps: true, limit: 100 }
        ];
        
        for (const [index, params] of testParams.entries()) {
          try {
            console.log(`     Test ${index + 1}: ${JSON.stringify(params)}`);
            const response = await api.get(`/strings-api/v2/projects/${projectId}/source-strings`, { params });
            
            const data = response.data;
            const items = data?.response?.data?.items || data?.response?.data || data?.data || data;
            
            if (Array.isArray(items) && items.length > 0) {
              console.log(`     ✅ ÉXITO! ${items.length} strings encontradas`);
              console.log(`     📋 Primer string:`, JSON.stringify(items[0], null, 2));
              return { success: true, file: file.fileUri, params, strings: items };
            } else if (items && typeof items === 'object') {
              console.log(`     ⚠️ Respuesta no-array:`, JSON.stringify(items, null, 2));
            } else {
              console.log(`     ⚠️ Respuesta vacía o inválida`);
            }
            
          } catch (error) {
            console.log(`     ❌ Test ${index + 1} falló: ${error.response?.status} - ${error.message}`);
          }
        }
      }
    }
    
    // 4. Probar diferentes variaciones del endpoint
    console.log('\n4. 🔍 Probando variaciones del endpoint...');
    
    const endpointVariations = [
      `/strings-api/v2/projects/${projectId}/source-strings`,
      `/strings-api/v2/projects/${projectId}/strings/source`,
      `/files-api/v2/projects/${projectId}/source-strings`,
      `/projects-api/v2/projects/${projectId}/source-strings`,
      `/strings-api/v1/projects/${projectId}/source-strings`
    ];
    
    for (const endpoint of endpointVariations) {
      try {
        console.log(`   Probando: ${endpoint}`);
        const response = await api.get(endpoint, { params: { limit: 1 } });
        
        const data = response.data;
        const items = data?.response?.data?.items || data?.response?.data || data?.data || data;
        
        if (Array.isArray(items) && items.length > 0) {
          console.log(`   ✅ ${endpoint}: ${items.length} strings`);
          return { success: true, endpoint, strings: items };
        } else {
          console.log(`   ⚠️ ${endpoint}: Respuesta vacía`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${endpoint}: ${error.response?.status}`);
      }
    }
    
    console.log('\n❌ Ninguna variación funcionó');
    return { success: false };
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    return { success: false, error: error.message };
  }
}

deepSourceStringsTest().then(result => {
  if (result.success) {
    console.log('\n🎉 ¡ENCONTRAMOS UN MÉTODO QUE FUNCIONA!');
    console.log('Detalles del éxito:', JSON.stringify(result, null, 2));
  } else {
    console.log('\n😞 No se encontró ningún método funcional');
  }
}).catch(console.error);
