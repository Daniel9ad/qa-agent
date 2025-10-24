# Sistema de Agentes con LangGraph

Este proyecto implementa una arquitectura robusta y escalable para construir agentes de IA utilizando LangGraph y React Agent pattern.

## 🏗️ Arquitectura

### Estructura de Carpetas

```
src/agents/
├── core/                          # Componentes core del sistema
│   ├── base-agent.ts             # Clase base abstracta para todos los agentes
│   └── types.ts                  # Tipos TypeScript compartidos
├── implementations/               # Implementaciones específicas de agentes
│   └── context-analyzer-agent.ts # Agente de análisis de contexto
├── tools/                        # Herramientas disponibles para los agentes
│   └── simulated-tools.ts        # Herramientas simuladas para pruebas
└── index.ts                      # Punto de entrada principal
```

## 🔧 Componentes Principales

### 1. BaseAgent (Clase Abstracta)

La clase `BaseAgent` proporciona la estructura fundamental para todos los agentes:

**Características:**
- ✅ Ciclo de vida completo del agente (inicialización, ejecución, cancelación)
- ✅ Gestión de herramientas (tools)
- ✅ Construcción de grafos con LangGraph
- ✅ Tracking de metadatos de ejecución
- ✅ Manejo de errores robusto
- ✅ Modo verbose para debugging

**Métodos Abstractos:**
- `defineTools()`: Define las herramientas específicas del agente
- `buildGraph()`: Construye el grafo de ejecución con LangGraph

**Métodos Públicos:**
- `initialize()`: Inicializa el agente y sus herramientas
- `run(input)`: Ejecuta el agente con un input
- `cancel()`: Cancela la ejecución del agente
- `getMetadata()`: Obtiene metadatos de ejecución

### 2. Tipos del Sistema

```typescript
// Estado del agente
interface AgentState {
  messages: BaseMessage[];
  [key: string]: any;
}

// Resultado de ejecución
interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  messages?: BaseMessage[];
}

// Configuración del agente
interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
  tools: ToolConfig[];
  verbose?: boolean;
}

// Metadatos de ejecución
interface AgentExecutionMetadata {
  agentName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  iterationCount?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}
```

### 3. Herramientas (Tools)

Las herramientas son funciones que los agentes pueden utilizar para realizar tareas específicas.

**Herramientas Simuladas Disponibles:**

#### `analyze_context`
Analiza contexto en profundidad con diferentes niveles de detalle.

```typescript
{
  context: string,          // El contexto a analizar
  depth: "basic" | "detailed" | "comprehensive"
}
```

#### `search_information`
Busca información relevante sobre un tema.

```typescript
{
  query: string,            // Consulta de búsqueda
  limit?: number           // Número máximo de resultados
}
```

#### `process_data`
Procesa y transforma datos.

```typescript
{
  data: string,            // Datos a procesar
  operation: "clean" | "transform" | "validate" | "summarize"
}
```

## 🤖 Agentes Implementados

### ContextAnalyzerAgent

Agente especializado en análisis de contexto que utiliza el patrón React Agent.

**Características:**
- 🧠 Razonamiento basado en el input del usuario
- 🔧 Ejecución inteligente de herramientas
- 📊 Síntesis de resultados
- 🔄 Flujo de trabajo con StateGraph

**Flujo de Ejecución:**

```
START → Reasoning → Execute Tools → Synthesize → END
```

**Uso:**

```typescript
import { ContextAnalyzerAgent } from '@/agents';

const agent = new ContextAnalyzerAgent({
  verbose: true,
});

await agent.initialize();

const result = await agent.run(
  "Analiza este contexto y proporciona insights"
);

console.log(result);
```

## 🚀 Cómo Crear un Nuevo Agente

### Paso 1: Crear la Clase del Agente

```typescript
import { BaseAgent } from '../core/base-agent';
import { AgentConfig, AgentState } from '../core/types';
import { StateGraph, END } from '@langchain/langgraph';

export class MiNuevoAgente extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({ 
      name: "MiNuevoAgente",
      description: "Descripción del agente",
      tools: [
        { name: "tool1", description: "...", enabled: true }
      ],
      ...config 
    });
  }

  protected defineTools() {
    // Define las herramientas que usará el agente
    return [
      createTool1(),
      createTool2(),
    ];
  }

  protected buildGraph() {
    const graph = new StateGraph<AgentState>({
      channels: {
        messages: {
          value: (left, right) => left.concat(right),
          default: () => [],
        },
      },
    });

    // Define los nodos del grafo
    graph.addNode("nodo1", async (state) => {
      // Lógica del nodo
      return { messages: [...] };
    });

    // Define las conexiones
    graph.addEdge("__start__", "nodo1");
    graph.addEdge("nodo1", END);

    return graph;
  }
}
```

### Paso 2: Crear Herramientas Específicas

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const createMiHerramienta = () => {
  return new DynamicStructuredTool({
    name: "mi_herramienta",
    description: "Descripción de lo que hace",
    schema: z.object({
      param1: z.string().describe("Descripción del parámetro"),
    }),
    func: async ({ param1 }) => {
      // Implementación de la herramienta
      const result = await procesarAlgo(param1);
      return JSON.stringify(result);
    },
  });
};
```

### Paso 3: Crear API Route

```typescript
// src/app/api/agents/mi-agente/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MiNuevoAgente } from '@/agents';

export async function POST(request: NextRequest) {
  const { input, config } = await request.json();
  
  const agent = new MiNuevoAgente(config);
  await agent.initialize();
  
  const result = await agent.run(input);
  const metadata = agent.getMetadata();

  return NextResponse.json({ result, metadata });
}
```

### Paso 4: Integrar en el Frontend

```typescript
const response = await fetch('/api/agents/mi-agente', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'Tu input aquí',
    config: { verbose: true }
  }),
});

const { result, metadata } = await response.json();
```

## 📊 Monitoreo y Debugging

### Metadatos de Ejecución

Cada agente proporciona metadatos detallados:

```typescript
{
  agentName: "ContextAnalyzer",
  startTime: "2024-01-15T10:00:00.000Z",
  endTime: "2024-01-15T10:00:05.000Z",
  duration: 5000,              // en milisegundos
  iterationCount: 3,
  status: "completed"
}
```

### Modo Verbose

Activa el modo verbose para ver logs detallados:

```typescript
const agent = new ContextAnalyzerAgent({
  verbose: true
});
```

## 🔐 Integración con Variables de Entorno

Para agentes que usen modelos de IA reales (OpenAI, etc.), configura las variables de entorno:

```env
OPENAI_API_KEY=tu_api_key
LANGCHAIN_API_KEY=tu_langchain_key  # Opcional, para LangSmith
LANGCHAIN_TRACING_V2=true           # Opcional, para tracing
```

## 🎯 Mejores Prácticas

1. **Diseño de Herramientas:**
   - Mantén las herramientas pequeñas y enfocadas
   - Usa descripciones claras para que el agente entienda cuándo usarlas
   - Valida los parámetros con Zod schemas

2. **Diseño de Grafos:**
   - Divide tareas complejas en nodos pequeños
   - Usa nodos de decisión para flujos condicionales
   - Mantén el grafo lo más simple posible

3. **Manejo de Errores:**
   - Implementa try-catch en cada nodo
   - Proporciona mensajes de error descriptivos
   - Usa el sistema de metadata para tracking

4. **Testing:**
   - Crea herramientas simuladas primero
   - Prueba el flujo del grafo antes de conectar APIs reales
   - Usa el modo verbose durante desarrollo

## 📚 Recursos Adicionales

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain Tools](https://js.langchain.com/docs/modules/agents/tools/)
- [React Agent Pattern](https://langchain-ai.github.io/langgraph/tutorials/introduction/)

## 🔄 Próximos Pasos

- [ ] Implementar más agentes especializados
- [ ] Añadir persistencia de estado con checkpoints
- [ ] Integrar con modelos LLM reales
- [ ] Implementar human-in-the-loop
- [ ] Añadir streaming de respuestas
- [ ] Crear dashboard de monitoreo
