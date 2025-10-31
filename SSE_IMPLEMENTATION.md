# Implementación de Server-Sent Events (SSE) para Monitoreo en Tiempo Real

## Descripción General

Se ha implementado Server-Sent Events (SSE) para permitir el monitoreo en tiempo real del proceso de escaneo de rutas. Esto permite que los usuarios vean el flujo completo de ejecución del agente mientras este trabaja.

## Archivos Modificados

### 1. Backend - Endpoint API (`src/app/api/agents/route-agent/route.ts`)

**Cambios principales:**
- Convertido de JSON response a SSE stream
- Implementa `ReadableStream` para enviar eventos en tiempo real
- Tipos de eventos emitidos:
  - `start`: Inicio del proceso
  - `progress`: Actualizaciones durante la ejecución
  - `complete`: Proceso completado con éxito
  - `error`: Errores durante la ejecución

**Formato de eventos SSE:**
```typescript
event: progress
data: {"step": "initialization", "message": "Inicializando modelo LLM..."}
```

### 2. Agente (`src/agents/route-agent/route-agent.ts`)

**Cambios principales:**
- Agregado callback `onProgress?: (event: any) => void`
- Emisión de eventos durante la ejecución:
  - `agent_start`: Inicio de ejecución del agente
  - `agent_iteration`: Cada iteración procesada
  - `tool_call`: Cuando se ejecuta una herramienta
  - `tool_response`: Respuesta de herramienta recibida
  - `agent_complete`: Ejecución completada
  - `agent_error`: Error durante ejecución

**Ejemplo de evento emitido:**
```typescript
this.onProgress?.({
  step: 'tool_call',
  message: 'Ejecutando herramienta: browser_navigate',
  details: {
    toolName: 'browser_navigate',
    args: { url: 'https://example.com' }
  }
});
```

### 3. Frontend - Página de Contexto (`src/app/(dashboard)/context/page.tsx`)

**Cambios principales:**
- Estado `progressEvents` para almacenar eventos recibidos
- Función `handleScan` actualizada para leer el stream SSE
- Auto-scroll automático al último evento usando `useRef`
- UI mejorada con:
  - Visualización en tiempo real de eventos
  - Colores diferentes según tipo de evento
  - Detalles expandibles (iteraciones, herramientas, argumentos)
  - Timestamps de cada evento

## Flujo de Datos

```
1. Usuario hace clic en "Escanear"
   ↓
2. Frontend envía POST a /api/agents/route-agent
   ↓
3. Endpoint crea ReadableStream y emite evento "start"
   ↓
4. RouteAgent se inicializa y ejecuta
   ↓
5. Durante ejecución:
   - RouteAgent.onProgress() emite eventos
   - Endpoint reenvía eventos vía SSE
   - Frontend recibe y muestra eventos en tiempo real
   ↓
6. Proceso termina:
   - Endpoint emite evento "complete" o "error"
   - Frontend actualiza UI final
   - Se recargan las rutas
```

## Tipos de Eventos

### Eventos del Endpoint

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `start` | Proceso iniciado | `{ message, timestamp }` |
| `progress` | Actualización de progreso | `{ step, message, details }` |
| `complete` | Proceso completado | `{ result, metadata, timestamp }` |
| `error` | Error ocurrido | `{ error, details, timestamp }` |

### Eventos del Agente (vía onProgress)

| Step | Descripción | Detalles |
|------|-------------|----------|
| `agent_start` | Inicio de ejecución | `{ messageCount }` |
| `agent_iteration` | Iteración procesada | `{ iteration, messageType, toolCalls }` |
| `tool_call` | Herramienta ejecutándose | `{ toolName, args }` |
| `tool_response` | Respuesta recibida | `{ content }` |
| `agent_complete` | Ejecución completada | `{ duration, iterations, messageCount }` |
| `agent_error` | Error en ejecución | `{ error }` |

## Visualización en el UI

### Colores por Tipo de Evento

- **Error** (`error`): Borde rojo, fondo rojo oscuro
- **Completado** (`complete`): Borde verde (#4ADE80), fondo verde oscuro
- **Tool Call** (`tool_call`): Borde naranja (#DEA154), fondo naranja oscuro
- **Otros**: Borde verde oscuro, fondo gris oscuro

### Información Mostrada

Cada evento muestra:
- Mensaje principal (coloreado según tipo)
- Timestamp (hora local)
- Detalles adicionales:
  - Número de iteración
  - Nombre de herramientas
  - Argumentos (JSON formateado)
  - Duración
  - Contenido de respuestas

## Beneficios

1. **Transparencia**: Los usuarios ven exactamente qué está haciendo el agente
2. **Debugging**: Facilita identificar problemas durante la ejecución
3. **UX mejorada**: Feedback continuo en lugar de esperar a que termine
4. **Monitoreo**: Permite ver el uso de herramientas y tiempos de ejecución

## Ejemplo de Uso

```typescript
// El usuario hace clic en "Escanear"
// Ver en tiempo real:
// ✓ Iniciando agente...
// ✓ Inicializando modelo LLM...
// ✓ Inicializando herramientas y MCP...
// ✓ Ejecutando agente...
// ↪ Procesando iteración 1...
// 🔧 Ejecutando herramienta: browser_navigate
// ↪ Procesando iteración 2...
// 🔧 Ejecutando herramienta: browser_snapshot
// ↪ Procesando iteración 3...
// 🔧 Ejecutando herramienta: create_route
// ✓ Proceso completado (45.32s)
```

## Próximas Mejoras

- [ ] Agregar filtros de eventos (mostrar solo errores, solo herramientas, etc.)
- [ ] Exportar log de eventos a archivo
- [ ] Gráficos de tiempo de ejecución por herramienta
- [ ] Pausar/reanudar el scroll automático
- [ ] Búsqueda en eventos
- [ ] Colapsar/expandir eventos individuales
