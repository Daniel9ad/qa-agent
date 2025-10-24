/**
 * Agente especializado en análisis de contexto
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { StateGraph, END, START } from "@langchain/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseAgent } from "../core/base-agent";
import { AgentConfig, AgentState, AgentStateAnnotation } from "../core/types";
import { 
  createContextAnalysisTool,
  createSearchTool,
  createDataProcessingTool 
} from "../tools/simulated-tools";
import { MCPClient } from "../tools/mcp-client";

/**
 * Configuración por defecto para el agente de análisis de contexto
 */
export const defaultContextAnalyzerConfig: AgentConfig = {
  name: "ContextAnalyzer",
  description: "Agente especializado en analizar contexto y proporcionar insights detallados",
  model: "gemini-2.5-flash",
  temperature: 0.7,
  maxIterations: 5,
  tools: [
    {
      name: "analyze_context",
      description: "Analiza contexto en profundidad",
      enabled: true,
    },
    {
      name: "search_information",
      description: "Busca información adicional",
      enabled: true,
    },
    {
      name: "process_data",
      description: "Procesa y estructura datos",
      enabled: true,
    },
  ],
  // Servidores MCP predefinidos para este agente
  mcpServers: [
    {
      command: "npx",
      args: ["-y", "@playwright/mcp@latest"],
    },
  ],
  verbose: true,
};

/**
 * Agente React para análisis de contexto
 */
export class ContextAnalyzerAgent extends BaseAgent {
  private model?: ChatGoogleGenerativeAI;

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...defaultContextAnalyzerConfig, ...config });
  }

  /**
   * Inicializa el modelo LLM de Google
   */
  initializeModel(apiKey?: string): void {
    const key = apiKey || process.env.GOOGLE_API_KEY;
    
    if (!key) {
      if (this.config.verbose) {
        console.warn(`[${this.config.name}] No Google API key provided, LLM will not be available`);
      }
      return;
    }

    this.model = new ChatGoogleGenerativeAI({
      model: this.config.model || "gemini-2.5-flash",
      temperature: this.config.temperature || 0.7,
      apiKey: key,
    });

    if (this.config.verbose) {
      console.log(`[${this.config.name}] Initialized Google Gemini model: ${this.config.model || "gemini-2.5-flash"}`);
    }
  }

  protected defineTools(): DynamicStructuredTool[] {
    const tools: DynamicStructuredTool[] = [];

    // Agregar herramientas simuladas según la configuración
    this.config.tools.forEach((toolConfig) => {
      if (!toolConfig.enabled) return;

      switch (toolConfig.name) {
        case "analyze_context":
          tools.push(createContextAnalysisTool());
          break;
        case "search_information":
          tools.push(createSearchTool());
          break;
        case "process_data":
          tools.push(createDataProcessingTool());
          break;
      }
    });

    // Nota: Las herramientas MCP se agregan automáticamente en BaseAgent.initialize()
    return tools;
  }

  protected buildGraph() {
    const graph = new StateGraph(AgentStateAnnotation);

    // Nodo de razonamiento
    graph.addNode("reasoning", async (state: AgentState) => {
      if (this.config.verbose) {
        console.log(`[${this.config.name}] Reasoning...`);
      }

      this.metadata.iterationCount = (this.metadata.iterationCount || 0) + 1;

      const lastMessage = state.messages[state.messages.length - 1];
      let thought: AIMessage;

      // Si tenemos modelo LLM, usarlo para razonar
      if (this.model) {
        try {
          const availableTools = this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
          
          const reasoningPrompt = `Eres un agente de análisis inteligente. 

Usuario: ${lastMessage.content}

Herramientas disponibles:
${availableTools}

Analiza la solicitud del usuario y determina qué herramientas usar y en qué orden. Explica tu razonamiento brevemente.`;

          const response = await this.model.invoke([
            new HumanMessage(reasoningPrompt)
          ]);

          thought = new AIMessage({
            content: `🤔 Razonamiento:\n${response.content}`,
          });
        } catch (error) {
          console.error('Error usando LLM para razonamiento:', error);
          // Fallback a razonamiento simple
          thought = new AIMessage({
            content: `Analizando la solicitud: "${lastMessage.content}". Voy a utilizar las herramientas disponibles para proporcionar un análisis completo.`,
          });
        }
      } else {
        // Razonamiento simple sin LLM
        thought = new AIMessage({
          content: `Analizando la solicitud: "${lastMessage.content}". Voy a utilizar las herramientas disponibles para proporcionar un análisis completo.`,
        });
      }

      return {
        messages: [thought],
      };
    });

    // Nodo de ejecución de herramientas
    graph.addNode("execute_tools", async (state: AgentState) => {
      if (this.config.verbose) {
        console.log(`[${this.config.name}] Executing tools...`);
      }

      const results = [];

      // Ejecutar análisis de contexto
      const contextTool = this.tools.find(t => t.name === "analyze_context");
      if (contextTool) {
        const lastMessage = state.messages[0];
        const analysisResult = await contextTool.invoke({
          context: lastMessage.content as string,
          depth: "detailed",
        });
        results.push({
          tool: "analyze_context",
          result: analysisResult,
        });
      }

      // Ejecutar búsqueda de información
      const searchTool = this.tools.find(t => t.name === "search_information");
      if (searchTool) {
        const searchResult = await searchTool.invoke({
          query: "información relevante sobre el contexto",
          limit: 3,
        });
        results.push({
          tool: "search_information",
          result: searchResult,
        });
      }

      const toolMessage = new AIMessage({
        content: `Herramientas ejecutadas exitosamente:\n${JSON.stringify(results, null, 2)}`,
      });

      return {
        messages: [toolMessage],
      };
    });

    // Nodo de síntesis final
    graph.addNode("synthesize", async (state: AgentState) => {
      if (this.config.verbose) {
        console.log(`[${this.config.name}] Synthesizing results...`);
      }

      let finalMessage: AIMessage;

      // Si tenemos modelo LLM, usarlo para sintetizar
      if (this.model) {
        try {
          // Extraer todos los resultados de las herramientas
          const toolResults = state.messages
            .filter((msg: any) => msg.constructor.name === 'AIMessage')
            .map((msg: any) => msg.content)
            .join('\n\n---\n\n');

          const synthesisPrompt = `Eres un agente de análisis. Sintetiza los siguientes resultados de manera clara y concisa:

${toolResults}

Proporciona un resumen ejecutivo y los puntos clave más importantes.`;

          const response = await this.model.invoke([
            new HumanMessage(synthesisPrompt)
          ]);

          finalMessage = new AIMessage({
            content: `✅ Análisis Completado\n\n${response.content}\n\n---\nIteraciones: ${this.metadata.iterationCount} | Herramientas usadas: ${this.tools.length}`,
          });
        } catch (error) {
          console.error('Error usando LLM para síntesis:', error);
          // Fallback a síntesis simple
          finalMessage = new AIMessage({
            content: `✅ Análisis completado exitosamente.\n\nHe procesado la información utilizando múltiples herramientas especializadas. Los resultados incluyen un análisis detallado del contexto y búsqueda de información relevante.\n\nIteraciones realizadas: ${this.metadata.iterationCount}`,
          });
        }
      } else {
        // Síntesis simple sin LLM
        finalMessage = new AIMessage({
          content: `✅ Análisis completado exitosamente.\n\nHe procesado la información utilizando múltiples herramientas especializadas. Los resultados incluyen un análisis detallado del contexto y búsqueda de información relevante.\n\nIteraciones realizadas: ${this.metadata.iterationCount}`,
        });
      }

      return {
        messages: [finalMessage],
      };
    });

    // Definir el flujo del grafo
    // @ts-ignore - LangGraph type inference issue
    graph.addEdge(START, "reasoning");
    // @ts-ignore
    graph.addEdge("reasoning", "execute_tools");
    // @ts-ignore
    graph.addEdge("execute_tools", "synthesize");
    // @ts-ignore
    graph.addEdge("synthesize", END);

    return graph;
  }
}
