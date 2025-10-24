/**
 * Cliente MCP para conectarse a servidores MCP
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { MCPServerConfig } from "../core/types";

/**
 * Cliente para conectarse a un servidor MCP y convertir sus herramientas
 * a herramientas de LangChain
 */
export class MCPClient {
  private client: Client;
  private transport?: StdioClientTransport;
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
      return;
    }

    try {
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env: this.config.env,
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      console.log(`[MCP] Connected to server: ${this.config.command}`);
    } catch (error) {
      console.error("[MCP] Failed to connect:", error);
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
      const response = await this.client.listTools();
      return response.tools || [];
    } catch (error) {
      console.error("[MCP] Error listing tools:", error);
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
    const mcpTools = await this.listTools();
    const langchainTools: DynamicStructuredTool[] = [];

    for (const tool of mcpTools) {
      try {
        // Convertir el schema JSON Schema a Zod
        const zodSchema = this.jsonSchemaToZod(tool.inputSchema);

        const langchainTool = new DynamicStructuredTool({
          name: tool.name,
          description: tool.description || `MCP tool: ${tool.name}`,
          schema: zodSchema,
          func: async (args: Record<string, any>) => {
            try {
              const result = await this.callTool(tool.name, args);
              
              // Extraer el contenido de la respuesta
              if (result.content && Array.isArray(result.content)) {
                const textContents = result.content
                  .filter((item: any) => item.type === "text")
                  .map((item: any) => item.text)
                  .join("\n");
                return textContents || JSON.stringify(result);
              }
              
              return JSON.stringify(result);
            } catch (error) {
              return `Error executing tool ${tool.name}: ${error instanceof Error ? error.message : String(error)}`;
            }
          },
        });

        langchainTools.push(langchainTool);
      } catch (error) {
        console.error(`[MCP] Error converting tool ${tool.name}:`, error);
      }
    }

    console.log(`[MCP] Converted ${langchainTools.length} tools to LangChain format`);
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
 * Crea un cliente MCP para el servidor Playwright
 */
export function createPlaywrightMCPClient(): MCPClient {
  return new MCPClient({
    command: "node",
    args: [
      // Asumiendo que el servidor MCP de Playwright está instalado globalmente
      // o en node_modules
      "node_modules/@modelcontextprotocol/server-playwright/dist/index.js"
    ],
  });
}

/**
 * Crea un cliente MCP genérico con configuración personalizada
 */
export function createCustomMCPClient(config: MCPServerConfig): MCPClient {
  return new MCPClient(config);
}
