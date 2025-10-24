# Guía de Integración: Google Gemini + MCP Playwright

Esta guía explica cómo usar el sistema de agentes con Google Gemini como LLM y el servidor MCP de Playwright para herramientas de automatización web.

## 🚀 Configuración Rápida

### 1. Configurar Google Gemini API

1. Obtén tu API key de Google:
   - Visita: https://makersuite.google.com/app/apikey
   - Crea o selecciona un proyecto
   - Genera una nueva API key

2. Configura la variable de entorno:
```bash
# En .env.local
GOOGLE_API_KEY=tu_api_key_aqui
```

### 2. Instalar Servidor MCP de Playwright

```bash
npm install -g @modelcontextprotocol/server-playwright
```

O usa `npx` para ejecutarlo sin instalación global (recomendado).

### 3. Verificar Instalación

```bash
# Verificar que playwright MCP está disponible
npx -y @modelcontextprotocol/server-playwright --help
```

## 🎯 Uso del Agente con Google Gemini

### Desde la UI

1. Navega a `/context`
2. Haz clic en "Realizar Análisis"
3. El agente automáticamente:
   - Usa Google Gemini para razonamiento y síntesis
   - Conecta al servidor MCP de Playwright
   - Ejecuta herramientas de navegación web si es necesario

### Desde la API

```typescript
const response = await fetch('/api/agents/context-analyzer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'Analiza la página de ejemplo.com y extrae información',
    
    // Configuración del agente
    config: {
      verbose: true,
      model: 'gemini-1.5-flash',  // o 'gemini-1.5-pro'
      temperature: 0.7,
    },
    
    // Configuración del servidor MCP
    mcpConfig: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-playwright'],
    },
    
    // Opcional: pasar API key directamente
    googleApiKey: 'tu_api_key_aqui',
  })
});

const { result, metadata } = await response.json();
```

### Programáticamente

```typescript
import { ContextAnalyzerAgent, MCPClient } from '@/agents';

// Crear agente
const agent = new ContextAnalyzerAgent({
  verbose: true,
  model: 'gemini-1.5-flash',
  temperature: 0.7,
});

// Inicializar modelo LLM
agent.initializeModel(process.env.GOOGLE_API_KEY);

// Inicializar MCP (opcional)
const mcpClient = new MCPClient({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-playwright'],
});
await agent.initializeMCP(mcpClient);

// Inicializar herramientas base
await agent.initialize();

// Ejecutar
const result = await agent.run('Tu prompt aquí');

// Limpiar
await agent.cleanup();
```

## 🛠️ Herramientas Disponibles

### Herramientas Simuladas (Siempre disponibles)
- `analyze_context`: Análisis de contexto
- `search_information`: Búsqueda de información
- `process_data`: Procesamiento de datos

### Herramientas MCP de Playwright (Si MCP está configurado)
- `browser_navigate`: Navegar a una URL
- `browser_snapshot`: Capturar snapshot de accesibilidad
- `browser_click`: Hacer clic en elementos
- `browser_type`: Escribir texto
- `browser_screenshot`: Tomar screenshots
- `browser_fill_form`: Llenar formularios
- Y muchas más...

## 📊 Modelos Disponibles de Google Gemini

### gemini-1.5-flash (Recomendado)
- **Velocidad**: ⚡️⚡️⚡️ Muy rápido
- **Costo**: 💰 Económico
- **Uso**: Tareas generales, respuestas rápidas
```typescript
config: { model: 'gemini-1.5-flash' }
```

### gemini-1.5-pro
- **Velocidad**: ⚡️⚡️ Rápido
- **Costo**: 💰💰 Moderado
- **Uso**: Tareas complejas, análisis profundo
```typescript
config: { model: 'gemini-1.5-pro' }
```

### gemini-1.0-pro
- **Velocidad**: ⚡️ Estándar
- **Costo**: 💰 Muy económico
- **Uso**: Tareas básicas
```typescript
config: { model: 'gemini-1.0-pro' }
```

## 🔧 Configuración Avanzada

### Usar Diferentes Servidores MCP

```typescript
// Servidor MCP personalizado
mcpConfig: {
  command: 'node',
  args: ['ruta/a/tu/servidor-mcp.js'],
  env: {
    CUSTOM_VAR: 'valor',
  }
}
```

### Ajustar Parámetros del Modelo

```typescript
config: {
  model: 'gemini-1.5-pro',
  temperature: 0.9,        // Más creativo (0-1)
  maxIterations: 10,       // Más iteraciones
  verbose: true,           // Ver logs detallados
}
```

### Deshabilitar Herramientas Específicas

```typescript
config: {
  tools: [
    { name: 'analyze_context', enabled: true },
    { name: 'search_information', enabled: false },  // Deshabilitar
    { name: 'process_data', enabled: true },
  ]
}
```

## 🎭 Ejemplos de Uso

### Ejemplo 1: Análisis de Página Web

```typescript
const response = await fetch('/api/agents/context-analyzer', {
  method: 'POST',
  body: JSON.stringify({
    input: 'Navega a https://example.com, toma un screenshot y analiza el contenido de la página',
    mcpConfig: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-playwright'],
    },
  })
});
```

### Ejemplo 2: Automatización de Formularios

```typescript
const response = await fetch('/api/agents/context-analyzer', {
  method: 'POST',
  body: JSON.stringify({
    input: 'Navega a la página de login en http://localhost:3000/login y llena el formulario con email: test@example.com',
    mcpConfig: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-playwright'],
    },
  })
});
```

### Ejemplo 3: Extracción de Datos

```typescript
const response = await fetch('/api/agents/context-analyzer', {
  method: 'POST',
  body: JSON.stringify({
    input: 'Visita https://news.ycombinator.com y extrae los títulos de las primeras 10 noticias',
    config: {
      model: 'gemini-1.5-pro',  // Usar modelo más potente
      temperature: 0.3,          // Más determinístico
    },
    mcpConfig: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-playwright'],
    },
  })
});
```

## 🐛 Solución de Problemas

### Error: "No Google API key provided"
- Asegúrate de configurar `GOOGLE_API_KEY` en `.env.local`
- O pasa `googleApiKey` en el request

### Error: "MCP connection failed"
- Verifica que `@modelcontextprotocol/server-playwright` esté instalado
- Prueba ejecutar: `npx -y @modelcontextprotocol/server-playwright --help`
- El agente continuará sin herramientas MCP si falla la conexión

### Error: "Command not found: npx"
- Asegúrate de tener Node.js instalado
- En Windows, usa PowerShell o CMD, no Git Bash

### El agente no usa el LLM
- Verifica que la API key sea válida
- Revisa los logs con `verbose: true`
- El agente usará razonamiento simple si el LLM falla

## 📈 Mejores Prácticas

1. **Usa `gemini-1.5-flash` para desarrollo**: Más rápido y económico
2. **Habilita `verbose: true` en desarrollo**: Para ver el flujo completo
3. **Maneja errores gracefully**: El agente tiene fallbacks automáticos
4. **Limpia recursos**: Siempre se hace automáticamente en la API route
5. **Limita las herramientas**: Solo habilita las que necesitas

## 🔐 Seguridad

- **Nunca expongas tu API key**: Usa variables de entorno
- **Valida inputs del usuario**: Antes de pasarlos al agente
- **Limita navegación web**: Si usas MCP en producción, restringe dominios
- **Monitorea uso de API**: Google Gemini tiene cuotas y límites

## 📚 Referencias

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Playwright MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/playwright)
- [LangChain Google GenAI](https://js.langchain.com/docs/integrations/chat/google_generativeai)

---

¡Ahora tu agente tiene superpoderes! 🚀✨
