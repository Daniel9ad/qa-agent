/**
 * Script de prueba para verificar la conexión con Qdrant
 * Ejecutar con: npx tsx src/scripts/test-qdrant.ts
 */

import { qdrantClient, ensureRoutesCollection, getCollectionInfo, countEmbeddings } from '../lib/qdrant';

async function testQdrantConnection() {
  console.log('🔍 Probando conexión con Qdrant...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión...');
    const collections = await qdrantClient.getCollections();
    console.log('✅ Conexión exitosa!');
    console.log(`📦 Colecciones existentes: ${collections.collections.length}`);
    collections.collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // 2. Crear/verificar colección
    console.log('2. Verificando colección de rutas...');
    await ensureRoutesCollection();
    console.log('✅ Colección de rutas lista!');
    console.log('');

    // 3. Obtener información de la colección
    console.log('3. Información de la colección:');
    const info = await getCollectionInfo();
    console.log(`   Estado: ${info.status}`);
    console.log(`   Puntos almacenados: ${info.points_count || 0}`);
    if (info.config.params.vectors && typeof info.config.params.vectors === 'object' && 'size' in info.config.params.vectors) {
      console.log(`   Tamaño del vector: ${info.config.params.vectors.size}`);
      console.log(`   Distancia: ${info.config.params.vectors.distance}`);
    }
    console.log('');

    // 4. Contar embeddings
    console.log('4. Contando embeddings...');
    const count = await countEmbeddings();
    console.log(`✅ Total de embeddings: ${count}`);
    console.log('');

    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Asegúrate de tener GOOGLE_API_KEY en tu archivo .env');
    console.log('   2. Escanea rutas desde la interfaz web');
    console.log('   3. Genera embeddings con el botón "Generar Embeddings"');
    console.log('   4. Usa la búsqueda semántica para encontrar rutas similares');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n🔧 Soluciones posibles:');
    console.log('   1. Verifica que el contenedor de Qdrant esté corriendo:');
    console.log('      docker ps | grep qdrant');
    console.log('   2. Si no está corriendo, inícialo:');
    console.log('      docker start qdrant');
    console.log('   3. Verifica que QDRANT_URL esté correctamente configurado en .env');
    console.log('      QDRANT_URL=http://localhost:8080');
  }
}

// Ejecutar pruebas
testQdrantConnection();
