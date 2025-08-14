#!/usr/bin/env node

// SOLUCIÓN FINAL CORREGIDA - Sin includeTimestamps que causa error 400
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function finalWorkingSolution() {
  try {
    console.log('🎯 SOLUCIÓN FINAL CORREGIDA - ETIQUETAR STRINGS PRE-2025');
    console.log('========================================================\n');
    
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
    const cutoffDate = new Date('2025-01-01T00:00:00Z');
    const tag = 'Cursor 2025';
    
    // 2. Obtener todos los archivos
    console.log('\n2. 📁 Obteniendo lista de archivos...');
    const filesResponse = await api.get(`/files-api/v2/projects/${projectId}/files/list`);
    const files = filesResponse.data.response?.data?.items || [];
    console.log(`Archivos encontrados: ${files.length}`);
    
    // 3. Iterar por cada archivo y obtener strings
    console.log('\n3. 🔍 Procesando strings por archivo...');
    let allValidStrings = [];
    let totalStrings = 0;
    let processedFiles = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNum = i + 1;
      
      console.log(`   [${fileNum}/${files.length}] ${file.fileUri}`);
      
      try {
        // Obtener strings del archivo (SIN includeTimestamps para evitar error 400)
        const response = await api.get(`/strings-api/v2/projects/${projectId}/source-strings`, {
          params: {
            fileUri: file.fileUri,
            limit: 5000
          }
        });
        
        const data = response.data.response?.data;
        const strings = data?.items || [];
        totalStrings += strings.length;
        processedFiles++;
        
        if (strings.length > 0) {
          console.log(`     ✅ ${strings.length} strings encontradas`);
          
          // Filtrar strings con fechas anteriores a 2025
          const oldStrings = strings.filter(str => {
            // Buscar fechas en contentFileStringInstructions
            if (str.contentFileStringInstructions && str.contentFileStringInstructions.length > 0) {
              for (const instruction of str.contentFileStringInstructions) {
                const dateStr = instruction.contentFileStringInstruction;
                if (dateStr && typeof dateStr === 'string') {
                  // Parsear fecha "Sat Aug 09 19:15:16 UTC 2025"
                  const parsedDate = new Date(dateStr);
                  if (!isNaN(parsedDate.getTime())) {
                    return parsedDate < cutoffDate;
                  }
                }
              }
            }
            
            // Si no hay fecha, incluir por defecto (asumir que es pre-2025)
            return true;
          });
          
          console.log(`     📅 ${oldStrings.length} strings válidas para tagging`);
          
          // Agregar info del archivo
          oldStrings.forEach(str => {
            str.sourceFileUri = file.fileUri;
            str.sourceFileName = file.fileName || file.fileUri;
          });
          
          allValidStrings = allValidStrings.concat(oldStrings);
        } else {
          console.log(`     ⚪ Sin strings`);
        }
        
        // Pausa para rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`     ❌ Error: ${error.response?.status} - ${error.message}`);
      }
    }
    
    // 4. Resumen de búsqueda
    console.log(`\n📊 RESUMEN DE BÚSQUEDA:`);
    console.log(`   Archivos procesados exitosamente: ${processedFiles}/${files.length}`);
    console.log(`   Total strings encontradas: ${totalStrings}`);
    console.log(`   Strings válidas para tagging: ${allValidStrings.length}`);
    
    if (allValidStrings.length === 0) {
      console.log('\n⚠️ No se encontraron strings válidas para tagging');
      return;
    }
    
    // Mostrar muestra
    console.log('\n📋 Muestra de strings para tagging:');
    allValidStrings.slice(0, 3).forEach((str, index) => {
      const dateInfo = str.contentFileStringInstructions?.[0]?.contentFileStringInstruction || 'Sin fecha';
      console.log(`   ${index + 1}. ${str.hashcode}`);
      console.log(`      Texto: "${str.parsedStringText?.substring(0, 50)}..."`);
      console.log(`      Archivo: ${str.sourceFileUri}`);
      console.log(`      Fecha: ${dateInfo}`);
    });
    
    // 5. Extraer hashcodes
    console.log('\n5. 🏷️ Extrayendo hashcodes...');
    const hashcodes = allValidStrings.map(str => str.hashcode).filter(Boolean);
    console.log(`   Hashcodes válidos: ${hashcodes.length}`);
    
    if (hashcodes.length === 0) {
      console.log('❌ No se pudieron extraer hashcodes válidos');
      return;
    }
    
    // 6. Aplicar tags en lotes
    console.log(`\n6. 🏷️ Aplicando tag "${tag}" a ${hashcodes.length} strings...`);
    
    const batchSize = 50;
    let successfulTags = 0;
    let failedTags = 0;
    
    for (let i = 0; i < hashcodes.length; i += batchSize) {
      const batch = hashcodes.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(hashcodes.length / batchSize);
      
      console.log(`   Lote ${batchNum}/${totalBatches}: ${batch.length} strings...`);
      
      try {
        // Usar el endpoint correcto que ya confirmamos que funciona
        const response = await api.post(`/tags-api/v2/projects/${projectId}/strings/tags/add`, {
          stringHashcodes: batch,
          tags: [tag]
        });
        
        console.log(`   ✅ Lote ${batchNum} completado`);
        successfulTags += batch.length;
        
      } catch (error) {
        console.log(`   ❌ Error en lote ${batchNum}: ${error.response?.status} - ${error.message}`);
        failedTags += batch.length;
        
        if (error.response?.data?.response?.errors) {
          console.log(`      Detalle: ${JSON.stringify(error.response.data.response.errors)}`);
        }
      }
      
      // Pausa para rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 7. Resumen final
    console.log(`\n🎉 PROCESO COMPLETADO`);
    console.log(`===========================================`);
    console.log(`📁 Archivos procesados: ${processedFiles}/${files.length}`);
    console.log(`📝 Total strings analizadas: ${totalStrings}`);
    console.log(`🎯 Strings candidatas: ${allValidStrings.length}`);
    console.log(`✅ Tags aplicados exitosamente: ${successfulTags}`);
    console.log(`❌ Tags fallidos: ${failedTags}`);
    console.log(`🏷️ Tag aplicado: "${tag}"`);
    
    if (successfulTags > 0) {
      console.log(`\n🚀 ¡ÉXITO TOTAL! Se etiquetaron ${successfulTags} strings con "${tag}"`);
      console.log(`\nEn Smartling UI, ahora puedes buscar strings con el tag "${tag}" para ver todas las strings pre-2025.`);
    } else if (failedTags > 0) {
      console.log(`\n⚠️ El tagging falló. Revisar permisos o formato de payload.`);
    }
    
    // 8. Información de debugging si hubo errores
    if (processedFiles < files.length) {
      console.log(`\n🔍 DEBUG INFO:`);
      console.log(`Archivos con errores: ${files.length - processedFiles}`);
      console.log(`Esto puede deberse a archivos vacíos, sin permisos, o formatos especiales.`);
    }
    
  } catch (error) {
    console.error('\n💥 Error crítico:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

finalWorkingSolution().catch(console.error);
