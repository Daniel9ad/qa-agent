/**
 * Script de prueba para validar la integración con MCP y Google Gemini
 * Ejecutar con: npx tsx src/agents/test-integration.ts
 */

import { ContextAnalyzerAgent } from './implementations/context-analyzer-agent';
import { MCPClient } from './tools/mcp-client';

async function testMCPConnection() {
  console.log('=== Test 1: Conexión MCP ===\n');
  
  const mcpClient = new MCPClient({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-playwright'],
  });

  try {
    console.log('Conectando al servidor MCP de Playwright...');
    await mcpClient.connect();
    console.log('✅ Conexión exitosa\n');

    console.log('Obteniendo lista de herramientas...');
    const tools = await mcpClient.listTools();
    console.log(`✅ Encontradas ${tools.length} herramientas:\n`);
    
    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   ${tool.description || 'Sin descripción'}\n`);
    });

    await mcpClient.disconnect();
    console.log('✅ Desconexión exitosa\n');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function testGoogleGemini() {
  console.log('\n=== Test 2: Google Gemini ===\n');
  
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  GOOGLE_API_KEY no está configurada');
    console.log('   Configura la variable de entorno para probar Gemini\n');
    return false;
  }

  const agent = new ContextAnalyzerAgent({
    verbose: true,
  });

  try {
    console.log('Inicializando modelo Gemini...');
    agent.initializeModel(apiKey);
    console.log('✅ Modelo inicializado\n');
    
    await agent.initialize();
    
    console.log('Ejecutando prueba simple...');
    const result = await agent.run('Hola, ¿puedes confirmar que funcionas correctamente?');
    
    if (result.success) {
      console.log('\n✅ Prueba exitosa');
      console.log('\nRespuesta del agente:');
      console.log(result.messages?.[result.messages.length - 1]?.content);
    } else {
      console.log('\n❌ Prueba fallida:', result.error);
    }
    
    await agent.cleanup();
    return result.success;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function testFullIntegration() {
  console.log('\n=== Test 3: Integración Completa (Gemini + MCP) ===\n');
  
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  GOOGLE_API_KEY no está configurada');
    console.log('   Saltando test de integración completa\n');
    return false;
  }

  const agent = new ContextAnalyzerAgent({
    verbose: true,
  });

  const mcpClient = new MCPClient({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-playwright'],
  });

  try {
    console.log('Inicializando agente completo...');
    agent.initializeModel(apiKey);
    await agent.initializeMCP(mcpClient);
    await agent.initialize();
    
    const toolCount = agent['tools'].length;
    console.log(`✅ Agente inicializado con ${toolCount} herramientas\n`);
    
    console.log('Ejecutando análisis de prueba...');
    const result = await agent.run(
      'Analiza el contexto actual y lista las herramientas que tienes disponibles.'
    );
    
    if (result.success) {
      console.log('\n✅ Análisis exitoso');
      console.log('\nResultado:');
      console.log(result.messages?.[result.messages.length - 1]?.content);
      
      console.log('\nMetadatos:');
      const metadata = agent.getMetadata();
      console.log(`- Duración: ${metadata.duration}ms`);
      console.log(`- Iteraciones: ${metadata.iterationCount}`);
      console.log(`- Estado: ${metadata.status}`);
    } else {
      console.log('\n❌ Análisis fallido:', result.error);
    }
    
    await agent.cleanup();
    return result.success;
  } catch (error) {
    console.error('❌ Error:', error);
    await agent.cleanup();
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Tests de Integración - QA Agent          ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const results = {
    mcp: false,
    gemini: false,
    full: false,
  };

  // Test 1: MCP
  results.mcp = await testMCPConnection();

  // Test 2: Google Gemini
  results.gemini = await testGoogleGemini();

  // Test 3: Integración completa
  if (results.mcp && results.gemini) {
    results.full = await testFullIntegration();
  }

  // Resumen
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Resumen de Tests                          ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log(`MCP Connection:         ${results.mcp ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Google Gemini:          ${results.gemini ? '✅ PASS' : '❌ FAIL (necesita API key)'}`);
  console.log(`Integración Completa:   ${results.full ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n' + '='.repeat(50));
  
  const allPassed = results.mcp && results.gemini && results.full;
  
  if (allPassed) {
    console.log('🎉 ¡Todos los tests pasaron! El sistema está listo.\n');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisa la configuración.\n');
    
    if (!results.gemini) {
      console.log('💡 Tip: Configura GOOGLE_API_KEY en .env.local');
      console.log('   Obtén tu key en: https://makersuite.google.com/app/apikey\n');
    }
  }

  process.exit(allPassed ? 0 : 1);
}

// Ejecutar tests
runAllTests().catch(console.error);
