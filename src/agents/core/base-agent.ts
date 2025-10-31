/**
 * Clase base abstracta para todos los agentes
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { StateGraph, END } from "@langchain/langgraph";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { AgentConfig, AgentState, AgentResult, AgentExecutionMetadata, AgentStateAnnotation } from "./types";
import { MCPClient } from "./mcp-client";

export abstract class BaseAgent {
  config: AgentConfig;
  tools: DynamicStructuredTool[] = [];
  graph?: StateGraph<typeof AgentStateAnnotation.spec>;
  metadata: AgentExecutionMetadata;
  mcpClients: MCPClient[] = [];
  public onProgress?: (event: any) => void;

  constructor(config: AgentConfig) {
    this.config = config;
    this.metadata = {
      agentName: config.name,
      startTime: new Date(),
      status: 'running',
      iterationCount: 0,
    };
  }

  /**
   * Método abstracto para definir las herramientas del agente
   */
  protected abstract defineTools(): DynamicStructuredTool[];

  /**
   * Método abstracto para construir el grafo del agente
   */
  protected abstract buildGraph(): StateGraph<typeof AgentStateAnnotation.spec>;

  /**
   * Inicializa el agente
   */
  async initialize(): Promise<void> {
    // Primero definir herramientas base
    this.tools = this.defineTools();
    
    // Luego inicializar servidores MCP y agregar sus herramientas
    if (this.config.mcpServers && this.config.mcpServers.length > 0) {
      await this.initializeMCPServers();
    }
    
    // Finalmente construir grafo con todas las herramientas disponibles
    this.graph = this.buildGraph();
    
    if (this.config.verbose) {
      console.log(`[${this.config.name}] Agent initialized with ${this.tools.length} tools`);
      if (this.mcpClients.length > 0) {
        console.log(`[${this.config.name}] Connected to ${this.mcpClients.length} MCP server(s)`);
      }
      console.log(`[${this.config.name}] Available tools: ${this.tools.map(t => t.name).join(', ')}`);
    }
  }

  /**
   * Inicializa los servidores MCP configurados
   */
  private async initializeMCPServers(): Promise<void> {
    if (!this.config.mcpServers || this.config.mcpServers.length === 0) {
      return;
    }

    console.log(`[${this.config.name}] Starting MCP servers initialization...`);
    console.log(`[${this.config.name}] Total MCP servers to connect: ${this.config.mcpServers.length}`);

    this.onProgress?.({
      step: 'mcp_init',
      message: `Conectando a ${this.config.mcpServers.length} servidor(es) MCP...`,
      details: { serverCount: this.config.mcpServers.length }
    });

    for (const mcpConfig of this.config.mcpServers) {
      try {
        const identifier = mcpConfig.type === 'http' ? mcpConfig.url : mcpConfig.command;
        
        if (this.config.verbose) {
          console.log(`[${this.config.name}] 🔌 Connecting to MCP server (${mcpConfig.type})...`);
          console.log(`[${this.config.name}] Target: ${identifier}`);
          
          if (mcpConfig.type === 'stdio') {
            console.log(`[${this.config.name}] Args: ${JSON.stringify(mcpConfig.args || [])}`);
          }
        }

        this.onProgress?.({
          step: 'mcp_connecting',
          message: `Conectando a MCP: ${identifier}`,
          details: { type: mcpConfig.type, identifier }
        });

        const mcpClient = new MCPClient(mcpConfig);
        await mcpClient.connect();

        // Convertir herramientas MCP a LangChain
        const mcpTools = await mcpClient.toLangChainTools();
        
        if (mcpTools.length === 0) {
          console.warn(`[${this.config.name}] ⚠️  No tools received from MCP server ${identifier}`);
          this.onProgress?.({
            step: 'mcp_warning',
            message: `Sin herramientas del servidor MCP ${identifier}`,
            details: { identifier }
          });
        } else {
          this.tools.push(...mcpTools);
          console.log(`[${this.config.name}] ✅ Added ${mcpTools.length} MCP tools:`, mcpTools.map(t => t.name).join(', '));
          
          this.onProgress?.({
            step: 'mcp_connected',
            message: `Conectado a MCP: ${mcpTools.length} herramientas agregadas`,
            details: { 
              identifier,
              toolCount: mcpTools.length,
              tools: mcpTools.map(t => t.name)
            }
          });
        }

        // Guardar cliente para cleanup posterior
        this.mcpClients.push(mcpClient);

        if (this.config.verbose) {
          console.log(`[${this.config.name}] ✅ Successfully connected to MCP server`);
        }
      } catch (error) {
        const identifier = mcpConfig.type === 'http' ? mcpConfig.url : mcpConfig.command;
        console.error(`[${this.config.name}] ❌ Failed to connect to MCP server ${identifier}:`);
        console.error(error);
        if (error instanceof Error) {
          console.error(`[${this.config.name}] Error message: ${error.message}`);
          console.error(`[${this.config.name}] Error stack:`, error.stack);
        }
        
        this.onProgress?.({
          step: 'mcp_error',
          message: `Error conectando a MCP: ${identifier}`,
          details: { 
            identifier,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        // Continuar sin este servidor MCP
      }
    }

    console.log(`[${this.config.name}] MCP initialization complete. Total tools now: ${this.tools.length}`);
    
    this.onProgress?.({
      step: 'mcp_complete',
      message: `Inicialización MCP completa: ${this.tools.length} herramientas totales`,
      details: { 
        totalTools: this.tools.length,
        mcpServers: this.mcpClients.length
      }
    });
  }

  /**
   * Ejecuta el agente con un input
   */
  async run(input: string | BaseMessage[]): Promise<AgentResult> {
    if (!this.graph) {
      await this.initialize();
    }

    this.metadata.startTime = new Date();
    this.metadata.status = 'running';

    try {
      const messages = typeof input === 'string' 
        ? [new HumanMessage(input)]
        : input;

      const initialState: AgentState = {
        messages,
      };

      const compiledGraph = this.graph!.compile();
      const result = await compiledGraph.invoke(initialState);

      this.metadata.endTime = new Date();
      this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
      this.metadata.status = 'completed';

      return {
        success: true,
        data: result,
        messages: result.messages as any,
      };
    } catch (error) {
      this.metadata.endTime = new Date();
      this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
      this.metadata.status = 'failed';

      if (this.config.verbose) {
        console.error(`[${this.config.name}] Error:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtiene los metadatos de ejecución
   */
  getMetadata(): AgentExecutionMetadata {
    return { ...this.metadata };
  }

  /**
   * Cancela la ejecución del agente
   */
  async cancel(): Promise<void> {
    this.metadata.status = 'cancelled';
    this.metadata.endTime = new Date();
    this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
    
    // Limpiar conexiones MCP
    await this.cleanup();
  }

  /**
   * Limpia recursos (conexiones MCP, etc.)
   */
  async cleanup(): Promise<void> {
    for (const mcpClient of this.mcpClients) {
      try {
        if (mcpClient.isClientConnected()) {
          await mcpClient.disconnect();
        }
      } catch (error) {
        console.error(`[${this.config.name}] Error disconnecting MCP client:`, error);
      }
    }
    this.mcpClients = [];
  }
}
