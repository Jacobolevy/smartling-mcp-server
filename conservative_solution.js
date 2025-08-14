#!/usr/bin/env node

// SOLUCIÓN CONSERVADORA con rate limiting mejorado
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function conservativeSolution() {
  try {
    console.log('🐌 SOLUCIÓN CONSERVADORA - Con rate limiting mejorado');
    console.log('===================================================\n');
    
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
    const tag = 'Cursor 2025';
    
    // 2. Obtener archivos
    console.log('\n2. 📁 Obteniendo lista de archivos...');
    const filesResponse = await api.get(`/files-api/v2/projects/${projectId}/files/list`);
    const files = filesResponse.data.response?.data?.items || [];
    console.log(`Archivos encontrados: ${files.length}`);
    
    // 3. Procesar archivo por archivo con pausa larga
    console.log('\n3. 🔍 Procesando archivos uno por uno (con pausas)...');
    let allHashcodes = [];
    let processedFiles = 0;
    let totalStrings = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNum = i + 1;
      
      console.log(`\n   [${fileNum}/${files.length}] Procesando: ${file.fileUri}`);
      
      try {
        // Request muy simple
        const response = await api.get(`/strings-api/v2/projects/${projectId}/source-strings`, {
          params: { fileUri: file.fileUri }
        });
        
        const strings = response.data.response?.data?.items || [];
        totalStrings += strings.length;
        
        if (strings.length > 0) {
          console.log(`     ✅ ${strings.length} strings encontradas`);
          
          // Extraer hashcodes (incluir todas las strings por ahora)
          const hashcodes = strings.map(s => s.hashcode).filter(Boolean);
          console.log(`     🔑 ${hashcodes.length} hashcodes válidos`);
          
          allHashcodes = allHashcodes.concat(hashcodes);
          processedFiles++;
        } else {
          console.log(`     ⚪ Sin strings`);
        }
        
        // PAUSA LARGA para evitar rate limiting
        console.log(`     ⏳ Pausa de 2 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`     ❌ Error: ${error.response?.status} - ${error.message}`);
        
        // Si es error 429 (rate limit), pausar más tiempo
        if (error.response?.status === 429) {
          console.log(`     ⏳ Rate limit detectado, pausando 10 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
          // Pausa normal para otros errores
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // 4. Resumen
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Archivos procesados exitosamente: ${processedFiles}/${files.length}`);
    console.log(`   Total strings encontradas: ${totalStrings}`);
    console.log(`   Total hashcodes para tagging: ${allHashcodes.length}`);
    
    if (allHashcodes.length === 0) {
      console.log('\n⚠️ No se obtuvieron hashcodes para tagging');
      return;
    }
    
    // 5. Aplicar tagging conservador
    console.log(`\n4. 🏷️ Aplicando tag "${tag}" a ${allHashcodes.length} strings...`);
    console.log('   (Usando lotes pequeños con pausas largas)');
    
    const batchSize = 20; // Lotes muy pequeños
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < allHashcodes.length; i += batchSize) {
      const batch = allHashcodes.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(allHashcodes.length / batchSize);
      
      console.log(`\n   Lote ${batchNum}/${totalBatches} (${batch.length} strings)`);
      
      try {
        await api.post(`/tags-api/v2/projects/${projectId}/strings/tags/add`, {
          stringHashcodes: batch,
          tags: [tag]
        });
        
        console.log(`   ✅ Lote ${batchNum} completado exitosamente`);
        successful += batch.length;
        
      } catch (error) {
        console.log(`   ❌ Error en lote ${batchNum}: ${error.response?.status} - ${error.message}`);
        failed += batch.length;
        
        if (error.response?.data?.response?.errors) {
          const errors = error.response.data.response.errors;
          console.log(`   📝 Detalles: ${JSON.stringify(errors.slice(0, 2), null, 2)}`);
        }
      }
      
      // PAUSA LARGA entre lotes
      console.log(`   ⏳ Pausa de 3 segundos antes del siguiente lote...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 6. Resultado final
    console.log(`\n🎉 PROCESO COMPLETADO`);
    console.log(`===============================`);
    console.log(`📁 Archivos procesados: ${processedFiles}/${files.length}`);
    console.log(`📝 Total strings: ${totalStrings}`);
    console.log(`🔑 Total hashcodes: ${allHashcodes.length}`);
    console.log(`✅ Tags exitosos: ${successful}`);
    console.log(`❌ Tags fallidos: ${failed}`);
    console.log(`🏷️ Tag aplicado: "${tag}"`);
    
    if (successful > 0) {
      console.log(`\n🚀 ¡ÉXITO! Se etiquetaron ${successful} strings con "${tag}"`);
      console.log(`\n📋 Para verificar en Smartling:`);
      console.log(`   1. Ve a Strings view`);
      console.log(`   2. Usa el filtro de tags`);
      console.log(`   3. Busca "${tag}"`);
    }
    
  } catch (error) {
    console.error('\n💥 Error crítico:', error.message);
  }
}

conservativeSolution().catch(console.error);
