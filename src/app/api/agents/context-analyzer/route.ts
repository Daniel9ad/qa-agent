import { NextRequest, NextResponse } from 'next/server';
import { ContextAnalyzerAgent } from '@/agents';

export async function POST(request: NextRequest) {
  let agent: ContextAnalyzerAgent | null = null;

  try {
    const body = await request.json();
    const { input, config, googleApiKey } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    // Crear el agente con configuración personalizada (si se proporciona)
    agent = new ContextAnalyzerAgent(config);
    
    // Inicializar el modelo LLM de Google si se proporciona API key
    const apiKey = googleApiKey || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      agent.initializeModel(apiKey);
    }
    
    // Inicializar el agente
    // Esto automáticamente conectará a los servidores MCP configurados
    await agent.initialize();
    
    // Ejecutar el agente
    const result = await agent.run(input);
    
    // Obtener metadatos de ejecución
    const metadata = agent.getMetadata();

    // Limpiar recursos
    await agent.cleanup();

    return NextResponse.json({
      result,
      metadata,
    });
  } catch (error) {
    console.error('Error executing context analyzer agent:', error);
    
    // Limpiar recursos en caso de error
    if (agent) {
      try {
        await agent.cleanup();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to execute agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
