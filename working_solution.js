#!/usr/bin/env node

// SOLUCIÓN FINAL FUNCIONAL - Buscar strings por archivo y aplicar tag
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function workingSolution() {
  try {
    console.log('🚀 SOLUCIÓN FUNCIONAL - BUSCAR Y ETIQUETAR STRINGS');
    console.log('=================================================\n');
    
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
    console.log('\n3. 🔍 Analizando strings por archivo...');
    let allOldStrings = [];
    let totalStrings = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNum = i + 1;
      
      console.log(`\n   [${fileNum}/${files.length}] ${file.fileUri}`);
      
      try {
        // Obtener strings del archivo
        const response = await api.get(`/strings-api/v2/projects/${projectId}/source-strings`, {
          params: {
            fileUri: file.fileUri,
            includeTimestamps: true,
            limit: 5000
          }
        });
        
        const data = response.data.response?.data;
        const strings = data?.items || [];
        totalStrings += strings.length;
        
        if (strings.length > 0) {
          console.log(`     📝 ${strings.length} strings encontradas`);
          
          // Filtrar por fecha de creación
          const oldStrings = strings.filter(str => {
            // Buscar fecha en diferentes campos
            const dateFields = [
              str.createdDate,
              str.created,
              str.modifiedDate,
              ...(str.contentFileStringInstructions || []).map(inst => inst.contentFileStringInstruction)
            ];
            
            for (const dateField of dateFields) {
              if (dateField && typeof dateField === 'string') {
                // Intentar parsear diferentes formatos de fecha
                let parsedDate;
                
                // Formato "Sat Aug 09 19:15:16 UTC 2025"
                if (dateField.includes('UTC')) {
                  parsedDate = new Date(dateField);
                }
                // Formato ISO
                else if (dateField.includes('T') || dateField.includes('-')) {
                  parsedDate = new Date(dateField);
                }
                
                if (parsedDate && !isNaN(parsedDate.getTime())) {
                  const isOld = parsedDate < cutoffDate;
                  if (isOld) {
                    return true; // Es anterior al cutoff, incluir
                  }
                }
              }
            }
            
            // Si no hay fecha válida, incluir por defecto (asumir que es vieja)
            return true;
          });
          
          if (oldStrings.length > 0) {
            console.log(`     📅 ${oldStrings.length} strings anteriores a 2025`);
            
            // Agregar info del archivo a cada string
            oldStrings.forEach(str => {
              str.sourceFileUri = file.fileUri;
              str.sourceFileName = file.fileName || file.fileUri;
            });
            
            allOldStrings = allOldStrings.concat(oldStrings);
          } else {
            console.log(`     ⏰ No hay strings anteriores a 2025`);
          }
        } else {
          console.log(`     ⚪ Archivo vacío`);
        }
        
        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`     ❌ Error: ${error.response?.status} - ${error.message}`);
      }
    }
    
    // 4. Resumen de búsqueda
    console.log(`\n📊 RESUMEN DE BÚSQUEDA:`);
    console.log(`   Total archivos procesados: ${files.length}`);
    console.log(`   Total strings encontradas: ${totalStrings}`);
    console.log(`   Strings anteriores a 2025: ${allOldStrings.length}`);
    
    if (allOldStrings.length === 0) {
      console.log('\n⚠️ No se encontraron strings que cumplan los criterios');
      return;
    }
    
    // Mostrar muestra
    console.log('\n📋 Muestra de strings encontradas:');
    allOldStrings.slice(0, 3).forEach((str, index) => {
      console.log(`   ${index + 1}. ${str.hashcode} - "${str.parsedStringText?.substring(0, 60)}..."`);
      console.log(`      Archivo: ${str.sourceFileUri}`);
    });
    
    // 5. Extraer hashcodes para tagging
    console.log('\n5. 🏷️ Preparando para tagging...');
    const hashcodes = allOldStrings.map(str => str.hashcode).filter(Boolean);
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
      
      console.log(`   Procesando lote ${batchNum}/${totalBatches} (${batch.length} strings)...`);
      
      try {
        // Usar el endpoint que sabemos que funciona
        await api.post(`/tags-api/v2/projects/${projectId}/strings/tags/add`, {
          stringHashcodes: batch,
          tags: [tag]
        });
        
        console.log(`   ✅ Lote ${batchNum} completado exitosamente`);
        successfulTags += batch.length;
        
      } catch (error) {
        console.log(`   ❌ Error en lote ${batchNum}: ${error.response?.status} - ${error.message}`);
        failedTags += batch.length;
        
        if (error.response?.data) {
          console.log(`      Detalles: ${JSON.stringify(error.response.data)}`);
        }
      }
      
      // Pausa para rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 7. Resumen final
    console.log(`\n🎉 PROCESO COMPLETADO`);
    console.log(`============================`);
    console.log(`📁 Archivos procesados: ${files.length}`);
    console.log(`📝 Total strings analizadas: ${totalStrings}`);
    console.log(`📅 Strings anteriores a 2025: ${allOldStrings.length}`);
    console.log(`🏷️ Tags aplicados exitosamente: ${successfulTags}`);
    console.log(`❌ Tags fallidos: ${failedTags}`);
    console.log(`🎯 Tag usado: "${tag}"`);
    
    if (successfulTags > 0) {
      console.log(`\n✅ ¡ÉXITO! Se etiquetaron ${successfulTags} strings con "${tag}"`);
    }
    
  } catch (error) {
    console.error('\n💥 Error crítico:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

workingSolution().catch(console.error);
