/**
 * Ejemplos de uso del límite de mensajes en RouteAgent
 * 
 * Este archivo demuestra cómo configurar y usar el límite de mensajes
 * para optimizar el rendimiento y reducir costos del agente.
 */

import { RouteAgent } from './route-agent';

// ============================================================================
// Ejemplo 1: Configuración Básica (Uso por defecto)
// ============================================================================

async function example1_defaultConfig() {
  console.log('\n=== Ejemplo 1: Configuración por defecto ===\n');
  
  // El agente usa messageLimit: 10 por defecto
  const agent = new RouteAgent({ verbose: true });
  
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  await agent.initialize();
  
  const result = await agent.run(
    'Navega a https://example.com y analiza el contenido de la página'
  );
  
  console.log('Messages en resultado:', result.messages?.length);
  console.log('Máximo por tipo: 10 (default)');
  
  await agent.cleanup();
}

// ============================================================================
// Ejemplo 2: Límite Reducido para Tareas Simples
// ============================================================================

async function example2_lowLimit() {
  console.log('\n=== Ejemplo 2: Límite reducido (5 mensajes) ===\n');
  
  // Para tareas simples, usar límite menor = menos tokens = menor costo
  const agent = new RouteAgent({ 
    messageLimit: 5,
    verbose: true 
  });
  
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  await agent.initialize();
  
  const result = await agent.run(
    'Crea una ruta simple para la página de inicio'
  );
  
  console.log('Tarea simple completada con límite de 5 mensajes por tipo');
  console.log('Beneficio: -50% en tokens vs. default');
  
  await agent.cleanup();
}

// ============================================================================
// Ejemplo 3: Límite Extendido para Tareas Complejas
// ============================================================================

async function example3_highLimit() {
  console.log('\n=== Ejemplo 3: Límite extendido (25 mensajes) ===\n');
  
  // Para tareas complejas que requieren más contexto
  const agent = new RouteAgent({ 
    messageLimit: 25,
    maxIterations: 50,
    verbose: true 
  });
  
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  await agent.initialize();
  
  const result = await agent.run(
    'Navega a múltiples páginas, analiza la estructura, toma screenshots y crea rutas para todo'
  );
  
  console.log('Tarea compleja con más contexto histórico disponible');
  console.log('Trade-off: Más contexto pero mayor costo');
  
  await agent.cleanup();
}

// ============================================================================
// Ejemplo 4: Debugging con Máximo Historial
// ============================================================================

async function example4_debugging() {
  console.log('\n=== Ejemplo 4: Debugging (50 mensajes) ===\n');
  
  // Para debugging, mantener mucho historial
  const agent = new RouteAgent({ 
    messageLimit: 50,
    verbose: true 
  });
  
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  await agent.initialize();
  
  const result = await agent.run(
    'Realiza un análisis completo de la aplicación web'
  );
  
  // Inspeccionar todos los mensajes para debugging
  if (result.messages) {
    console.log('\nDesglose de mensajes por tipo:');
    const byType = result.messages.reduce((acc: any, msg: any) => {
      const type = msg._getType();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    console.log(byType);
  }
  
  await agent.cleanup();
}

// ============================================================================
// Ejemplo 5: Configuración Desde API
// ============================================================================

async function example5_apiCall() {
  console.log('\n=== Ejemplo 5: Configuración desde API ===\n');
  
  // Simular llamada a la API
  const apiRequest = {
    input: 'Analiza la página web',
    config: {
      messageLimit: 15,  // Configuración personalizada
      verbose: true,
    }
  };
  
  console.log('POST /api/agents/route-agent');
  console.log('Body:', JSON.stringify(apiRequest, null, 2));
  
  // El agente se crea con la configuración personalizada
  const agent = new RouteAgent(apiRequest.config);
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  await agent.initialize();
  
  const result = await agent.run(apiRequest.input);
  
  console.log('Agente ejecutado con messageLimit: 15');
  
  await agent.cleanup();
}

// ============================================================================
// Ejemplo 6: Comparación de Rendimiento
// ============================================================================

async function example6_performanceComparison() {
  console.log('\n=== Ejemplo 6: Comparación de rendimiento ===\n');
  
  const testInput = 'Analiza https://example.com';
  
  // Test con límite bajo
  console.log('Test 1: messageLimit = 5');
  const agent1 = new RouteAgent({ messageLimit: 5 });
  agent1.initializeModel(process.env.GOOGLE_API_KEY);
  await agent1.initialize();
  const start1 = Date.now();
  await agent1.run(testInput);
  const duration1 = Date.now() - start1;
  console.log(`Duración: ${duration1}ms`);
  await agent1.cleanup();
  
  // Test con límite alto
  console.log('\nTest 2: messageLimit = 25');
  const agent2 = new RouteAgent({ messageLimit: 25 });
  agent2.initializeModel(process.env.GOOGLE_API_KEY);
  await agent2.initialize();
  const start2 = Date.now();
  await agent2.run(testInput);
  const duration2 = Date.now() - start2;
  console.log(`Duración: ${duration2}ms`);
  await agent2.cleanup();
  
  // Comparación
  const improvement = ((duration2 - duration1) / duration2 * 100).toFixed(2);
  console.log(`\nMejora con límite bajo: ${improvement}%`);
}

// ============================================================================
// Ejemplo 7: Recomendaciones Según Caso de Uso
// ============================================================================

function example7_recommendations() {
  console.log('\n=== Ejemplo 7: Recomendaciones según caso de uso ===\n');
  
  const recommendations = [
    {
      useCase: 'Análisis simple de una página',
      messageLimit: 5,
      reason: 'Pocas iteraciones, contexto mínimo suficiente',
    },
    {
      useCase: 'Navegación web básica',
      messageLimit: 10,
      reason: 'Balance óptimo entre contexto y costo',
    },
    {
      useCase: 'Análisis multi-página',
      messageLimit: 15,
      reason: 'Necesita recordar información de páginas anteriores',
    },
    {
      useCase: 'Automatización compleja',
      messageLimit: 20,
      reason: 'Múltiples pasos con dependencias',
    },
    {
      useCase: 'Debugging y desarrollo',
      messageLimit: 50,
      reason: 'Máximo contexto para análisis detallado',
    },
  ];
  
  console.log('Recomendaciones:');
  console.log('─'.repeat(80));
  recommendations.forEach(({ useCase, messageLimit, reason }) => {
    console.log(`\n📌 ${useCase}`);
    console.log(`   messageLimit: ${messageLimit}`);
    console.log(`   Razón: ${reason}`);
  });
  console.log('\n' + '─'.repeat(80));
}

// ============================================================================
// Ejemplo 8: Monitoreo de Uso de Mensajes
// ============================================================================

async function example8_monitoring() {
  console.log('\n=== Ejemplo 8: Monitoreo de uso de mensajes ===\n');
  
  const agent = new RouteAgent({ 
    messageLimit: 10,
    verbose: true 
  });
  
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  await agent.initialize();
  
  const result = await agent.run('Analiza la estructura de la página web');
  
  if (result.messages) {
    const messageStats = {
      total: result.messages.length,
      byType: result.messages.reduce((acc: any, msg: any) => {
        const type = msg._getType();
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      estimatedTokens: result.messages.reduce((total: number, msg: any) => {
        // Estimación aproximada: ~4 caracteres por token
        const content = msg.content || '';
        return total + Math.ceil(content.length / 4);
      }, 0),
    };
    
    console.log('\n📊 Estadísticas de mensajes:');
    console.log('─'.repeat(50));
    console.log(`Total de mensajes: ${messageStats.total}`);
    console.log(`Límite configurado: 10 por tipo`);
    console.log('\nMensajes por tipo:');
    Object.entries(messageStats.byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    console.log(`\nTokens estimados: ~${messageStats.estimatedTokens}`);
    console.log('─'.repeat(50));
  }
  
  await agent.cleanup();
}

// ============================================================================
// Función Principal
// ============================================================================

async function main() {
  console.log('🚀 Ejemplos de Uso: Message Limit en RouteAgent');
  console.log('='.repeat(80));
  
  try {
    // Descomentar los ejemplos que quieras ejecutar
    
    // await example1_defaultConfig();
    // await example2_lowLimit();
    // await example3_highLimit();
    // await example4_debugging();
    // await example5_apiCall();
    // await example6_performanceComparison();
    example7_recommendations();
    // await example8_monitoring();
    
    console.log('\n✅ Ejemplos completados\n');
  } catch (error) {
    console.error('\n❌ Error en ejemplos:', error);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

export {
  example1_defaultConfig,
  example2_lowLimit,
  example3_highLimit,
  example4_debugging,
  example5_apiCall,
  example6_performanceComparison,
  example7_recommendations,
  example8_monitoring,
};
