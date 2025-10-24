# QA Agent - Sistema de Agentes Inteligentes con LangGraph

Aplicación web Next.js con sistema de agentes de IA construidos con LangGraph para realizar múltiples tareas de análisis y procesamiento.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ✨ Características Principales

### 🤖 Sistema de Agentes con LangGraph
- **Arquitectura React Agent Pattern**: Agentes que razonan, actúan y sintetizan resultados
- **Google Gemini Integration**: Usa Google Gemini como LLM para razonamiento inteligente
- **MCP Protocol Support**: Conecta a servidores MCP (Model Context Protocol) para herramientas externas
- **Playwright Integration**: Automatización web completa vía MCP
- **Extensible y Modular**: Fácil agregar nuevos agentes y herramientas
- **Type-Safe**: TypeScript completo con validación Zod
- **Monitoreo Completo**: Tracking de ejecución, métricas y logging

### 🎯 Agente Implementado: ContextAnalyzer
Agente especializado en análisis de contexto que:
- **LLM Powered**: Usa Google Gemini para razonamiento y síntesis inteligente
- **Web Automation**: Acceso a herramientas de Playwright vía MCP
- **Multi-Tool**: Combina herramientas simuladas y MCP
- Analiza información en profundidad
- Busca datos relevantes
- Procesa y estructura resultados
- Automatiza navegación web
- Proporciona insights detallados con IA

### 🛠️ Herramientas Disponibles

#### Herramientas Simuladas (Siempre disponibles)
1. **analyze_context**: Análisis de contexto con 3 niveles de profundidad
2. **search_information**: Búsqueda de información relevante
3. **process_data**: Procesamiento con 4 operaciones (clean, transform, validate, summarize)

#### Herramientas MCP (Playwright - Cuando está configurado)
- **browser_navigate**: Navegar a URLs
- **browser_snapshot**: Capturar estructura de página
- **browser_click**: Interactuar con elementos
- **browser_type**: Escribir texto
- **browser_screenshot**: Tomar capturas de pantalla
- **browser_fill_form**: Llenar formularios automáticamente
- **Y 20+ herramientas más** para automatización web completa

## 📖 Documentación

- **[QUICKSTART.md](./QUICKSTART.md)** - Inicio rápido en 5 minutos
- **[GOOGLE_GEMINI_MCP_GUIDE.md](./GOOGLE_GEMINI_MCP_GUIDE.md)** - Guía de Google Gemini + MCP
- **[MCP_REFACTORING.md](./MCP_REFACTORING.md)** - 🆕 Configuración MCP automática por agente
- **[AGENTS_ARCHITECTURE.md](./AGENTS_ARCHITECTURE.md)** - Arquitectura completa del sistema
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación
- **[FLOW_DIAGRAM.md](./FLOW_DIAGRAM.md)** - Diagramas de flujo del sistema

## 🏗️ Estructura del Proyecto

```
qa-agent/
├── src/
│   ├── agents/                    # 🤖 Sistema de Agentes
│   │   ├── core/                  # Clases base y tipos
│   │   │   ├── base-agent.ts     # Clase abstracta base
│   │   │   └── types.ts          # Tipos TypeScript
│   │   ├── implementations/       # Agentes específicos
│   │   │   └── context-analyzer-agent.ts
│   │   ├── tools/                # Herramientas
│   │   │   └── simulated-tools.ts
│   │   ├── index.ts              # Exports
│   │   └── examples.ts           # Ejemplos de uso
│   │
│   ├── app/                       # Next.js App Router
│   │   ├── (dashboard)/          # Dashboard routes
│   │   │   ├── context/         # Página de análisis de contexto
│   │   │   ├── flows/
│   │   │   └── results/
│   │   ├── api/                  # API Routes
│   │   │   └── agents/
│   │   │       └── context-analyzer/
│   │   └── auth/                 # Autenticación
│   │
│   ├── components/               # React Components
│   ├── lib/                      # Utilidades
│   └── models/                   # Modelos de datos
│
├── AGENTS_ARCHITECTURE.md        # Documentación arquitectura
├── IMPLEMENTATION_SUMMARY.md     # Resumen implementación
└── QUICKSTART.md                 # Guía rápida
```

## 🎮 Uso del Agente

### Desde la UI
1. Navega a `/context`
2. Click en "Realizar Análisis"
3. Observa los resultados en el modal

### Desde la API
```typescript
const response = await fetch('/api/agents/context-analyzer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'Navega a example.com y analiza el contenido',
    config: { 
      verbose: true,
      // Opcionalmente sobrescribir configuración
      // model: 'gemini-1.5-pro',
      // temperature: 0.9
    }
  })
});

const { result, metadata } = await response.json();

// El agente automáticamente:
// ✅ Se conecta a Playwright MCP (configurado en el agente)
// ✅ Usa Google Gemini para razonamiento
// ✅ Ejecuta las herramientas necesarias
// ✅ Limpia recursos al terminar
```

### Programáticamente
```typescript
import { ContextAnalyzerAgent } from '@/agents';

const agent = new ContextAnalyzerAgent({ verbose: true });
await agent.initialize();

const result = await agent.run('Tu prompt aquí');
console.log(result);
```

## 🔧 Tecnologías

- **Framework**: Next.js 15 + React 19
- **AI/Agents**: LangGraph + LangChain
- **LLM**: Google Gemini (gemini-1.5-flash, gemini-1.5-pro)
- **MCP Protocol**: Model Context Protocol SDK
- **Automation**: Playwright (via MCP)
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Validación**: Zod
- **Base de Datos**: MongoDB + Mongoose
- **Autenticación**: NextAuth.js v5

## 📦 Scripts Disponibles

```bash
npm run dev      # Desarrollo con Turbopack
npm run build    # Build para producción
npm start        # Iniciar producción
```

## 🎓 Crear Tu Propio Agente

```typescript
import { BaseAgent } from '@/agents/core/base-agent';
import { StateGraph, START, END } from '@langchain/langgraph';

export class MiAgente extends BaseAgent {
  constructor(config) {
    super({ 
      name: "MiAgente",
      tools: [/* tus herramientas */],
      ...config 
    });
  }

  protected defineTools() {
    return [/* define tus herramientas */];
  }

  protected buildGraph() {
    const graph = new StateGraph(AgentStateAnnotation);
    // Define nodos y edges
    return graph;
  }
}
```

Ver [AGENTS_ARCHITECTURE.md](./AGENTS_ARCHITECTURE.md) para una guía completa.

## 🔐 Variables de Entorno

Crea un archivo `.env.local` (ver `.env.example`):

```env
# MongoDB
MONGODB_URI=tu_mongodb_uri

# NextAuth
NEXTAUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# Google Gemini (REQUERIDO para usar LLM)
# Obtén tu API key en: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=tu_google_api_key

# LangChain (Opcional - para tracing)
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=tu_langchain_api_key
```

**🔑 Paso Importante:** Configura `GOOGLE_API_KEY` para que el agente use Gemini como LLM.

## 🚧 Próximos Pasos

- [x] ✅ Integrar Google Gemini como LLM
- [x] ✅ Soporte para MCP Protocol
- [x] ✅ Integración con Playwright vía MCP
- [ ] Implementar más agentes especializados
- [ ] Agregar persistencia con checkpoints
- [ ] Human-in-the-loop para aprobaciones
- [ ] Streaming de respuestas en tiempo real
- [ ] Dashboard de monitoreo con visualización de grafos
- [ ] RAG para contexto mejorado
- [ ] Soporte para múltiples servidores MCP simultáneos

## 📚 Aprende Más

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### LangGraph
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [React Agent Pattern](https://langchain-ai.github.io/langgraph/tutorials/introduction/)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y no tiene licencia pública.

---

**Desarrollado con ❤️ usando Next.js y LangGraph**
