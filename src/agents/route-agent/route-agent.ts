import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { BaseAgent } from "@/agents/core/base-agent";
import { AgentConfig } from "@/agents/core/types";
import { routeCreationTool } from "../core/tools/routeCreationTool";
import { routeListTool } from "../core/tools/routeListTool";
import { routeUpdateTool } from "../core/tools/routeUpdateTool";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { limitedMessageReducer } from "../core/message";

/**
 * Configuración por defecto para el agente de rutas
 */
export const defaultRouteAgentConfig: AgentConfig = {
  name: "RouteAgent",
  model: "gemini-2.0-flash",
  temperature: 0.4, // Reducido para comportamiento más determinista con herramientas
  maxIterations: 80,
  tools: [
    {
      name: "create_route",
      description: "Crea rutas para proyectos web",
      enabled: true,
    },
    // {
    //   name: "list_routes",
    //   description: "Lista rutas de un proyecto",
    //   enabled: true,
    // },
    // {
    //   name: "update_route",
    //   description: "Actualiza información de una ruta",
    //   enabled: true,
    // },
  ],
  mcpServers: [
    {
      type: 'http',
      url: process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:3002/sse',
      allowedTools: [
        'browser_navigate',
        'browser_snapshot',
        'browser_click',
        'browser_type',
        'browser_take_screenshot',
        'browser_close',
        // 'browser_hover',
        // 'browser_select_option',
        // 'browser_fill_form',
        // 'browser_press_key',
        // 'browser_wait_for',
        // 'browser_console_messages',
        // 'browser_network_requests',
      ],
    },
  ],
  verbose: true,
  messageLimit: 4, // Límite de mensajes de cada tipo a mantener en el historial
};

/**
 * Merge two file dictionaries, with right side taking precedence.
 * 
 * Used as a reducer function for the files field in agent state,
 * allowing incremental updates to the virtual file system.
 * 
 * @param left - Existing files dictionary
 * @param right - New/updated files dictionary
 * @returns Merged dictionary with right values overriding left values
 */
function fileReducer(
  left: Record<string, string>,
  right: Record<string, string>
): Record<string, string> {
  if (!left || Object.keys(left).length === 0) {
    return right || {};
  }
  if (!right || Object.keys(right).length === 0) {
    return left || {};
  }
  return { ...left, ...right };
}

/**
 * Crea un estado extendido del RouteAgent que incluye:
 * - messages: Historial de mensajes limitado (solo los últimos N de cada tipo)
 * - files: Sistema de archivos virtual como diccionario (nombre → contenido)
 * 
 * @param messageLimit - Número máximo de mensajes de cada tipo a mantener
 * @returns Anotación de estado configurada
 */
function createRouteAgentStateAnnotation(messageLimit: number = 10) {
  return Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (left, right) => limitedMessageReducer(left, right, messageLimit),
      default: () => [],
    }),
    files: Annotation<Record<string, string>>({
      reducer: fileReducer,
      default: () => ({}),
    }),
  });
}

/**
 * Estado extendido del RouteAgent (por defecto con límite de 10 mensajes)
 */
export const RouteAgentStateAnnotation = createRouteAgentStateAnnotation(10);

export type RouteAgentState = typeof RouteAgentStateAnnotation.State;

export class RouteAgent extends BaseAgent {
  private model?: ChatGoogleGenerativeAI;
  private reactAgent?: any;
  private messageLimit: number;
  private stateAnnotation: any;
  public onProgress?: (event: any) => void;

  constructor(config: Partial<AgentConfig> = {}) {
    super({ ...defaultRouteAgentConfig, ...config });
    this.messageLimit = this.config.messageLimit || 10;
    // Crear la anotación de estado con el límite configurado
    this.stateAnnotation = createRouteAgentStateAnnotation(this.messageLimit);
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
      console.log(`[${this.config.name}] Message limit per type: ${this.messageLimit}`);
    }

    // Crear el agente React usando el helper prebuilt de LangGraph
    this.reactAgent = createReactAgent({
      llm: this.model,
      tools: this.tools,
      messageModifier: SYSTEM_PROMPT,
      stateSchema: this.stateAnnotation,
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
    return new (require("@langchain/langgraph").StateGraph)(this.stateAnnotation);
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
      const messages: BaseMessage[] = typeof input === 'string' 
        ? [new HumanMessage(input)]
        : input;

      const initialState = {
        messages,
        files: {},
      };

      if (this.config.verbose) {
        console.log(`[${this.config.name}] 🚀 Executing React Agent...`);
        console.log(`[${this.config.name}] Initial messages: ${messages.length}`);
      }

      // Emitir evento de inicio de ejecución
      this.onProgress?.({
        step: 'agent_start',
        message: 'Iniciando ejecución del agente...',
        details: { messageCount: messages.length }
      });

      // Usar streaming para capturar iteraciones en tiempo real
      let iterationCount = 0;
      let finalResult: any = null;

      // Stream las actualizaciones del agente
      const stream = await this.reactAgent!.stream(initialState, {
        streamMode: 'values',
      });

      for await (const chunk of stream) {
        iterationCount++;
        
        // Obtener el último mensaje del estado
        const lastMessage = chunk.messages?.[chunk.messages.length - 1];
        
        if (lastMessage) {
          const messageType = lastMessage.constructor?.name || 'Message';
          const hasToolCalls = lastMessage.tool_calls && lastMessage.tool_calls.length > 0;
          const toolCalls = lastMessage.tool_calls?.map((tc: any) => tc.name) || [];

          // Emitir progreso de iteración
          this.onProgress?.({
            step: 'agent_iteration',
            message: `Iteración ${iterationCount} - ${messageType}`,
            details: {
              iteration: iterationCount,
              messageType,
              hasToolCalls,
              toolCalls,
              totalMessages: chunk.messages?.length || 0,
            }
          });

          // Si hay tool calls, emitir información sobre las herramientas
          if (hasToolCalls) {
            for (const toolCall of lastMessage.tool_calls) {
              this.onProgress?.({
                step: 'tool_call',
                message: `🔧 Ejecutando: ${toolCall.name}`,
                details: {
                  iteration: iterationCount,
                  toolName: toolCall.name,
                  args: toolCall.args,
                }
              });
            }
          }

          // Si es un mensaje de respuesta de herramienta
          if (messageType === 'ToolMessage') {
            const content = typeof lastMessage.content === 'string' 
              ? lastMessage.content.substring(0, 300) 
              : JSON.stringify(lastMessage.content).substring(0, 300);
            
            this.onProgress?.({
              step: 'tool_response',
              message: `✓ Respuesta de herramienta`,
              details: {
                iteration: iterationCount,
                content: content,
                toolName: lastMessage.name || 'unknown',
              }
            });
          }

          // Si es un mensaje de IA (respuesta del modelo)
          if (messageType === 'AIMessage' && !hasToolCalls) {
            const content = typeof lastMessage.content === 'string' 
              ? lastMessage.content.substring(0, 200) 
              : 'Non-text response';
            
            this.onProgress?.({
              step: 'agent_thinking',
              message: `💭 Agente respondiendo...`,
              details: {
                iteration: iterationCount,
                preview: content,
              }
            });
          }
        }

        // Guardar el último chunk como resultado final
        finalResult = chunk;
      }

      const result = finalResult;
      
      this.metadata.endTime = new Date();
      this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
      this.metadata.status = 'completed';
      this.metadata.iterationCount = iterationCount;

      if (this.config.verbose) {
        console.log(`[${this.config.name}] ✅ Execution completed in ${this.metadata.duration}ms`);
        console.log(`[${this.config.name}] Final messages in state: ${result.messages?.length || 0}`);
      }

      // Emitir evento final
      this.onProgress?.({
        step: 'agent_complete',
        message: 'Ejecución completada exitosamente',
        details: {
          duration: this.metadata.duration,
          iterations: iterationCount,
          messageCount: result.messages?.length || 0,
        }
      });

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

      // Emitir evento de error
      this.onProgress?.({
        step: 'agent_error',
        message: 'Error durante la ejecución',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
