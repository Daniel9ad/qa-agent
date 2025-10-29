# Conexiones HTTP a Servidores MCP

## Descripción

El sistema ahora soporta dos tipos de conexión a servidores MCP:

1. **HTTP** (Recomendado): Conecta a servidores MCP que ya están corriendo en puertos específicos
2. **stdio** (Legacy): Lanza procesos MCP en cada petición

## Configuración HTTP

### 1. Variables de Entorno

Configura las URLs de tus servidores MCP en tu archivo `.env`:

```env
# URL del servidor MCP de Playwright
# Nota: Incluye el endpoint completo (/sse para legacy SSE transport)
PLAYWRIGHT_MCP_URL=http://localhost:3001/sse

# Otros servidores MCP
CONTEXT7_MCP_URL=http://localhost:3002/sse
CUSTOM_MCP_URL=http://localhost:3003/sse
```

**⚠️ Importante:** Asegúrate de incluir el endpoint completo:
- `/sse` para SSE transport (legacy, más compatible)
- `/mcp` para el nuevo transporte (si tu servidor lo soporta)

### 2. Configuración en el Agente

```typescript
import { AgentConfig } from '@/agents/core/types';

const config: AgentConfig = {
  name: "MyAgent",
  // ... otras configuraciones
  mcpServers: [
    {
      type: 'http',
      url: process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:3001/sse',
    },
    {
      type: 'http',
      url: process.env.CONTEXT7_MCP_URL || 'http://localhost:3002/sse',
    },
  ],
};
```

## Iniciar Servidores MCP

**⚠️ NOTA IMPORTANTE:** Cuando inicies un servidor MCP, prestará atención a los logs para ver qué endpoint usar. Por ejemplo, el servidor Playwright MCP indica:

```
Listening on http://localhost:3001
Put this in your client config:
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
For legacy SSE transport support, you can use the /sse endpoint instead.
```

Esto significa que debes usar:
- **`http://localhost:3001/sse`** para SSE transport (recomendado, más compatible)
- **`http://localhost:3001/mcp`** para el nuevo transporte

### Opción 1: Manualmente

Inicia cada servidor MCP en su propio proceso:

```bash
# Servidor Playwright MCP en puerto 3001
npx @playwright/mcp --port 3001

# Servidor Context7 MCP en puerto 3002
npx @context7/mcp --port 3002
```

### Opción 2: Con PM2 (Recomendado para Producción)

Crea un archivo `ecosystem.config.js` (ya incluido en el proyecto):

```javascript
module.exports = {
  apps: [
    {
      name: 'playwright-mcp',
      script: 'npx',
      args: ['-y', '@playwright/mcp', '--port', '3001'],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
```

Luego ejecuta:

```bash
# Instalar PM2 globalmente (si no lo tienes)
npm install -g pm2

# Iniciar servidores
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Monitorear
pm2 monit

# Detener
pm2 stop all

# Reiniciar
pm2 restart all

# Guardar configuración para reinicio automático
pm2 save

# Configurar inicio automático con el sistema
pm2 startup
```

### Opción 3: Con Docker Compose (Recomendado para Contenedores)

Usa el archivo `docker-compose.mcp.yml` incluido en el proyecto:

```bash
# Iniciar servidores MCP en contenedores
docker-compose -f docker-compose.mcp.yml up -d

# Ver logs
docker-compose -f docker-compose.mcp.yml logs -f

# Ver estado
docker-compose -f docker-compose.mcp.yml ps

# Detener servidores
docker-compose -f docker-compose.mcp.yml down

# Reiniciar
docker-compose -f docker-compose.mcp.yml restart
```

El archivo está preconfigurado con:
- ✅ Health checks automáticos
- ✅ Restart policies
- ✅ Logs persistentes
- ✅ Network isolation

## Migración desde stdio

### Antes (stdio)

```typescript
mcpServers: [
  {
    type: 'stdio',
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["-y", "@playwright/mcp@latest"],
  },
]
```

### Después (HTTP)

```typescript
mcpServers: [
  {
    type: 'http',
    url: process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:3001',
  },
]
```

## Ventajas de HTTP sobre stdio

1. **Rendimiento**: No se lanza un nuevo proceso en cada petición
2. **Recursos**: Menos consumo de memoria y CPU
3. **Estabilidad**: Los servidores MCP permanecen corriendo
4. **Monitoreo**: Más fácil monitorear procesos persistentes
5. **Escalabilidad**: Se pueden balancear múltiples instancias

## Usar Múltiples Servidores

Puedes conectar a múltiples servidores MCP simultáneamente:

```typescript
mcpServers: [
  {
    type: 'http',
    url: 'http://localhost:3001', // Playwright
  },
  {
    type: 'http',
    url: 'http://localhost:3002', // Context7
  },
  {
    type: 'http',
    url: 'http://localhost:3003', // Custom
  },
]
```

## Verificar Conexión

Para verificar que un servidor MCP está corriendo:

```bash
# En PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET

# En bash/zsh (Linux/Mac)
curl http://localhost:3001/health
```

## Troubleshooting

### Error: "Failed to connect to MCP server"

1. Verifica que el servidor MCP está corriendo:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```

2. Revisa los logs del servidor MCP

3. Verifica la URL en tu `.env`

### Error: "No tools received from MCP server"

1. El servidor está corriendo pero no expone herramientas
2. Verifica que el servidor MCP esté correctamente configurado
3. Revisa la documentación del servidor MCP específico

## Ejemplo Completo

```typescript
// src/agents/implementations/my-agent.ts
import { BaseAgent } from '../core/base-agent';
import { AgentConfig } from '../core/types';

export const defaultMyAgentConfig: AgentConfig = {
  name: "MyAgent",
  description: "Mi agente personalizado",
  model: "gemini-2.5-flash",
  temperature: 0.7,
  maxIterations: 10,
  tools: [],
  mcpServers: [
    {
      type: 'http',
      url: process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:3001',
    },
  ],
  verbose: true,
};

export class MyAgent extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...defaultMyAgentConfig, ...config });
  }
  
  // ... resto de la implementación
}
```

## Referencias

- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Playwright MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/playwright)
