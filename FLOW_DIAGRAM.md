# Diagrama de Flujo del Sistema de Agentes

## Flujo General del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO                                      │
│                    (Frontend UI / API Call)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERFAZ DE ENTRADA                               │
│                                                                      │
│  ┌──────────────────┐              ┌─────────────────────┐          │
│  │  UI Component    │              │   API Route         │          │
│  │  (page.tsx)      │─────────────▶│   /api/agents/...   │          │
│  │                  │   POST        │                     │          │
│  └──────────────────┘   request    └─────────────────────┘          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AGENTE (BaseAgent)                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  1. initialize()                                            │    │
│  │     ├─ defineTools() → Crea herramientas                   │    │
│  │     └─ buildGraph()  → Construye grafo LangGraph           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  2. run(input)                                              │    │
│  │     ├─ Prepara estado inicial (messages)                   │    │
│  │     ├─ Compila el grafo                                    │    │
│  │     └─ Ejecuta el grafo con invoke()                       │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GRAFO LANGGRAPH                                   │
│                  (React Agent Pattern)                               │
│                                                                      │
│         START                                                        │
│           │                                                          │
│           ▼                                                          │
│     ┌─────────────┐                                                 │
│     │  REASONING  │  ← Analiza input, planifica acciones            │
│     └─────┬───────┘                                                 │
│           │                                                          │
│           ▼                                                          │
│     ┌──────────────────┐                                            │
│     │  EXECUTE_TOOLS   │  ← Ejecuta herramientas relevantes         │
│     │                  │                                             │
│     │  ┌────────────┐  │                                             │
│     │  │ Tool 1     │  │  analyze_context                            │
│     │  ├────────────┤  │                                             │
│     │  │ Tool 2     │  │  search_information                         │
│     │  ├────────────┤  │                                             │
│     │  │ Tool 3     │  │  process_data                               │
│     │  └────────────┘  │                                             │
│     └─────┬────────────┘                                            │
│           │                                                          │
│           ▼                                                          │
│     ┌─────────────┐                                                 │
│     │ SYNTHESIZE  │  ← Genera resultado final                       │
│     └─────┬───────┘                                                 │
│           │                                                          │
│           ▼                                                          │
│          END                                                         │
│                                                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RESULTADO                                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  AgentResult {                                              │    │
│  │    success: boolean                                         │    │
│  │    data: any                                                │    │
│  │    messages: BaseMessage[]                                  │    │
│  │    error?: string                                           │    │
│  │  }                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  AgentExecutionMetadata {                                   │    │
│  │    agentName: string                                        │    │
│  │    duration: number                                         │    │
│  │    iterationCount: number                                   │    │
│  │    status: 'completed' | 'failed' | ...                     │    │
│  │  }                                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RESPUESTA AL USUARIO                            │
│                                                                      │
│  ┌──────────────────┐              ┌─────────────────────┐          │
│  │  UI Modal        │              │   JSON Response     │          │
│  │  ✅ Success      │              │   { result,         │          │
│  │  📊 Metadata     │              │     metadata }      │          │
│  │  💬 Messages     │              │                     │          │
│  └──────────────────┘              └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

## Flujo Detallado de ContextAnalyzerAgent

```
Usuario presiona "Realizar Análisis"
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend (page.tsx)                                     │
│ ─────────────────────                                   │
│                                                          │
│ 1. setIsOpen(true)                                      │
│ 2. setIsLoading(true)                                   │
│ 3. fetch('/api/agents/context-analyzer', {             │
│      method: 'POST',                                    │
│      body: {                                            │
│        input: "Por favor realiza un análisis...",       │
│        config: { verbose: true }                        │
│      }                                                   │
│    })                                                    │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ API Route (/api/agents/context-analyzer/route.ts)      │
│ ────────────────────────────────────────────────────    │
│                                                          │
│ 1. Extrae { input, config } del body                    │
│ 2. const agent = new ContextAnalyzerAgent(config)       │
│ 3. await agent.initialize()                             │
│ 4. const result = await agent.run(input)                │
│ 5. const metadata = agent.getMetadata()                 │
│ 6. return { result, metadata }                          │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ ContextAnalyzerAgent                                    │
│ ──────────────────────                                  │
│                                                          │
│ initialize():                                            │
│ ├─ defineTools()                                        │
│ │  ├─ createContextAnalysisTool()                       │
│ │  ├─ createSearchTool()                                │
│ │  └─ createDataProcessingTool()                        │
│ │                                                        │
│ └─ buildGraph()                                         │
│    ├─ addNode("reasoning", ...)                         │
│    ├─ addNode("execute_tools", ...)                     │
│    ├─ addNode("synthesize", ...)                        │
│    └─ addEdges(START → reasoning → execute → synth → END)│
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ Graph Execution                                         │
│ ───────────────                                         │
│                                                          │
│ STATE = { messages: [HumanMessage("Analiza...")] }      │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ Node: REASONING                                  │    │
│ │ ───────────────                                  │    │
│ │ • Lee último mensaje                             │    │
│ │ • Genera pensamiento:                            │    │
│ │   "Analizando la solicitud... Voy a usar..."    │    │
│ │ • Incrementa iterationCount                      │    │
│ │ • Retorna { messages: [AIMessage(...)] }         │    │
│ └─────────────────────────────────────────────────┘    │
│           │                                              │
│           ▼                                              │
│ STATE = { messages: [Human, AI] }                       │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ Node: EXECUTE_TOOLS                              │    │
│ │ ───────────────────                              │    │
│ │ • Busca herramienta "analyze_context"            │    │
│ │ • await tool.invoke({                            │    │
│ │     context: input,                              │    │
│ │     depth: "detailed"                            │    │
│ │   })                                             │    │
│ │ • Delay simulado: 1500ms                         │    │
│ │ • Resultado: { summary, keyPoints, ... }         │    │
│ │                                                   │    │
│ │ • Busca herramienta "search_information"         │    │
│ │ • await tool.invoke({ query, limit: 3 })         │    │
│ │ • Delay simulado: 1000ms                         │    │
│ │ • Resultado: { results: [...] }                  │    │
│ │                                                   │    │
│ │ • Retorna { messages: [AIMessage(results)] }     │    │
│ └─────────────────────────────────────────────────┘    │
│           │                                              │
│           ▼                                              │
│ STATE = { messages: [Human, AI, AI] }                   │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ Node: SYNTHESIZE                                 │    │
│ │ ────────────────                                 │    │
│ │ • Genera mensaje final:                          │    │
│ │   "✅ Análisis completado exitosamente..."       │    │
│ │ • Incluye número de iteraciones                  │    │
│ │ • Retorna { messages: [AIMessage(...)] }         │    │
│ └─────────────────────────────────────────────────┘    │
│           │                                              │
│           ▼                                              │
│ FINAL STATE = { messages: [Human, AI, AI, AI] }         │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ BaseAgent.run() retorna:                                │
│                                                          │
│ {                                                        │
│   success: true,                                        │
│   data: FINAL_STATE,                                    │
│   messages: [Human, AI, AI, AI]                         │
│ }                                                        │
│                                                          │
│ getMetadata() retorna:                                  │
│ {                                                        │
│   agentName: "ContextAnalyzer",                         │
│   duration: 3250,  // ms                                │
│   iterationCount: 1,                                    │
│   status: "completed"                                   │
│ }                                                        │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend recibe respuesta                               │
│                                                          │
│ 1. setResult(data.result)                               │
│ 2. setMetadata(data.metadata)                           │
│ 3. setIsLoading(false)                                  │
│                                                          │
│ 4. Muestra en Modal:                                    │
│    ✅ Análisis Completado                               │
│    📊 Duración: 3.25s                                   │
│    🔄 Iteraciones: 1                                    │
│    💬 4 mensajes del agente                             │
└─────────────────────────────────────────────────────────┘
```

## Componentes Clave

### 1. Estado del Agente (AgentState)
```typescript
{
  messages: BaseMessage[]  // Cola de mensajes acumulados
}
```

### 2. Herramientas (Tools)
```typescript
DynamicStructuredTool {
  name: string
  description: string
  schema: ZodSchema
  func: async (params) => string
}
```

### 3. Grafo (StateGraph)
```typescript
StateGraph<AgentState>
  .addNode("name", async (state) => ({ messages: [...] }))
  .addEdge(from, to)
  .compile()
  .invoke(initialState)
```

### 4. Mensajes (Messages)
```typescript
HumanMessage   - Del usuario
AIMessage      - Del agente/modelo
SystemMessage  - Del sistema
ToolMessage    - De herramientas
```

## Extensibilidad

Para agregar un nuevo agente:

1. Extiende `BaseAgent`
2. Implementa `defineTools()` con tus herramientas
3. Implementa `buildGraph()` con tu flujo
4. Crea API route en `/api/agents/tu-agente`
5. Integra en el frontend

¡Listo para escalar! 🚀
