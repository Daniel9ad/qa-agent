/**
 * Cliente MCP para conectarse a servidores MCP
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { MCPServerConfig } from "./types";

/**
 * Cliente para conectarse a un servidor MCP y convertir sus herramientas
 * a herramientas de LangChain
 */
export class MCPClient {
  private client: Client;
  private transport?: StdioClientTransport | SSEClientTransport;
  private isConnected: boolean = false;

  constructor(private config: MCPServerConfig) {
    this.client = new Client(
      {
        name: "qa-agent-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * Conecta al servidor MCP
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      const identifier = this.config.type === 'http' ? this.config.url : this.config.command;
      console.log(`[MCP] Already connected to: ${identifier}`);
      return;
    }

    try {
      if (this.config.type === 'http') {
        // Conexión HTTP a servidor MCP existente
        if (!this.config.url) {
          throw new Error('URL is required for HTTP connection');
        }

        console.log(`[MCP] Attempting HTTP connection to: ${this.config.url}`);
        
        this.transport = new SSEClientTransport(
          new URL(this.config.url)
        );

        await this.client.connect(this.transport);
        this.isConnected = true;

        console.log(`[MCP] ✅ Successfully connected to HTTP server: ${this.config.url}`);
      } else {
        // Conexión stdio (lanzar proceso - legacy)
        if (!this.config.command) {
          throw new Error('Command is required for stdio connection');
        }

        console.log(`[MCP] Attempting stdio connection to: ${this.config.command}`);
        console.log(`[MCP] With args: ${JSON.stringify(this.config.args)}`);
        console.log(`[MCP] With env: ${JSON.stringify(this.config.env || {})}`);
        
        this.transport = new StdioClientTransport({
          command: this.config.command,
          args: this.config.args,
          env: this.config.env,
        });

        await this.client.connect(this.transport);
        this.isConnected = true;

        console.log(`[MCP] ✅ Successfully connected to stdio server: ${this.config.command}`);
      }
    } catch (error) {
      const identifier = this.config.type === 'http' ? this.config.url : this.config.command;
      console.error(`[MCP] ❌ Failed to connect to ${identifier}:`, error);
      if (error instanceof Error) {
        console.error(`[MCP] Error message: ${error.message}`);
        console.error(`[MCP] Error stack:`, error.stack);
      }
      throw error;
    }
  }

  /**
   * Desconecta del servidor MCP
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.close();
      this.isConnected = false;
      console.log("[MCP] Disconnected from server");
    } catch (error) {
      console.error("[MCP] Error disconnecting:", error);
    }
  }

  /**
   * Obtiene la lista de herramientas disponibles del servidor MCP
   */
  async listTools(): Promise<any[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log("[MCP] Requesting tools list...");
      const response = await this.client.listTools();
      console.log(`[MCP] ✅ Received ${response.tools?.length || 0} tools from server`);
      
      if (response.tools && response.tools.length > 0) {
        console.log(`[MCP] Tools available:`, response.tools.map((t: any) => t.name).join(', '));
      }
      
      return response.tools || [];
    } catch (error) {
      console.error("[MCP] ❌ Error listing tools:", error);
      if (error instanceof Error) {
        console.error(`[MCP] Error details: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Ejecuta una herramienta del servidor MCP
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args,
      });

      return response;
    } catch (error) {
      console.error(`[MCP] Error calling tool ${name}:`, error);
      throw error;
    }
  }

  /**
   * Convierte las herramientas MCP a herramientas de LangChain
   */
  async toLangChainTools(): Promise<DynamicStructuredTool[]> {
    console.log("[MCP] Converting MCP tools to LangChain format...");
    const mcpTools = await this.listTools();
    
    if (mcpTools.length === 0) {
      console.warn("[MCP] ⚠️  No tools received from MCP server");
      return [];
    }
    
    // Filtrar herramientas si se especificó allowedTools
    let toolsToConvert = mcpTools;
    if (this.config.allowedTools && this.config.allowedTools.length > 0) {
      console.log(`[MCP] Filtering tools. Allowed: ${this.config.allowedTools.join(', ')}`);
      toolsToConvert = mcpTools.filter(tool => 
        this.config.allowedTools!.includes(tool.name)
      );
      console.log(`[MCP] Filtered ${mcpTools.length} tools down to ${toolsToConvert.length} allowed tools`);
      
      if (toolsToConvert.length === 0) {
        console.warn(`[MCP] ⚠️  No tools matched the allowed list`);
        return [];
      }
    }
    
    const langchainTools: DynamicStructuredTool[] = [];

    for (const tool of toolsToConvert) {
      try {
        console.log(`[MCP] Converting tool: ${tool.name}`);
        
        // Convertir el schema JSON Schema a Zod
        const zodSchema = this.jsonSchemaToZod(tool.inputSchema);

        const langchainTool = new DynamicStructuredTool({
          name: tool.name,
          description: tool.description || `MCP tool: ${tool.name}`,
          schema: zodSchema,
          func: async (args: Record<string, any>) => {
            try {
              console.log(`[MCP] Executing tool ${tool.name} with args:`, args);
              const result = await this.callTool(tool.name, args);
              
              // Extraer el contenido de la respuesta
              if (result.content && Array.isArray(result.content)) {
                const textContents = result.content
                  .filter((item: any) => item.type === "text")
                  .map((item: any) => item.text)
                  .join("\n");
                console.log(`[MCP] Tool ${tool.name} completed successfully`);
                return textContents || JSON.stringify(result);
              }
              
              return JSON.stringify(result);
            } catch (error) {
              const errorMsg = `Error executing tool ${tool.name}: ${error instanceof Error ? error.message : String(error)}`;
              console.error(`[MCP] ${errorMsg}`);
              return errorMsg;
            }
          },
        });

        langchainTools.push(langchainTool);
        console.log(`[MCP] ✅ Successfully converted tool: ${tool.name}`);
      } catch (error) {
        console.error(`[MCP] ❌ Error converting tool ${tool.name}:`, error);
      }
    }

    console.log(`[MCP] 🎉 Converted ${langchainTools.length}/${toolsToConvert.length} tools to LangChain format`);
    return langchainTools;
  }

  /**
   * Convierte JSON Schema a Zod Schema (simplificado)
   */
  private jsonSchemaToZod(jsonSchema: any): z.ZodObject<any> {
    if (!jsonSchema || !jsonSchema.properties) {
      return z.object({});
    }

    const zodFields: Record<string, z.ZodTypeAny> = {};
    const properties = jsonSchema.properties;
    const required = jsonSchema.required || [];

    for (const [key, value] of Object.entries(properties)) {
      const prop = value as any;
      let zodType: z.ZodTypeAny;

      switch (prop.type) {
        case "string":
          zodType = z.string();
          break;
        case "number":
        case "integer":
          zodType = z.number();
          break;
        case "boolean":
          zodType = z.boolean();
          break;
        case "array":
          zodType = z.array(z.any());
          break;
        case "object":
          zodType = z.object({});
          break;
        default:
          zodType = z.any();
      }

      // Agregar descripción si existe
      if (prop.description) {
        zodType = zodType.describe(prop.description);
      }

      // Hacer opcional si no está en required
      if (!required.includes(key)) {
        zodType = zodType.optional();
      }

      zodFields[key] = zodType;
    }

    return z.object(zodFields);
  }

  /**
   * Verifica si el cliente está conectado
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}

/**
 * Crea un cliente MCP para el servidor Playwright via stdio (legacy)
 */
export function createPlaywrightMCPClient(): MCPClient {
  return new MCPClient({
    type: 'stdio',
    command: "node",
    args: [
      // Asumiendo que el servidor MCP de Playwright está instalado globalmente
      // o en node_modules
      "node_modules/@modelcontextprotocol/server-playwright/dist/index.js"
    ],
  });
}

/**
 * Crea un cliente MCP para conectarse a un servidor HTTP existente
 */
export function createHTTPMCPClient(url: string): MCPClient {
  return new MCPClient({
    type: 'http',
    url,
  });
}

/**
 * Crea un cliente MCP genérico con configuración personalizada
 */
export function createCustomMCPClient(config: MCPServerConfig): MCPClient {
  return new MCPClient(config);
}
