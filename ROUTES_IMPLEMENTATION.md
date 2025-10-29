# Implementación del Modelo Route y Herramientas de Gestión

## Resumen

Se ha implementado exitosamente:

1. **Modelo Route**: Nueva colección en MongoDB para almacenar rutas de aplicaciones web
2. **Relación con Project**: Un proyecto tiene muchas rutas, una ruta pertenece a un proyecto
3. **Herramientas del Agente**: Tres nuevas herramientas para el `context-analyzer-agent`
4. **API REST**: Endpoints completos para operaciones CRUD sobre rutas

---

## 1. Modelo Route (`src/models/Route.ts`)

### Campos:
- **projectId**: Referencia al proyecto (ObjectId, required, indexed)
- **url**: URL de la ruta (String, required, max 500 caracteres)
- **explored**: Estado de exploración (Boolean, default: false)
- **description**: Descripción de la ruta (String, max 1000 caracteres)
- **createdAt/updatedAt**: Timestamps automáticos

### Características:
- Índice compuesto único: `(projectId, url)` - previene rutas duplicadas por proyecto
- Relación inversa en Project mediante virtual `routes`

### Ejemplo de uso:
```typescript
import Route from '@/models/Route';

// Crear ruta
const route = await Route.create({
  projectId: '507f1f77bcf86cd799439011',
  url: '/dashboard',
  description: 'Panel principal de administración',
  explored: false
});

// Consultar rutas de un proyecto
const routes = await Route.find({ projectId: projectId })
  .populate('projectId', 'name url');
```

---

## 2. Actualización del Modelo Project

Se agregó un virtual `routes` que permite obtener todas las rutas asociadas:

```typescript
const project = await Project.findById(projectId).populate('routes');
console.log(project.routes); // Array de rutas del proyecto
```

---

## 3. Herramientas del Context Analyzer Agent

### 3.1. `create_route` - Crear Rutas
**Archivo**: `src/agents/context-analyzer-agent/tools/createRouteCreationTool.ts`

**Parámetros**:
- `projectId` (string, required): ID del proyecto
- `url` (string, required): URL de la ruta
- `description` (string, optional): Descripción
- `explored` (boolean, optional): Estado de exploración

**Funcionalidad**:
- Verifica que el proyecto existe
- Previene duplicados
- Crea la ruta en MongoDB
- Retorna información completa de la ruta creada

**Ejemplo de uso por el agente**:
```typescript
await agent.tools.create_route({
  projectId: "507f1f77bcf86cd799439011",
  url: "/api/users",
  description: "Endpoint para gestión de usuarios",
  explored: false
});
```

---

### 3.2. `list_routes` - Listar Rutas
**Archivo**: `src/agents/context-analyzer-agent/tools/createRouteListTool.ts`

**Parámetros**:
- `projectId` (string, required): ID del proyecto
- `explored` (enum, optional): "true" | "false" | "all" (default: "all")
- `limit` (number, optional): Número máximo de resultados (default: 50)

**Funcionalidad**:
- Lista rutas de un proyecto
- Filtra por estado de exploración
- Incluye estadísticas (total, exploradas, no exploradas)
- Ordena por fecha de creación (más reciente primero)

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "project": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Mi Aplicación Web",
    "url": "https://miapp.com"
  },
  "statistics": {
    "total": 15,
    "explored": 8,
    "unexplored": 7
  },
  "routes": [
    {
      "id": "507f1f77bcf86cd799439012",
      "url": "/dashboard",
      "description": "Panel principal",
      "explored": true,
      "createdAt": "2025-10-28T10:30:00.000Z"
    }
  ],
  "count": 15
}
```

---

### 3.3. `update_route` - Actualizar Rutas
**Archivo**: `src/agents/context-analyzer-agent/tools/createRouteUpdateTool.ts`

**Parámetros**:
- `routeId` (string, required): ID de la ruta
- `explored` (boolean, optional): Nuevo estado
- `description` (string, optional): Nueva descripción
- `url` (string, optional): Nueva URL

**Funcionalidad**:
- Actualiza campos específicos de una ruta
- Verifica que la ruta existe
- Ejecuta validadores del schema
- Retorna la ruta actualizada con cambios aplicados

**Ejemplo de uso**:
```typescript
await agent.tools.update_route({
  routeId: "507f1f77bcf86cd799439012",
  explored: true,
  description: "Panel principal - completamente explorado"
});
```

---

## 4. API REST Endpoints

### 4.1. GET `/api/routes`
Obtener todas las rutas o filtrar por proyecto

**Query Parameters**:
- `projectId` (optional): Filtrar por proyecto
- `explored` (optional): "true" | "false"

**Respuesta**:
```json
{
  "success": true,
  "routes": [...],
  "count": 10
}
```

---

### 4.2. POST `/api/routes`
Crear una nueva ruta

**Body**:
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "url": "/products",
  "description": "Catálogo de productos",
  "explored": false
}
```

**Respuesta** (201):
```json
{
  "success": true,
  "message": "Ruta creada exitosamente",
  "route": {...}
}
```

---

### 4.3. GET `/api/routes/[id]`
Obtener una ruta específica

**Respuesta**:
```json
{
  "success": true,
  "route": {
    "_id": "...",
    "projectId": {...},
    "url": "/products",
    "description": "Catálogo de productos",
    "explored": false
  }
}
```

---

### 4.4. PATCH `/api/routes/[id]`
Actualizar una ruta

**Body** (campos opcionales):
```json
{
  "url": "/products/new",
  "description": "Nueva descripción",
  "explored": true
}
```

---

### 4.5. DELETE `/api/routes/[id]`
Eliminar una ruta

**Respuesta**:
```json
{
  "success": true,
  "message": "Ruta eliminada exitosamente"
}
```

---

## 5. Configuración del Agente

El agente `context-analyzer-agent` ahora tiene 6 herramientas:

1. ✅ `analyze_context` - Análisis de contexto
2. ✅ `search_information` - Búsqueda de información
3. ✅ `process_data` - Procesamiento de datos
4. ✅ **`create_route`** - Crear rutas (NUEVO)
5. ✅ **`list_routes`** - Listar rutas (NUEVO)
6. ✅ **`update_route`** - Actualizar rutas (NUEVO)

Las herramientas están habilitadas por defecto en `defaultContextAnalyzerConfig`.

---

## 6. Casos de Uso

### Caso 1: Exploración Automática de una App Web
```typescript
// El agente puede usar Playwright MCP para navegar la app
// y registrar automáticamente las rutas que encuentra

// 1. Listar rutas no exploradas
const routes = await agent.tools.list_routes({
  projectId: "...",
  explored: "false"
});

// 2. Para cada ruta, explorarla con Playwright
// 3. Crear nuevas rutas descubiertas
await agent.tools.create_route({
  projectId: "...",
  url: "/nueva-ruta-encontrada",
  description: "Descripción generada automáticamente"
});

// 4. Marcar como explorada
await agent.tools.update_route({
  routeId: "...",
  explored: true,
  description: "Explorada completamente - contiene formulario de login"
});
```

---

### Caso 2: Análisis de Cobertura
```typescript
// Obtener estadísticas de exploración
const result = await agent.tools.list_routes({
  projectId: "...",
  explored: "all"
});

// result.statistics = { total: 20, explored: 15, unexplored: 5 }
// Cobertura: 75%
```

---

### Caso 3: Documentación Automática
```typescript
// El agente puede generar documentación de la estructura
// de rutas de una aplicación web

const allRoutes = await agent.tools.list_routes({
  projectId: "..."
});

// Generar un mapa del sitio con descripciones
```

---

## 7. Seguridad

- ✅ Todos los endpoints requieren autenticación (NextAuth)
- ✅ Validación de datos con Mongoose validators
- ✅ Índice único previene duplicados
- ✅ Límites de longitud en campos de texto
- ✅ Manejo de errores consistente

---

## 8. Próximos Pasos Sugeridos

1. **Dashboard de Rutas**: Crear una página en el dashboard para visualizar y gestionar rutas
2. **Visualización de Grafo**: Mostrar las rutas como un grafo interactivo
3. **Exportar Sitemap**: Generar sitemap.xml desde las rutas
4. **Tests Automáticos**: Crear tests E2E para las rutas registradas
5. **Métricas**: Agregar métricas de performance por ruta

---

## Archivos Creados/Modificados

### Nuevos Archivos:
1. `src/models/Route.ts`
2. `src/agents/context-analyzer-agent/tools/createRouteCreationTool.ts`
3. `src/agents/context-analyzer-agent/tools/createRouteListTool.ts`
4. `src/agents/context-analyzer-agent/tools/createRouteUpdateTool.ts`
5. `src/app/api/routes/route.ts`
6. `src/app/api/routes/[id]/route.ts`

### Archivos Modificados:
1. `src/models/Project.ts` - Agregado virtual `routes`
2. `src/agents/context-analyzer-agent/context-analyzer-agent.ts` - Agregadas 3 nuevas herramientas

---

## Ejemplo Completo de Flujo

```typescript
// 1. Crear un proyecto
const project = await Project.create({
  name: "Mi App Web",
  url: "https://miapp.com"
});

// 2. El agente crea rutas mientras explora
await agent.run(`Explora la aplicación ${project.url} y registra todas las rutas que encuentres`);

// El agente internamente usará:
// - create_route: para registrar cada ruta descubierta
// - list_routes: para verificar qué rutas ya exploró
// - update_route: para marcar rutas como exploradas

// 3. Consultar el progreso
const progress = await Route.aggregate([
  { $match: { projectId: project._id } },
  { $group: {
    _id: null,
    total: { $sum: 1 },
    explored: { $sum: { $cond: ["$explored", 1, 0] } }
  }}
]);

console.log(`Progreso: ${progress[0].explored}/${progress[0].total} rutas exploradas`);
```

---

## Conclusión

La implementación está completa y lista para usar. El agente `context-analyzer-agent` ahora puede:
- ✅ Crear rutas automáticamente durante la exploración
- ✅ Listar y filtrar rutas por estado
- ✅ Actualizar información y marcar rutas como exploradas
- ✅ Gestionar la relación entre proyectos y sus rutas

El sistema está preparado para ser la base de un sistema de QA automatizado que puede explorar y documentar aplicaciones web completas.
