import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseAgent } from "@/agents/core/base-agent";
import { AgentConfig, AgentState, AgentStateAnnotation } from "@/agents/core/types";
import { routeCreationTool } from "../core/tools/routeCreationTool";
import { routeListTool } from "../core/tools/routeListTool";
import { routeUpdateTool } from "../core/tools/routeUpdateTool";
import { SYSTEM_PROMPT } from "./systemPrompt";

/**
 * Configuración por defecto para el agente de rutas
 */
export const defaultRouteAgentConfig: AgentConfig = {
  name: "RouteAgent",
  model: "gemini-2.5-flash",
  temperature: 0.7,
  maxIterations: 80,
  tools: [
    {
      name: "create_route",
      description: "Crea rutas para proyectos web",
      enabled: true,
    },
    {
      name: "list_routes",
      description: "Lista rutas de un proyecto",
      enabled: true,
    },
    {
      name: "update_route",
      description: "Actualiza información de una ruta",
      enabled: true,
    },
  ],
  mcpServers: [
    {
      type: 'http',
      url: process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:3001/sse',
    },
  ],
  verbose: true,
};

export class RouteAgent extends BaseAgent {
  private model?: ChatGoogleGenerativeAI;
  private reactAgent?: any;

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...defaultRouteAgentConfig, ...config });
  }

  initializeModel(apiKey?: string): void {
    const key = apiKey;
    
    if (!key) {
      if (this.config.verbose) {
        console.warn(`[${this.config.name}] No Google API key provided, LLM will not be available`);
      }
      return;
    }

    // Vincular las herramientas al modelo
    const tools = this.defineTools();
    
    this.model = new ChatGoogleGenerativeAI({
      model: this.config.model || "gemini-2.5-flash",
      temperature: this.config.temperature || 0.7,
      apiKey: key,
    });

    if (this.config.verbose) {
      console.log(`[${this.config.name}] Initialized Google Gemini model: ${this.config.model || "gemini-2.5-flash"}`);
      console.log(`[${this.config.name}] Tools available: ${tools.length}`);
    }
  }

  protected defineTools(): DynamicStructuredTool[] {
    const tools: DynamicStructuredTool[] = [];
    this.config.tools.forEach((toolConfig) => {
      if (!toolConfig.enabled) return;

      switch (toolConfig.name) {
        case "create_route":
          tools.push(routeCreationTool());
          break;
        case "list_routes":
          tools.push(routeListTool());
          break;
        case "update_route":
          tools.push(routeUpdateTool());
          break;
      }
    });
    return tools;
  }

  protected buildGraph() {
    if (!this.model) {
      throw new Error(`[${this.config.name}] Model not initialized. Call initializeModel() first.`);
    }

    if (this.config.verbose) {
      console.log(`[${this.config.name}] Building React Agent with ${this.tools.length} tools`);
      console.log(`[${this.config.name}] Tools: ${this.tools.map(t => t.name).join(', ')}`);
    }

    // Crear el agente React usando el helper prebuilt de LangGraph
    this.reactAgent = createReactAgent({
      llm: this.model,
      tools: this.tools,
      messageModifier: SYSTEM_PROMPT,
    });

    // Configurar límite de recursión
    this.reactAgent = this.reactAgent.withConfig({
      recursionLimit: this.config.maxIterations || 20,
    });

    if (this.config.verbose) {
      console.log(`[${this.config.name}] ✅ React Agent created successfully`);
      console.log(`[${this.config.name}] Recursion limit: ${this.config.maxIterations || 20}`);
    }

    // Retornar un StateGraph dummy para cumplir con la interfaz
    return new (require("@langchain/langgraph").StateGraph)(AgentStateAnnotation);
  }

  async run(input: string | any[]): Promise<any> {
    if (!this.model) {
      throw new Error(`[${this.config.name}] Model not initialized. Call initializeModel() first.`);
    }

    if (!this.reactAgent) {
      await this.initialize();
    }

    this.metadata.startTime = new Date();
    this.metadata.status = 'running';

    try {
      const messages = typeof input === 'string' 
        ? [{ role: 'user', content: input }]
        : input;

      const initialState = {
        messages,
      };

      if (this.config.verbose) {
        console.log(`[${this.config.name}] 🚀 Executing React Agent...`);
      }

      // Invocar el agente React directamente (ya está compilado)
      const result = await this.reactAgent!.invoke(initialState);

      this.metadata.endTime = new Date();
      this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
      this.metadata.status = 'completed';

      if (this.config.verbose) {
        console.log(`[${this.config.name}] ✅ Execution completed in ${this.metadata.duration}ms`);
      }

      return {
        success: true,
        data: result,
        messages: result.messages,
      };
    } catch (error) {
      this.metadata.endTime = new Date();
      this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
      this.metadata.status = 'failed';

      if (this.config.verbose) {
        console.error(`[${this.config.name}] ❌ Error:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
