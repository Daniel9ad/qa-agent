import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Route from '@/models/Route';
import {
  ensureRoutesCollection,
  getEmbeddingsModel,
  generateAndSaveEmbedding,
  searchSimilarRoutes,
} from '@/lib/qdrant';

/**
 * POST /api/routes/embeddings
 * Genera embeddings para todas las rutas de un proyecto y las almacena en Qdrant
 * Usa Server-Sent Events (SSE) para reportar progreso en tiempo real
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'El projectId es requerido' },
        { status: 400 }
      );
    }

    // Crear un stream para SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Función auxiliar para enviar eventos SSE
    const sendEvent = async (event: string, data: any) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Procesar en segundo plano
    (async () => {
      try {
        const startTime = new Date().toISOString();
        
        // Enviar evento de inicio
        await sendEvent('start', {
          message: 'Iniciando generación de embeddings...',
          timestamp: startTime,
        });

        // Conectar a MongoDB
        await sendEvent('progress', {
          step: 'database_connect',
          message: 'Conectando a la base de datos...',
        });
        await dbConnect();

        // Obtener todas las rutas del proyecto que no tienen id_vdb
        await sendEvent('progress', {
          step: 'fetch_routes',
          message: 'Obteniendo rutas pendientes...',
        });
        
        const routes = await Route.find({
          projectId,
          $or: [
            { id_vdb: { $exists: false } },
            { id_vdb: null },
            { id_vdb: '' }
          ]
        });

        if (routes.length === 0) {
          await sendEvent('complete', {
            message: 'No hay rutas pendientes de procesar',
            timestamp: new Date().toISOString(),
            result: {
              success: true,
              processed: 0,
              total: 0,
            },
          });
          await writer.close();
          return;
        }

        await sendEvent('progress', {
          step: 'routes_found',
          message: `Se encontraron ${routes.length} rutas pendientes`,
          details: { total: routes.length },
        });

        // Verificar/crear colección en Qdrant
        await sendEvent('progress', {
          step: 'qdrant_setup',
          message: 'Verificando colección en Qdrant...',
        });
        await ensureRoutesCollection();

        // Inicializar modelo de embeddings
        await sendEvent('progress', {
          step: 'embedding_model',
          message: 'Inicializando modelo de embeddings...',
        });
        const embeddings = getEmbeddingsModel();

        const processedRoutes = [];
        const errors = [];

        // Procesar cada ruta
        for (let i = 0; i < routes.length; i++) {
          const route = routes[i];
          const currentIndex = i + 1;

          await sendEvent('progress', {
            step: 'processing_route',
            message: `Procesando ruta ${currentIndex}/${routes.length}`,
            details: {
              current: currentIndex,
              total: routes.length,
              url: route.url,
            },
          });

          try {
            // Preparar texto para embedding
            const textToEmbed = `${route.title || ''} ${route.url} ${route.description}`.trim();
            
            if (!textToEmbed) {
              await sendEvent('progress', {
                step: 'route_skipped',
                message: `Ruta omitida: sin contenido`,
                details: { url: route.url },
              });
              errors.push({
                routeId: route._id,
                error: 'La ruta no tiene contenido para generar embedding'
              });
              continue;
            }

            // Generar embedding
            await sendEvent('progress', {
              step: 'generating_embedding',
              message: `Generando embedding para: ${route.url}`,
              details: { url: route.url },
            });
            const embedding = await embeddings.embedQuery(textToEmbed);

            // Generar ID único para Qdrant
            const qdrantId = route._id.toString();

            // Preparar metadata
            const metadata = {
              routeId: route._id.toString(),
              projectId: route.projectId.toString(),
              url: route.url,
              title: route.title || '',
              description: route.description || '',
              path: route.path || '',
              createdAt: route.createdAt?.toISOString(),
              updatedAt: route.updatedAt?.toISOString(),
            };

            // Guardar en Qdrant
            await sendEvent('progress', {
              step: 'saving_to_qdrant',
              message: `Guardando en Qdrant...`,
              details: { url: route.url },
            });
            await generateAndSaveEmbedding(qdrantId, textToEmbed, metadata);

            // Actualizar MongoDB
            route.id_vdb = qdrantId;
            await route.save();

            await sendEvent('progress', {
              step: 'route_completed',
              message: `✓ Ruta procesada exitosamente: ${route.url}`,
              details: {
                url: route.url,
                current: currentIndex,
                total: routes.length,
              },
            });

            processedRoutes.push({
              routeId: route._id,
              id_vdb: qdrantId,
              url: route.url,
            });
          } catch (error) {
            console.error(`Error procesando ruta ${route._id}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            
            await sendEvent('progress', {
              step: 'route_error',
              message: `✗ Error procesando: ${route.url}`,
              details: {
                url: route.url,
                error: errorMessage,
              },
            });

            errors.push({
              routeId: route._id,
              error: errorMessage,
            });
          }
        }

        // Enviar evento de finalización
        const endTime = new Date().toISOString();
        await sendEvent('complete', {
          message: 'Generación de embeddings completada',
          timestamp: endTime,
          result: {
            success: true,
            processed: processedRoutes.length,
            total: routes.length,
            routes: processedRoutes,
            errors: errors.length > 0 ? errors : undefined,
          },
          metadata: {
            startTime,
            endTime,
            processedCount: processedRoutes.length,
            totalCount: routes.length,
            errorCount: errors.length,
          },
        });

        await writer.close();
      } catch (error) {
        console.error('Error en generación de embeddings:', error);
        await sendEvent('error', {
          error: 'Error durante la generación de embeddings',
          details: error instanceof Error ? error.message : 'Error desconocido',
          timestamp: new Date().toISOString(),
        });
        await writer.close();
      }
    })();

    // Retornar la respuesta con el stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error en POST /api/routes/embeddings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/routes/embeddings
 * Busca rutas similares usando embeddings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query) {
      return NextResponse.json(
        { error: 'El parámetro query es requerido' },
        { status: 400 }
      );
    }

    // Buscar usando la utilidad
    const results = await searchSimilarRoutes(query, projectId || undefined, limit);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error en GET /api/routes/embeddings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
