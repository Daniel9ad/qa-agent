# Integración con Qdrant - Base de Datos Vectorial

Este documento explica cómo funciona la integración con Qdrant para almacenar y buscar embeddings de las rutas del proyecto.

## 🎯 Propósito

Los embeddings permiten:
- Búsqueda semántica de rutas similares
- Encontrar rutas relacionadas por contexto
- Mejorar la comprensión del agente sobre la estructura del sitio

## 🚀 Configuración

### 1. Qdrant con Docker

Tu configuración de Docker ya está lista:

```bash
# El contenedor está corriendo en:
# - Puerto 6333 (interno) -> 8080 (externo) - API REST
# - Puerto 6334 (interno) -> 8081 (externo) - gRPC
```

### 2. Variables de Entorno

Agrega a tu archivo `.env`:

```bash
QDRANT_URL=http://localhost:8080
GOOGLE_API_KEY=tu_api_key_de_google
```

### 3. Modelo de Embeddings

Utilizamos **Google Generative AI Embeddings** con el modelo `text-embedding-004`:
- Vector size: 768 dimensiones
- Métrica de distancia: Cosine Similarity

## 📊 Estructura de Datos

### Modelo Route (MongoDB)

El modelo `Route` ahora incluye el campo `id_vdb`:

```typescript
interface IRoute {
  projectId: ObjectId;
  path: string;
  url: string;
  title?: string;
  description: string;
  id_vdb?: string; // ID en Qdrant
  createdAt: Date;
  updatedAt: Date;
}
```

### Colección en Qdrant

**Nombre:** `routes_embeddings`

**Payload (metadata):**
```json
{
  "routeId": "mongodb_object_id",
  "projectId": "project_object_id",
  "url": "https://example.com/page",
  "title": "Título de la página",
  "description": "Descripción detallada...",
  "path": "/page",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 API Endpoints

### POST /api/routes/embeddings

Genera embeddings para todas las rutas de un proyecto que aún no los tienen.

**Request:**
```json
{
  "projectId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Embeddings generados exitosamente",
  "processed": 10,
  "total": 10,
  "routes": [
    {
      "routeId": "507f1f77bcf86cd799439011",
      "id_vdb": "507f1f77bcf86cd799439011",
      "url": "https://example.com/page"
    }
  ],
  "errors": []
}
```

### GET /api/routes/embeddings

Busca rutas similares usando embeddings.

**Query Parameters:**
- `query` (required): Texto de búsqueda
- `projectId` (optional): Filtrar por proyecto
- `limit` (optional): Número de resultados (default: 5)

**Ejemplo:**
```
GET /api/routes/embeddings?query=página de inicio&projectId=507f1f77bcf86cd799439011&limit=5
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "score": 0.95,
      "routeId": "507f1f77bcf86cd799439011",
      "url": "https://example.com/home",
      "title": "Página de Inicio",
      "description": "Página principal del sitio...",
      "projectId": "507f1f77bcf86cd799439011"
    }
  ]
}
```

## 💻 Uso desde la Interfaz

### Generar Embeddings

1. Ve a la página **Contexto de Vistas**
2. Asegúrate de tener rutas escaneadas en el proyecto
3. Haz clic en el botón **"Generar Embeddings"** (ícono de base de datos)
4. El sistema procesará todas las rutas que no tienen embeddings
5. Verás una notificación con el resultado

### Características del Botón

- Se deshabilita si no hay proyecto seleccionado
- Se deshabilita si no hay rutas disponibles
- Muestra un spinner mientras procesa
- Solo procesa rutas que no tienen `id_vdb`

## 🔍 Búsqueda Semántica

Para usar la búsqueda semántica, puedes hacer peticiones al endpoint GET:

```javascript
const response = await fetch(
  `/api/routes/embeddings?query=${encodeURIComponent(searchText)}&projectId=${projectId}&limit=10`
);
const data = await response.json();
console.log(data.results); // Rutas similares ordenadas por relevancia
```

## 🎨 Flujo de Trabajo

1. **Escanear Rutas**: Usa el botón "Escanear" para obtener rutas del sitio
2. **Generar Embeddings**: Haz clic en "Generar Embeddings" para procesar las rutas
3. **Búsqueda Inteligente**: Las rutas con embeddings pueden ser encontradas por similitud semántica
4. **Actualizaciones Incrementales**: Solo se procesan las rutas nuevas (sin `id_vdb`)

## 🛠️ Troubleshooting

### Error: "Cannot connect to Qdrant"

Verifica que el contenedor de Docker esté corriendo:
```bash
docker ps | grep qdrant
```

Si no está corriendo, inícialo:
```bash
docker start qdrant
```

### Error: "GOOGLE_API_KEY not found"

Asegúrate de tener la variable de entorno configurada en tu archivo `.env`:
```bash
GOOGLE_API_KEY=tu_api_key_aqui
```

### La colección no existe

La colección se crea automáticamente la primera vez que generas embeddings. Si necesitas crearla manualmente:

```typescript
await qdrantClient.createCollection('routes_embeddings', {
  vectors: {
    size: 768,
    distance: 'Cosine',
  },
});
```

## 📈 Métricas y Rendimiento

- **Tiempo de generación**: ~1-2 segundos por ruta (depende de la API de Google)
- **Tamaño del embedding**: 768 dimensiones × 4 bytes = ~3KB por ruta
- **Búsqueda**: Subsegundo para miles de vectores

## 🔐 Seguridad

- Las rutas solo son accesibles por proyecto
- Los embeddings se filtran por `projectId` en las búsquedas
- La API valida que el usuario tenga acceso al proyecto (implementar según tu sistema de autenticación)

## 📚 Referencias

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Google Generative AI Embeddings](https://ai.google.dev/docs/embeddings_guide)
- [LangChain Embeddings](https://js.langchain.com/docs/modules/data_connection/text_embedding/)
