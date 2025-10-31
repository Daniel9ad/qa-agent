import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

/**
 * Cliente singleton para Qdrant
 */
export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:8080',
});

/**
 * Nombre de la colección de embeddings de rutas
 */
export const ROUTES_COLLECTION = 'routes_embeddings';

/**
 * Tamaño del vector de embeddings (Google text-embedding-004)
 */
export const VECTOR_SIZE = 768;

/**
 * Instancia del modelo de embeddings
 */
export const getEmbeddingsModel = () => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY no está configurada en las variables de entorno');
  }
  
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'text-embedding-004',
  });
};

/**
 * Crea la colección de rutas si no existe
 */
export async function ensureRoutesCollection() {
  try {
    await qdrantClient.getCollection(ROUTES_COLLECTION);
  } catch (error) {
    // La colección no existe, crearla
    await qdrantClient.createCollection(ROUTES_COLLECTION, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
  }
}

/**
 * Busca rutas similares usando embeddings
 * @param query Texto de búsqueda
 * @param projectId (Opcional) ID del proyecto para filtrar resultados
 * @param limit Número máximo de resultados
 */
export async function searchSimilarRoutes(
  query: string,
  projectId?: string,
  limit: number = 5
) {
  const embeddings = getEmbeddingsModel();
  const queryEmbedding = await embeddings.embedQuery(query);

  const filter = projectId
    ? {
        must: [
          {
            key: 'projectId',
            match: { value: projectId },
          },
        ],
      }
    : undefined;

  const results = await qdrantClient.search(ROUTES_COLLECTION, {
    vector: queryEmbedding,
    limit,
    filter,
    with_payload: true,
  });

  return results.map((result) => ({
    score: result.score,
    ...result.payload,
  }));
}

/**
 * Convierte un string (como ObjectId) a un número único para usar como ID en Qdrant
 * @param str String a convertir
 */
function stringToNumericId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Asegurar que sea positivo
  return Math.abs(hash);
}

/**
 * Genera y guarda un embedding para una ruta
 * @param routeId ID de la ruta en MongoDB
 * @param text Texto para generar el embedding
 * @param metadata Metadata adicional
 */
export async function generateAndSaveEmbedding(
  routeId: string,
  text: string,
  metadata: Record<string, any>
) {
  const embeddings = getEmbeddingsModel();
  const embedding = await embeddings.embedQuery(text);

  // Convertir el routeId (string) a un ID numérico para Qdrant
  const numericId = stringToNumericId(routeId);

  await qdrantClient.upsert(ROUTES_COLLECTION, {
    wait: true,
    points: [
      {
        id: numericId,
        vector: embedding,
        payload: {
          ...metadata,
          // Guardar el routeId original en el payload
          originalRouteId: routeId,
        },
      },
    ],
  });

  return routeId;
}

/**
 * Elimina un embedding de Qdrant
 * @param routeId ID de la ruta
 */
export async function deleteEmbedding(routeId: string) {
  const numericId = stringToNumericId(routeId);
  await qdrantClient.delete(ROUTES_COLLECTION, {
    wait: true,
    points: [numericId],
  });
}

/**
 * Actualiza el embedding de una ruta
 * @param routeId ID de la ruta
 * @param text Nuevo texto para generar el embedding
 * @param metadata Nueva metadata
 */
export async function updateEmbedding(
  routeId: string,
  text: string,
  metadata: Record<string, any>
) {
  return await generateAndSaveEmbedding(routeId, text, metadata);
}

/**
 * Obtiene información de la colección
 */
export async function getCollectionInfo() {
  return await qdrantClient.getCollection(ROUTES_COLLECTION);
}

/**
 * Cuenta el número total de embeddings
 */
export async function countEmbeddings(projectId?: string) {
  const filter = projectId
    ? {
        must: [
          {
            key: 'projectId',
            match: { value: projectId },
          },
        ],
      }
    : undefined;

  const result = await qdrantClient.count(ROUTES_COLLECTION, {
    filter,
  });

  return result.count;
}
