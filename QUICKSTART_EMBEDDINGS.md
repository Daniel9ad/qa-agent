# 🚀 Guía Rápida: Embeddings con Qdrant

## ✅ Configuración Completada

Ya se ha integrado exitosamente Qdrant para almacenar embeddings de las rutas del proyecto.

### Archivos Modificados:
- ✅ `src/models/Route.ts` - Agregado campo `id_vdb`
- ✅ `src/app/api/routes/embeddings/route.ts` - Endpoint para generar y buscar embeddings
- ✅ `src/app/(dashboard)/context/page.tsx` - Botón "Generar Embeddings" agregado
- ✅ `src/lib/qdrant.ts` - Utilidades para trabajar con Qdrant
- ✅ `.env.example` - Agregada variable `QDRANT_URL`

## 🎯 Cómo Usar

### 1. Configurar Variables de Entorno

Crea o edita tu archivo `.env`:

```bash
# Qdrant
QDRANT_URL=http://localhost:8080

# Google API (para embeddings)
GOOGLE_API_KEY=tu_api_key_aqui
```

### 2. Verificar Qdrant

Tu contenedor Docker ya está corriendo en:
- **API REST**: http://localhost:8080
- **gRPC**: http://localhost:8081

Para verificar la conexión:

```bash
npm run test:qdrant
```

### 3. Usar desde la Interfaz Web

1. **Iniciar el servidor**:
   ```bash
   npm run dev
   ```

2. **Navegar a Contexto de Vistas**:
   - Ve a http://localhost:3000/context

3. **Escanear Rutas**:
   - Selecciona un proyecto
   - Haz clic en **"Escanear"** para obtener rutas del sitio web

4. **Generar Embeddings**:
   - Una vez que tengas rutas, haz clic en **"Generar Embeddings"** (botón naranja con ícono de base de datos)
   - Verás un contador de progreso: "X de Y rutas con embeddings generados"
   - Las rutas con embeddings mostrarán un badge verde "Generado"
   - Las rutas sin embeddings mostrarán un badge naranja "Pendiente"

### 4. Búsqueda Semántica (API)

Usa el endpoint GET para buscar rutas similares:

```javascript
// Ejemplo: Buscar rutas relacionadas con "página de inicio"
const response = await fetch(
  '/api/routes/embeddings?query=página de inicio&projectId=123&limit=5'
);
const data = await response.json();
console.log(data.results);
```

## 📊 Estado Visual

La interfaz muestra:
- **Contador de embeddings**: "X de Y rutas con embeddings generados"
- **Badge verde**: Ruta con embedding generado
- **Badge naranja**: Ruta pendiente de procesar

## 🔧 Comandos Útiles

```bash
# Probar conexión con Qdrant
npm run test:qdrant

# Ver logs de Qdrant
docker logs qdrant

# Reiniciar Qdrant
docker restart qdrant

# Ver contenedores corriendo
docker ps
```

## 🎨 Características

### ✅ Generación Incremental
- Solo procesa rutas que no tienen `id_vdb`
- No regenera embeddings existentes
- Proceso eficiente y rápido

### ✅ Búsqueda Inteligente
- Búsqueda semántica por contexto
- Filtrado por proyecto
- Resultados ordenados por relevancia (score)

### ✅ Metadata Completa
Cada embedding incluye:
- URL de la ruta
- Título y descripción
- Path
- IDs de ruta y proyecto
- Fechas de creación/actualización

## 🐛 Troubleshooting

### Error: "Cannot connect to Qdrant"
```bash
# Verificar que esté corriendo
docker ps | grep qdrant

# Si no está corriendo
docker start qdrant
```

### Error: "GOOGLE_API_KEY not found"
```bash
# Agregar a tu archivo .env
GOOGLE_API_KEY=tu_api_key_aqui
```

### Embeddings no se generan
1. Verifica que tengas rutas escaneadas
2. Verifica las variables de entorno
3. Revisa los logs del servidor Next.js
4. Ejecuta `npm run test:qdrant` para diagnosticar

## 📚 Documentación Adicional

- Ver `EMBEDDINGS_QDRANT.md` para documentación técnica completa
- Ver `src/lib/qdrant.ts` para funciones de utilidad disponibles

## 🎉 ¡Listo!

Ya puedes:
1. ✅ Escanear rutas de sitios web
2. ✅ Generar embeddings automáticamente
3. ✅ Buscar rutas por similitud semántica
4. ✅ Ver el estado de embeddings en tiempo real

---

**Próximos pasos sugeridos:**
- Implementar búsqueda semántica en la interfaz
- Agregar filtros avanzados de búsqueda
- Crear dashboard de estadísticas de embeddings
- Implementar actualizaciones automáticas de embeddings cuando cambian las rutas
