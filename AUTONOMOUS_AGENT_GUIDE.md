# 🤖 Guía del Agente Autónomo con Toma de Decisiones

## Descripción General

El **Context Analyzer Agent** ha sido mejorado para operar de forma autónoma, utilizando Google Gemini como cerebro para tomar decisiones sobre qué herramientas usar y cómo ejecutarlas. Este es un agente tipo **ReAct** (Reasoning + Acting) que combina razonamiento con ejecución de acciones.

## 🎯 Características Principales

### 1. **Razonamiento Autónomo**
El agente analiza la solicitud del usuario y decide:
- ¿Qué herramientas son necesarias?
- ¿En qué orden ejecutarlas?
- ¿Qué parámetros usar para cada herramienta?

### 2. **Planificación Dinámica**
Genera un plan de acción en formato JSON:
```json
{
  "reasoning": "El usuario quiere analizar una página web",
  "tools_to_use": [
    {
      "name": "browser_navigate",
      "reason": "Necesito abrir la URL proporcionada",
      "params": { "url": "https://example.com" }
    },
    {
      "name": "browser_snapshot",
      "reason": "Debo capturar el contenido de la página",
      "params": {}
    }
  ]
}
```

### 3. **Evaluación Continua**
Después de ejecutar herramientas, el agente evalúa:
- ¿Tengo suficiente información?
- ¿Necesito ejecutar más herramientas?
- ¿Puedo dar una respuesta al usuario?

### 4. **Síntesis Inteligente**
Al final, sintetiza toda la información recopilada en una respuesta coherente y útil para el usuario.

## 🏗️ Arquitectura del Flujo

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       v
┌─────────────────┐
│   REASONING     │ ← El agente analiza la solicitud
│                 │   y decide qué herramientas usar
└────────┬────────┘
         │
         v
┌─────────────────┐
│ EXECUTE_TOOLS   │ ← Ejecuta las herramientas según el plan
│                 │   (browser_navigate, analyze_context, etc.)
└────────┬────────┘
         │
         v
┌─────────────────┐
│ SHOULD_CONTINUE │ ← Evalúa si necesita más información
│                 │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    v         v
[Loop]     [Continue]
    │         │
    │         v
    │   ┌─────────────┐
    │   │ SYNTHESIZE  │ ← Genera respuesta final
    │   │             │
    │   └──────┬──────┘
    │          │
    │          v
    │      ┌───────┐
    └──────┤  END  │
           └───────┘
```

## 🛠️ Herramientas Disponibles

### Herramientas Base (Simuladas)
1. **analyze_context**: Análisis profundo del contexto
2. **search_information**: Búsqueda de información relevante
3. **process_data**: Procesamiento y estructuración de datos

### Herramientas MCP (Playwright)
Cuando está conectado a un servidor MCP:
- **browser_navigate**: Navegar a una URL
- **browser_snapshot**: Capturar el contenido de la página
- **browser_click**: Hacer clic en elementos
- **browser_type**: Escribir texto
- **browser_screenshot**: Tomar capturas de pantalla
- Y muchas más...

## 🚀 Cómo Usar

### 1. Configuración Básica

```typescript
import { ContextAnalyzerAgent } from './agents/implementations/context-analyzer-agent';

const agent = new ContextAnalyzerAgent({
  verbose: true,           // Ver logs detallados
  maxIterations: 5,        // Máximo de iteraciones
  temperature: 0.7,        // Creatividad del modelo
});

// Inicializar con API key de Google
agent.initializeModel(process.env.GOOGLE_API_KEY);
await agent.initialize();
```

### 2. Uso Simple

```typescript
// Consulta simple
const result = await agent.run(
  'Analiza el concepto de inteligencia artificial'
);

console.log(result.messages[result.messages.length - 1].content);
```

### 3. Uso con Navegación Web

```typescript
const agent = new ContextAnalyzerAgent({
  verbose: true,
  mcpServers: [
    {
      type: 'http',
      url: 'http://localhost:3001/sse', // Servidor MCP de Playwright
    },
  ],
});

agent.initializeModel(process.env.GOOGLE_API_KEY);
await agent.initialize();

// El agente decidirá usar browser_navigate y browser_snapshot
const result = await agent.run(
  'Visita https://www.wikipedia.org y analiza su contenido'
);
```

### 4. Consultas Complejas

```typescript
// El agente ejecutará múltiples herramientas en secuencia
const result = await agent.run(`
  Necesito un análisis completo sobre sistemas multi-agente:
  1. Analiza qué son
  2. Busca ejemplos de implementación
  3. Proporciona un resumen ejecutivo
`);
```

## 📊 Ejemplos de Decisiones del Agente

### Ejemplo 1: Análisis Simple
**Input**: "Explica qué es un agente inteligente"

**Decisión del Agente**:
```json
{
  "reasoning": "Consulta conceptual que requiere análisis básico",
  "tools_to_use": [
    {
      "name": "analyze_context",
      "reason": "Analizar el concepto en profundidad",
      "params": { "context": "agente inteligente", "depth": "detailed" }
    }
  ]
}
```

### Ejemplo 2: Navegación Web
**Input**: "Visita https://github.com y dime qué ves"

**Decisión del Agente**:
```json
{
  "reasoning": "URL detectada, necesito navegar y capturar contenido",
  "tools_to_use": [
    {
      "name": "browser_navigate",
      "reason": "Abrir la página web especificada",
      "params": { "url": "https://github.com" }
    },
    {
      "name": "browser_snapshot",
      "reason": "Capturar la estructura y contenido de la página",
      "params": {}
    }
  ]
}
```

### Ejemplo 3: Análisis Multi-Paso
**Input**: "Investiga sobre LangChain y sus aplicaciones prácticas"

**Decisión del Agente** (Primera Iteración):
```json
{
  "reasoning": "Investigación que requiere múltiples fuentes",
  "tools_to_use": [
    {
      "name": "analyze_context",
      "reason": "Analizar el concepto base de LangChain",
      "params": { "context": "LangChain framework", "depth": "detailed" }
    },
    {
      "name": "search_information",
      "reason": "Buscar casos de uso y aplicaciones",
      "params": { "query": "LangChain aplicaciones prácticas" }
    }
  ]
}
```

**Evaluación**: "¿Suficiente información?" → No
**Segunda Iteración**: Buscar más ejemplos específicos...

## 🎓 Ventajas del Enfoque Autónomo

### ✅ Flexibilidad
- No necesitas especificar qué herramientas usar
- El agente se adapta a diferentes tipos de consultas
- Maneja casos no previstos de forma inteligente

### ✅ Eficiencia
- Solo ejecuta las herramientas necesarias
- Evita ejecuciones redundantes
- Optimiza el orden de ejecución

### ✅ Escalabilidad
- Agregar nuevas herramientas MCP es automático
- El agente aprende a usar nuevas herramientas sin cambios de código
- Funciona con cualquier servidor MCP compatible

### ✅ Inteligencia
- Razona sobre problemas complejos
- Puede ejecutar planes multi-paso
- Aprende de los resultados y ajusta su estrategia

## 🔧 Configuración Avanzada

### Ajustar el Comportamiento del Agente

```typescript
const agent = new ContextAnalyzerAgent({
  // Control de verbosidad
  verbose: true,
  
  // Límite de iteraciones (evitar loops infinitos)
  maxIterations: 10,
  
  // Temperatura del modelo (0 = determinista, 1 = creativo)
  temperature: 0.7,
  
  // Modelo de Google Gemini a usar
  model: "gemini-2.5-flash", // o "gemini-pro"
  
  // Servidores MCP personalizados
  mcpServers: [
    {
      type: 'http',
      url: 'http://localhost:3001/sse',
    },
    {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-another'],
    },
  ],
});
```

### Personalizar Herramientas Base

Puedes modificar las herramientas simuladas en `src/agents/tools/simulated-tools.ts` o agregar nuevas herramientas personalizadas.

## 🧪 Ejecutar Tests

```bash
# Test de autonomía básica
npx tsx src/agents/test-autonomous-agent.ts

# Solo test de razonamiento
npx tsx -e "
  import { testBasicAutonomy } from './src/agents/test-autonomous-agent';
  testBasicAutonomy();
"

# Test con navegación web (requiere servidor MCP activo)
npx tsx -e "
  import { testWebNavigationAutonomy } from './src/agents/test-autonomous-agent';
  testWebNavigationAutonomy();
"
```

## 📝 Variables de Entorno

Crea un archivo `.env.local`:

```env
# Google AI API Key (REQUERIDO)
GOOGLE_API_KEY=tu_api_key_aqui

# URL del servidor MCP de Playwright (OPCIONAL)
PLAYWRIGHT_MCP_URL=http://localhost:3001/sse

# MongoDB (para persistencia)
MONGODB_URI=mongodb://localhost:27017/qa-agent
```

## 🚦 Solución de Problemas

### El agente no toma decisiones
- Verifica que `GOOGLE_API_KEY` esté configurada
- Asegúrate de llamar `agent.initializeModel(apiKey)` antes de `initialize()`
- Revisa los logs con `verbose: true`

### Las herramientas MCP no están disponibles
- Verifica que el servidor MCP esté ejecutándose
- Comprueba la URL del servidor en la configuración
- Revisa los logs de conexión MCP

### El agente se queda en loop
- Reduce `maxIterations` para limitar las iteraciones
- Ajusta el prompt de evaluación en `should_continue`
- Revisa si el modelo está recibiendo contexto suficiente

## 🎯 Próximos Pasos

1. **Memoria a Largo Plazo**: Agregar capacidad de recordar interacciones previas
2. **Multi-Agente**: Coordinación entre múltiples agentes especializados
3. **Aprendizaje por Refuerzo**: Mejorar decisiones basándose en resultados
4. **Herramientas Personalizadas**: Crear herramientas específicas para tu dominio

## 📚 Referencias

- [LangChain Documentation](https://js.langchain.com/)
- [LangGraph Guide](https://langchain-ai.github.io/langgraphjs/)
- [Google Gemini API](https://ai.google.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Playwright MCP Server](https://github.com/executeautomation/mcp-playwright)

---

**🎉 ¡Tu agente ya es autónomo! Ahora puede razonar y decidir por sí mismo qué hacer.**
