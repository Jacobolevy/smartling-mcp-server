#!/usr/bin/env node

// Test para buscar strings en pending antes de 2025 con el código revertido
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testPendingSearch() {
  try {
    console.log('🔄 PROBANDO BÚSQUEDA DE STRINGS PENDING (Post-reversión)');
    console.log('=====================================================\n');
    
    // Configurar API client
    const api = axios.create({
      baseURL: process.env.SMARTLING_BASE_URL || 'https://api.smartling.com',
      timeout: 30000
    });
    
    // 1. Autenticación
    console.log('1. 🔐 Autenticando...');
    const authResponse = await api.post('/auth-api/v2/authenticate', {
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET
    });
    
    const accessToken = authResponse.data.response.data.accessToken;
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    console.log('✅ Autenticación exitosa');
    
    const projectId = '7528efacc';
    const cutoffDate = '2025-01-01T00:00:00Z';
    
    // 2. Verificar acceso al proyecto
    console.log('\n2. 🔍 Verificando acceso al proyecto...');
    try {
      const projectResponse = await api.get(`/projects-api/v2/projects/${projectId}`);
      console.log('✅ Acceso al proyecto confirmado:', projectResponse.data.response?.data?.projectName);
    } catch (error) {
      console.log('❌ Error accediendo al proyecto:', error.message);
      return;
    }
    
    // 3. Probar diferentes endpoints de strings (igual que antes pero con logging mejorado)
    console.log('\n3. 🔍 Probando endpoints de strings...');
    
    const stringEndpoints = [
      // Endpoint básico
      {
        name: 'Strings API básico',
        method: 'GET',
        url: `/strings-api/v2/projects/${projectId}/strings`,
        params: { limit: 10 }
      },
      // Con filtros de fecha
      {
        name: 'Strings con filtro de fecha',
        method: 'GET', 
        url: `/strings-api/v2/projects/${projectId}/strings`,
        params: { 
          createdBefore: cutoffDate,
          limit: 10 
        }
      },
      // Source strings
      {
        name: 'Source strings',
        method: 'GET',
        url: `/strings-api/v2/projects/${projectId}/source-strings`, 
        params: { limit: 10 }
      },
      // Search endpoint
      {
        name: 'Search endpoint',
        method: 'POST',
        url: `/strings-api/v2/projects/${projectId}/strings/search`,
        data: { 
          query: '*',
          limit: 10 
        }
      },
      // Translation status endpoint
      {
        name: 'Translation status',
        method: 'GET',
        url: `/projects-api/v2/projects/${projectId}/translations`,
        params: { limit: 10 }
      }
    ];
    
    let foundStrings = [];
    
    for (const endpoint of stringEndpoints) {
      console.log(`\n   Probando: ${endpoint.name}`);
      try {
        let response;
        if (endpoint.method === 'GET') {
          response = await api.get(endpoint.url, { params: endpoint.params });
        } else {
          response = await api.post(endpoint.url, endpoint.data);
        }
        
        const data = response.data;
        let items = data?.response?.data?.items || 
                   data?.response?.data || 
                   data?.data?.items ||
                   data?.data ||
                   (Array.isArray(data) ? data : []);
        
        if (Array.isArray(items) && items.length > 0) {
          console.log(`   ✅ ${endpoint.name}: ${items.length} items encontrados`);
          console.log(`   📋 Campos disponibles: ${Object.keys(items[0]).slice(0, 8).join(', ')}`);
          
          if (items[0].stringText || items[0].text || items[0].sourceString) {
            console.log(`   📝 Texto ejemplo: "${(items[0].stringText || items[0].text || items[0].sourceString).substring(0, 50)}..."`);
          }
          
          if (items[0].hashcode || items[0].stringUid) {
            console.log(`   🔑 ID ejemplo: ${items[0].hashcode || items[0].stringUid}`);
          }
          
          foundStrings = items;
          break; // Si encontramos strings, dejamos de probar
        } else {
          console.log(`   ⚠️ ${endpoint.name}: Respuesta vacía o sin items`);
        }
        
      } catch (error) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.response?.code || error.message;
        console.log(`   ❌ ${endpoint.name}: ${status} - ${errorMessage}`);
      }
    }
    
    // 4. Si encontramos strings, proceder con el filtrado y tagging
    if (foundStrings.length > 0) {
      console.log(`\n4. 🎯 Procesando ${foundStrings.length} strings encontradas...`);
      
      // Filtrar por fecha si no se hizo en la query
      const oldStrings = foundStrings.filter(str => {
        const dateField = str.createdDate || str.created || str.modifiedDate;
        if (!dateField) return true; // Incluir si no hay fecha (asumir que es vieja)
        
        const stringDate = new Date(dateField);
        const cutoffDateObj = new Date(cutoffDate);
        return stringDate < cutoffDateObj;
      });
      
      console.log(`   📅 Strings antes de 2025: ${oldStrings.length}`);
      
      if (oldStrings.length > 0) {
        // Extraer IDs para tagging
        const stringIds = oldStrings.map(str => 
          str.hashcode || str.stringUid || str.uid || str.id
        ).filter(Boolean);
        
        console.log(`   🔑 IDs válidos para tagging: ${stringIds.length}`);
        
        if (stringIds.length > 0) {
          console.log('\n5. 🏷️ Probando tagging...');
          
          // Probar con un solo string primero
          const testId = stringIds[0];
          const tag = 'Cursor 2025';
          
          const tagEndpoints = [
            {
              name: 'Tags API add endpoint',
              url: `/tags-api/v2/projects/${projectId}/strings/tags/add`,
              payload: { stringHashcodes: [testId], tags: [tag] }
            },
            {
              name: 'Tags API basic endpoint',
              url: `/tags-api/v2/projects/${projectId}/strings/tags`,
              payload: { stringUids: [testId], tags: [tag] }
            }
          ];
          
          for (const tagEndpoint of tagEndpoints) {
            try {
              await api.post(tagEndpoint.url, tagEndpoint.payload);
              console.log(`   ✅ ${tagEndpoint.name}: Tagging exitoso!`);
              
              // Si funciona, proceder con todos los IDs
              console.log(`\n🚀 Aplicando tag a todos los ${stringIds.length} strings...`);
              
              const batchSize = 50;
              for (let i = 0; i < stringIds.length; i += batchSize) {
                const batch = stringIds.slice(i, i + batchSize);
                const batchPayload = { ...tagEndpoint.payload, stringHashcodes: batch, stringUids: batch };
                
                try {
                  await api.post(tagEndpoint.url, batchPayload);
                  console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1} completado`);
                } catch (batchError) {
                  console.log(`   ❌ Error en lote ${Math.floor(i/batchSize) + 1}: ${batchError.message}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
              }
              
              console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE!');
              return;
              
            } catch (error) {
              console.log(`   ❌ ${tagEndpoint.name}: ${error.response?.status} - ${error.message}`);
            }
          }
          
          console.log('\n❌ Ningún endpoint de tagging funcionó');
        }
      } else {
        console.log('\n⚠️ No hay strings que cumplan el criterio de fecha');
      }
    } else {
      console.log('\n❌ No se pudieron obtener strings de ningún endpoint');
    }
    
  } catch (error) {
    console.error('\n💥 Error crítico:', error.message);
  }
}

testPendingSearch().catch(console.error);
