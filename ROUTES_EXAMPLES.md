# Ejemplos de Uso - Routes

Este documento contiene ejemplos prácticos de cómo usar el modelo Route y sus herramientas.

## 1. Usando las APIs REST

### Crear un Proyecto y sus Rutas

```typescript
// 1. Crear un proyecto
const projectResponse = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mi Tienda Online',
    url: 'https://mitienda.com'
  })
});

const { data: project } = await projectResponse.json();
console.log('Proyecto creado:', project._id);

// 2. Crear rutas para el proyecto
const routes = [
  { url: '/', description: 'Página de inicio' },
  { url: '/productos', description: 'Catálogo de productos' },
  { url: '/carrito', description: 'Carrito de compras' },
  { url: '/checkout', description: 'Proceso de pago' },
  { url: '/perfil', description: 'Perfil del usuario' }
];

for (const route of routes) {
  await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: project._id,
      url: route.url,
      description: route.description,
      explored: false
    })
  });
}
```

### Listar Rutas de un Proyecto

```typescript
// Obtener todas las rutas de un proyecto
const response = await fetch(`/api/routes?projectId=${projectId}`);
const { routes, count } = await response.json();

console.log(`Total de rutas: ${count}`);
routes.forEach(route => {
  console.log(`${route.explored ? '✓' : '○'} ${route.url} - ${route.description}`);
});

// Obtener solo rutas no exploradas
const unexploredResponse = await fetch(
  `/api/routes?projectId=${projectId}&explored=false`
);
const { routes: unexplored } = await unexploredResponse.json();
console.log(`Rutas pendientes: ${unexplored.length}`);
```

### Actualizar una Ruta

```typescript
// Marcar una ruta como explorada
await fetch(`/api/routes/${routeId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    explored: true,
    description: 'Ruta explorada completamente - contiene 3 formularios y 5 botones'
  })
});
```

---

## 2. Usando el Agente Context Analyzer

### Ejemplo 1: Crear Rutas con el Agente

```typescript
import { ContextAnalyzerAgent } from '@/agents/context-analyzer-agent/context-analyzer-agent';

const agent = new ContextAnalyzerAgent();
agent.initializeModel(process.env.GOOGLE_API_KEY);

// El agente puede crear rutas automáticamente
const result = await agent.run(`
  Crea las siguientes rutas para el proyecto con ID "67890abc":
  
  1. /admin - Panel de administración
  2. /admin/users - Gestión de usuarios
  3. /admin/products - Gestión de productos
  4. /admin/orders - Gestión de pedidos
  5. /api/v1/users - API de usuarios
  6. /api/v1/products - API de productos
`);

console.log(result);
```

### Ejemplo 2: Exploración Automatizada

```typescript
const agent = new ContextAnalyzerAgent();
agent.initializeModel(process.env.GOOGLE_API_KEY);

// El agente lista rutas, las explora, y las actualiza
const result = await agent.run(`
  Para el proyecto con ID "67890abc":
  
  1. Lista todas las rutas no exploradas
  2. Para cada ruta, simula una exploración y actualiza su descripción
  3. Marca cada ruta como explorada después de procesarla
  4. Genera un reporte final con estadísticas
`);

// El agente usará internamente:
// - list_routes: para obtener rutas no exploradas
// - update_route: para actualizar cada ruta
console.log(result);
```

### Ejemplo 3: Análisis de Cobertura

```typescript
const agent = new ContextAnalyzerAgent();
agent.initializeModel(process.env.GOOGLE_API_KEY);

const result = await agent.run(`
  Analiza la cobertura de exploración del proyecto "67890abc":
  
  1. Lista todas las rutas del proyecto
  2. Calcula el porcentaje de rutas exploradas
  3. Identifica las rutas más importantes que faltan explorar
  4. Genera un reporte con recomendaciones
`);

console.log(result);
```

---

## 3. Usando Mongoose Directamente

### Operaciones Básicas

```typescript
import Route from '@/models/Route';
import Project from '@/models/Project';
import connectDB from '@/lib/mongodb';

await connectDB();

// Crear una ruta
const route = await Route.create({
  projectId: '507f1f77bcf86cd799439011',
  url: '/dashboard',
  description: 'Panel principal de administración',
  explored: false
});

// Obtener todas las rutas de un proyecto
const routes = await Route.find({ projectId: projectId })
  .sort({ createdAt: -1 });

// Contar rutas exploradas
const exploredCount = await Route.countDocuments({
  projectId: projectId,
  explored: true
});

// Actualizar una ruta
await Route.findByIdAndUpdate(routeId, {
  explored: true,
  description: 'Actualizada con más detalles'
});

// Eliminar una ruta
await Route.findByIdAndDelete(routeId);
```

### Queries Avanzados

```typescript
// Obtener proyecto con todas sus rutas
const project = await Project.findById(projectId)
  .populate('routes');

console.log(`Proyecto: ${project.name}`);
console.log(`Total de rutas: ${project.routes.length}`);

// Buscar rutas por patrón de URL
const apiRoutes = await Route.find({
  projectId: projectId,
  url: { $regex: '^/api/', $options: 'i' }
});

// Estadísticas agregadas
const stats = await Route.aggregate([
  { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
  {
    $group: {
      _id: '$explored',
      count: { $sum: 1 },
      avgDescriptionLength: { $avg: { $strLenCP: '$description' } }
    }
  }
]);

console.log('Estadísticas:', stats);
```

---

## 4. Integración con Playwright MCP

### Exploración Automática de una App Web

```typescript
// El agente puede combinar las herramientas de Route con Playwright MCP
const agent = new ContextAnalyzerAgent();
agent.initializeModel(process.env.GOOGLE_API_KEY);

const result = await agent.run(`
  Explora la aplicación web del proyecto "67890abc" (https://miapp.com):
  
  1. Navega a la URL del proyecto usando Playwright
  2. Descubre todas las rutas accesibles desde la página principal
  3. Para cada ruta encontrada:
     a. Verifica si ya existe en la base de datos con list_routes
     b. Si no existe, créala con create_route
     c. Navega a la ruta y analiza su contenido
     d. Actualiza la descripción con lo que encontraste
     e. Marca la ruta como explorada con update_route
  4. Genera un sitemap completo de la aplicación
`);

// El agente coordinará automáticamente:
// - Playwright MCP: para navegación y exploración
// - list_routes: para verificar rutas existentes
// - create_route: para registrar nuevas rutas
// - update_route: para marcar como exploradas
```

---

## 5. Casos de Uso Completos

### Caso 1: Sistema de Testing Automatizado

```typescript
// Script que el agente podría ejecutar
async function runAutomatedTests(projectId: string) {
  const agent = new ContextAnalyzerAgent();
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  
  const result = await agent.run(`
    Sistema de testing para proyecto ${projectId}:
    
    1. Lista todas las rutas con explored=true
    2. Para cada ruta explorada:
       - Navega a la ruta con Playwright
       - Verifica que se carga correctamente (status 200)
       - Toma un screenshot
       - Busca errores en la consola
       - Verifica que todos los links funcionan
    3. Genera un reporte de testing con:
       - Rutas que pasaron todas las pruebas
       - Rutas con errores
       - Screenshots de cada ruta
       - Tiempo total de ejecución
  `);
  
  return result;
}
```

### Caso 2: Generación de Documentación

```typescript
async function generateProjectDocumentation(projectId: string) {
  const agent = new ContextAnalyzerAgent();
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  
  const result = await agent.run(`
    Genera documentación completa para el proyecto ${projectId}:
    
    1. Lista todas las rutas del proyecto
    2. Agrupa las rutas por categoría:
       - Rutas públicas (/, /about, /contact)
       - Rutas de autenticación (/login, /register)
       - Rutas protegidas (/dashboard, /profile)
       - Rutas de API (/api/*)
       - Rutas de administración (/admin/*)
    3. Para cada categoría, genera:
       - Lista de rutas con descripción
       - Parámetros esperados
       - Nivel de acceso requerido
       - Estado de implementación (explorada o no)
    4. Crea un diagrama de navegación
    5. Exporta todo en formato Markdown
  `);
  
  return result;
}
```

### Caso 3: Monitoreo de Cambios

```typescript
async function monitorProjectChanges(projectId: string) {
  const agent = new ContextAnalyzerAgent();
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  
  const result = await agent.run(`
    Monitorea cambios en el proyecto ${projectId}:
    
    1. Lista todas las rutas existentes
    2. Navega a la aplicación y descubre rutas actuales
    3. Compara las rutas descubiertas con las registradas:
       - Identifica rutas nuevas (no registradas)
       - Identifica rutas eliminadas (registradas pero no existen)
       - Identifica rutas modificadas (diferente contenido)
    4. Actualiza la base de datos:
       - Crea rutas nuevas
       - Marca rutas eliminadas con explored=false
       - Actualiza descripciones de rutas modificadas
    5. Genera un reporte de cambios
  `);
  
  return result;
}
```

---

## 6. Scripts de Utilidad

### Script: Inicializar Proyecto con Rutas Comunes

```typescript
// scripts/seed-routes.ts
import Route from '@/models/Route';
import Project from '@/models/Project';
import connectDB from '@/lib/mongodb';

async function seedCommonRoutes(projectId: string, baseUrl: string) {
  await connectDB();
  
  const commonRoutes = [
    // Rutas públicas
    { url: '/', description: 'Página de inicio', explored: false },
    { url: '/about', description: 'Acerca de', explored: false },
    { url: '/contact', description: 'Contacto', explored: false },
    { url: '/pricing', description: 'Precios', explored: false },
    
    // Autenticación
    { url: '/login', description: 'Inicio de sesión', explored: false },
    { url: '/register', description: 'Registro', explored: false },
    { url: '/forgot-password', description: 'Recuperar contraseña', explored: false },
    
    // Dashboard
    { url: '/dashboard', description: 'Panel principal', explored: false },
    { url: '/settings', description: 'Configuración', explored: false },
    { url: '/profile', description: 'Perfil de usuario', explored: false },
  ];
  
  for (const route of commonRoutes) {
    try {
      await Route.create({
        projectId,
        url: route.url,
        description: route.description,
        explored: route.explored
      });
      console.log(`✓ Creada ruta: ${route.url}`);
    } catch (error) {
      console.log(`✗ Error creando ruta ${route.url}:`, error.message);
    }
  }
  
  console.log(`\n✓ Rutas inicializadas para proyecto ${projectId}`);
}

// Uso
// seedCommonRoutes('67890abc', 'https://miapp.com');
```

### Script: Generar Sitemap XML

```typescript
// scripts/generate-sitemap.ts
import Route from '@/models/Route';
import Project from '@/models/Project';
import connectDB from '@/lib/mongodb';
import fs from 'fs';

async function generateSitemap(projectId: string, outputPath: string) {
  await connectDB();
  
  const project = await Project.findById(projectId);
  const routes = await Route.find({ projectId, explored: true })
    .sort({ url: 1 });
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${project.url}${route.url}</loc>
    <lastmod>${route.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
  
  fs.writeFileSync(outputPath, sitemap);
  console.log(`✓ Sitemap generado: ${outputPath}`);
  console.log(`  Total de rutas: ${routes.length}`);
}

// Uso
// generateSitemap('67890abc', './public/sitemap.xml');
```

---

## 7. Testing

### Test de Integración

```typescript
// __tests__/routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Route from '@/models/Route';
import Project from '@/models/Project';
import connectDB from '@/lib/mongodb';

describe('Route Model', () => {
  let projectId: string;
  
  beforeAll(async () => {
    await connectDB();
    const project = await Project.create({
      name: 'Test Project',
      url: 'https://test.com'
    });
    projectId = project._id.toString();
  });
  
  it('should create a route', async () => {
    const route = await Route.create({
      projectId,
      url: '/test',
      description: 'Test route',
      explored: false
    });
    
    expect(route.url).toBe('/test');
    expect(route.explored).toBe(false);
  });
  
  it('should prevent duplicate routes', async () => {
    await Route.create({
      projectId,
      url: '/duplicate',
      description: 'First'
    });
    
    await expect(
      Route.create({
        projectId,
        url: '/duplicate',
        description: 'Second'
      })
    ).rejects.toThrow();
  });
  
  it('should list routes by project', async () => {
    const routes = await Route.find({ projectId });
    expect(routes.length).toBeGreaterThan(0);
  });
  
  afterAll(async () => {
    await Route.deleteMany({ projectId });
    await Project.findByIdAndDelete(projectId);
  });
});
```

---

## Conclusión

Estos ejemplos demuestran cómo integrar completamente el sistema de rutas en tu aplicación QA. El agente puede:

- ✅ Descubrir automáticamente rutas de una aplicación
- ✅ Registrar y organizar rutas en la base de datos
- ✅ Explorar cada ruta sistemáticamente
- ✅ Generar documentación y reportes
- ✅ Mantener un seguimiento del progreso de QA

El sistema está diseñado para ser flexible y extensible, permitiéndote agregar más funcionalidades según tus necesidades.
