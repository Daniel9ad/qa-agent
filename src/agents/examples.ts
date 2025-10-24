/**
 * Ejemplos de uso del sistema de agentes
 */

import { ContextAnalyzerAgent } from './implementations/context-analyzer-agent';

/**
 * Ejemplo 1: Uso básico del agente de análisis de contexto
 */
export async function basicUsageExample() {
  console.log('=== Ejemplo 1: Uso Básico ===\n');

  // Crear el agente
  const agent = new ContextAnalyzerAgent({
    verbose: true,
  });

  // Inicializar
  await agent.initialize();

  // Ejecutar el agente
  const result = await agent.run(
    'Analiza el contexto de este proyecto de QA y proporciona insights sobre su estructura.'
  );

  // Mostrar resultados
  console.log('Resultado:', result);
  console.log('Metadatos:', agent.getMetadata());

  return result;
}

/**
 * Ejemplo 2: Configuración personalizada del agente
 */
export async function customConfigExample() {
  console.log('\n=== Ejemplo 2: Configuración Personalizada ===\n');

  const agent = new ContextAnalyzerAgent({
    name: 'MiAgentPersonalizado',
    description: 'Agente personalizado para análisis específico',
    maxIterations: 10,
    verbose: true,
    tools: [
      {
        name: 'analyze_context',
        description: 'Análisis de contexto',
        enabled: true,
      },
      {
        name: 'search_information',
        description: 'Búsqueda de información',
        enabled: false, // Deshabilitar esta herramienta
      },
      {
        name: 'process_data',
        description: 'Procesamiento de datos',
        enabled: true,
      },
    ],
  });

  await agent.initialize();

  const result = await agent.run(
    'Realiza un análisis detallado del contexto proporcionado.'
  );

  return result;
}

/**
 * Ejemplo 3: Manejo de errores
 */
export async function errorHandlingExample() {
  console.log('\n=== Ejemplo 3: Manejo de Errores ===\n');

  const agent = new ContextAnalyzerAgent();

  try {
    await agent.initialize();
    const result = await agent.run('Input de prueba');

    if (!result.success) {
      console.error('Error en la ejecución:', result.error);
    } else {
      console.log('Ejecución exitosa');
    }
  } catch (error) {
    console.error('Error capturado:', error);
  }
}

/**
 * Ejemplo 4: Múltiples mensajes
 */
export async function multipleMessagesExample() {
  console.log('\n=== Ejemplo 4: Múltiples Mensajes ===\n');

  const agent = new ContextAnalyzerAgent({
    verbose: true,
  });

  await agent.initialize();

  const result = await agent.run([
    {
      content: 'Este es el primer mensaje del contexto',
      type: 'human',
    } as any,
    {
      content: 'Y este es información adicional relevante',
      type: 'human',
    } as any,
  ]);

  console.log('Mensajes procesados:', result.messages?.length);

  return result;
}

/**
 * Ejemplo 5: Monitoreo de ejecución
 */
export async function monitoringExample() {
  console.log('\n=== Ejemplo 5: Monitoreo de Ejecución ===\n');

  const agent = new ContextAnalyzerAgent({
    verbose: true,
  });

  await agent.initialize();

  console.log('Iniciando ejecución...');
  const startMetadata = agent.getMetadata();
  console.log('Metadatos iniciales:', startMetadata);

  const result = await agent.run('Analiza este contexto detalladamente');

  const endMetadata = agent.getMetadata();
  console.log('\nMetadatos finales:', endMetadata);
  console.log(`Duración: ${endMetadata.duration}ms`);
  console.log(`Iteraciones: ${endMetadata.iterationCount}`);
  console.log(`Estado: ${endMetadata.status}`);

  return result;
}

// Ejecutar ejemplos si este archivo se ejecuta directamente
if (require.main === module) {
  (async () => {
    try {
      await basicUsageExample();
      await customConfigExample();
      await errorHandlingExample();
      await multipleMessagesExample();
      await monitoringExample();
    } catch (error) {
      console.error('Error en los ejemplos:', error);
    }
  })();
}
