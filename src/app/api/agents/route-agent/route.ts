import { NextRequest } from 'next/server';
import { RouteAgent } from '@/agents';

export async function POST(request: NextRequest) {
  let agent: RouteAgent | null = null;

  try {
    const body = await request.json();
    const { input, config } = body;

    if (!input) {
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Crear stream para SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Función helper para enviar eventos SSE
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Enviar evento de inicio
          sendEvent('start', { 
            message: 'Iniciando agente...', 
            timestamp: new Date().toISOString() 
          });

          // Crear el agente con configuración personalizada
          agent = new RouteAgent(config);
          
          // Configurar callback para eventos de progreso
          agent.onProgress = (event: any) => {
            sendEvent('progress', event);
          };
          
          sendEvent('progress', { 
            step: 'initialization', 
            message: 'Inicializando modelo LLM...' 
          });

          // Inicializar el modelo LLM de Google
          const apiKey = process.env.GOOGLE_API_KEY;
          agent.initializeModel(apiKey);
          
          sendEvent('progress', { 
            step: 'initialization', 
            message: 'Inicializando herramientas y MCP...' 
          });

          // Inicializar el agente
          await agent.initialize();
          
          sendEvent('progress', { 
            step: 'execution', 
            message: 'Ejecutando agente...' 
          });

          // Ejecutar el agente
          const result = await agent.run(input);
          
          // Obtener metadatos de ejecución
          const metadata = agent.getMetadata();

          sendEvent('progress', { 
            step: 'cleanup', 
            message: 'Limpiando recursos...' 
          });

          // Limpiar recursos
          await agent.cleanup();

          // Enviar resultado final
          sendEvent('complete', {
            result,
            metadata,
            timestamp: new Date().toISOString()
          });

          controller.close();
        } catch (error) {
          console.error('Error executing RouteAgent:', error);
          
          // Limpiar recursos en caso de error
          if (agent) {
            try {
              await agent.cleanup();
            } catch (cleanupError) {
              console.error('Error during cleanup:', cleanupError);
            }
          }

          sendEvent('error', {
            error: 'Failed to execute agent',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });

          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error setting up SSE:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to setup SSE stream',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
