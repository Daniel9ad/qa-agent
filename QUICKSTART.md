# 🚀 Quick Start - Sistema de Agentes

## Inicio Rápido (5 minutos)

### 1. Verifica las dependencias
Las dependencias ya están instaladas. Si necesitas reinstalarlas:
```bash
npm install
```

### 2. Inicia el servidor de desarrollo
```bash
npm run dev
```

### 3. Prueba el agente desde la UI
1. Abre http://localhost:3000 en tu navegador
2. Navega a la página de **Context** (desde el sidebar o directamente a `/context`)
3. Haz clic en el botón **"Realizar Análisis"**
4. Observa cómo el agente procesa la información

¡Eso es todo! El agente ejecutará un análisis simulado usando LangGraph.

## 🧪 Prueba desde la API

```bash
# Usando PowerShell
$body = @{
    input = "Analiza el contexto de este proyecto"
    config = @{
        verbose = $true
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/agents/context-analyzer" -Method POST -Body $body -ContentType "application/json"
```

## 📖 Estructura Rápida

```
src/agents/
├── core/              # Base classes y tipos
├── implementations/   # Agentes específicos (ContextAnalyzerAgent)
├── tools/            # Herramientas (simuladas por ahora)
└── index.ts          # Exports principales
```

## 🎯 Crear Tu Propio Agente

Copia este template en `src/agents/implementations/mi-agente.ts`:

```typescript
import { BaseAgent } from '../core/base-agent';
import { AgentConfig, AgentStateAnnotation } from '../core/types';
import { StateGraph, START, END } from '@langchain/langgraph';

export class MiAgente extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({ 
      name: "MiAgente",
      description: "Mi agente personalizado",
      tools: [],
      ...config 
    });
  }

  protected defineTools() {
    return []; // Tus herramientas aquí
  }

  protected buildGraph() {
    const graph = new StateGraph(AgentStateAnnotation);
    
    graph.addNode("mi_nodo", async (state) => {
      return { messages: [/* tus mensajes */] };
    });
    
    // @ts-ignore
    graph.addEdge(START, "mi_nodo");
    // @ts-ignore
    graph.addEdge("mi_nodo", END);
    
    return graph;
  }
}
```

## 📚 Más Información

- Lee `AGENTS_ARCHITECTURE.md` para arquitectura completa
- Lee `IMPLEMENTATION_SUMMARY.md` para el resumen de implementación
- Revisa `src/agents/examples.ts` para ejemplos de código

## 🔑 Configurar Google Gemini (Recomendado)

Para usar el agente con razonamiento inteligente:

1. **Obtén tu API key de Google:**
   - Visita: https://makersuite.google.com/app/apikey
   - Crea o selecciona un proyecto
   - Genera una nueva API key

2. **Crea un archivo `.env.local`:**
```env
GOOGLE_API_KEY=tu_google_api_key_aqui
```

3. **Reinicia el servidor:**
```bash
npm run dev
```

¡Listo! El agente ahora usará Google Gemini para razonamiento y síntesis.

## 🎭 Habilitar Herramientas de Playwright (Opcional)

Para que el agente pueda navegar y automatizar páginas web:

1. **El servidor MCP se ejecuta automáticamente** cuando usas el botón "Realizar Análisis"

2. **Para pruebas manuales:**
```bash
npx -y @modelcontextprotocol/server-playwright
```

Ver **[GOOGLE_GEMINI_MCP_GUIDE.md](./GOOGLE_GEMINI_MCP_GUIDE.md)** para más detalles.

## ❓ Problemas Comunes

**Error: Module not found**
```bash
npm install
```

**Puerto 3000 en uso**
```bash
# Cambia el puerto en package.json o usa:
npm run dev -- -p 3001
```

**Errores de TypeScript**
- Los `@ts-ignore` en los edges son temporales y normales
- El código funciona correctamente en runtime

---

¡Listo para empezar! 🎉
