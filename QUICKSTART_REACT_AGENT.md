# 🚀 Quick Start - React Agent

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Configurar API Key
```bash
# Crea archivo .env.local
echo "GOOGLE_API_KEY=tu_api_key_aqui" > .env.local
```

Obtén tu API key aquí: https://makersuite.google.com/app/apikey

### 2️⃣ Instalar Dependencias
```bash
npm install
```

### 3️⃣ Probar el Agente

#### Opción A: Ejemplos Pre-hechos
```bash
# Instalar tsx (solo primera vez)
npm install --save-dev tsx

# Ver ejemplos disponibles
npm run agent:examples
```

#### Opción B: En tu Código
```typescript
import { ContextAnalyzerAgent } from './src/agents';

async function test() {
  const agent = new ContextAnalyzerAgent({ verbose: true });
  
  agent.initializeModel(process.env.GOOGLE_API_KEY);
  await agent.initialize();
  
  const result = await agent.run("Explain React in 3 sentences");
  console.log(result);
  
  await agent.cleanup();
}

test();
```

#### Opción C: Desde la Web UI
```bash
# Iniciar servidor Next.js
npm run dev

# Navegar a:
# http://localhost:3000/context
```

## 🔧 Configuración Avanzada

### Con Herramientas MCP (Playwright)

```bash
# 1. Iniciar servidor MCP
npm run mcp:start

# 2. Configurar URL en .env.local
echo "PLAYWRIGHT_MCP_URL=http://localhost:3001/sse" >> .env.local

# 3. Usar el agente (ahora con browser tools)
```

### Personalizar el Agente

```typescript
const agent = new ContextAnalyzerAgent({
  name: "MyCustomAgent",
  model: "gemini-2.5-flash",
  temperature: 0.3,        // Más determinístico
  maxIterations: 15,       // Más iteraciones
  tools: [
    { name: "analyze_context", enabled: true },
    { name: "search_information", enabled: false }, // Deshabilitada
    { name: "process_data", enabled: true },
  ],
  verbose: true,
});
```

## 📚 Documentación Completa

- **[REACT_AGENT_SUMMARY.md](./REACT_AGENT_SUMMARY.md)**: Resumen de cambios
- **[REACT_AGENT_REFACTORING.md](./REACT_AGENT_REFACTORING.md)**: Documentación detallada
- **[examples-react.ts](./src/agents/examples-react.ts)**: 6 ejemplos de uso

## 🎯 Ejemplos Rápidos

### Ejemplo 1: Simple
```typescript
const result = await agent.run("What is TypeScript?");
```

### Ejemplo 2: Con URL
```typescript
const result = await agent.run("Navigate to https://example.com and tell me what you see");
```

### Ejemplo 3: Procesamiento de Datos
```typescript
const data = { users: 150, revenue: 50000 };
const result = await agent.run(`Analyze this data: ${JSON.stringify(data)}`);
```

## ❓ Troubleshooting

### Error: "No Google API key"
```bash
# Asegúrate de configurar la variable de entorno
export GOOGLE_API_KEY="tu_api_key"  # Linux/Mac
set GOOGLE_API_KEY=tu_api_key       # Windows CMD
$env:GOOGLE_API_KEY="tu_api_key"    # Windows PowerShell
```

### Error: "MCP server not found"
```bash
# El servidor MCP es OPCIONAL
# Si no lo necesitas, puedes usar el agente sin herramientas web
# Si lo necesitas, inicia el servidor:
npm run mcp:start
```

### Error: "Module not found"
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

## 🎉 ¡Listo!

Ahora tienes un agente React funcionando con:
- ✅ Google Gemini como LLM
- ✅ Herramientas de análisis
- ✅ Patrón estándar de LangGraph
- ✅ Compatible con Python

**¡Empieza a construir!** 🚀
