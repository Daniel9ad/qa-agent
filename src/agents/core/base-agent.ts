/**
 * Clase base abstracta para todos los agentes
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { StateGraph, END } from "@langchain/langgraph";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { AgentConfig, AgentState, AgentResult, AgentExecutionMetadata, AgentStateAnnotation } from "./types";
import { MCPClient } from "../tools/mcp-client";

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected tools: DynamicStructuredTool[] = [];
  protected graph?: StateGraph<typeof AgentStateAnnotation.spec>;
  protected metadata: AgentExecutionMetadata;
  protected mcpClients: MCPClient[] = [];

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
    // Inicializar servidores MCP configurados
    if (this.config.mcpServers && this.config.mcpServers.length > 0) {
      await this.initializeMCPServers();
    }

    // Definir herramientas base
    this.tools = this.defineTools();
    
    // Construir grafo
    this.graph = this.buildGraph();
    
    if (this.config.verbose) {
      console.log(`[${this.config.name}] Agent initialized with ${this.tools.length} tools`);
      if (this.mcpClients.length > 0) {
        console.log(`[${this.config.name}] Connected to ${this.mcpClients.length} MCP server(s)`);
      }
    }
  }

  /**
   * Inicializa los servidores MCP configurados
   */
  private async initializeMCPServers(): Promise<void> {
    if (!this.config.mcpServers || this.config.mcpServers.length === 0) {
      return;
    }

    for (const mcpConfig of this.config.mcpServers) {
      try {
        if (this.config.verbose) {
          console.log(`[${this.config.name}] Connecting to MCP server: ${mcpConfig.command}...`);
        }

        const mcpClient = new MCPClient(mcpConfig);
        await mcpClient.connect();

        // Convertir herramientas MCP a LangChain
        const mcpTools = await mcpClient.toLangChainTools();
        this.tools.push(...mcpTools);

        // Guardar cliente para cleanup posterior
        this.mcpClients.push(mcpClient);

        if (this.config.verbose) {
          console.log(`[${this.config.name}] ✅ Connected to MCP server, loaded ${mcpTools.length} tools`);
        }
      } catch (error) {
        console.error(`[${this.config.name}] ⚠️  Failed to connect to MCP server ${mcpConfig.command}:`, error);
        // Continuar sin este servidor MCP
      }
    }
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
