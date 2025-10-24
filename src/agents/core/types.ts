/**
 * Tipos centrales para el sistema de agentes
 */

import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

/**
 * Estado base para todos los agentes
 */
export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;

/**
 * Resultado de la ejecución de un agente
 */
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  messages?: BaseMessage[];
}

/**
 * Configuración de una herramienta
 */
export interface ToolConfig {
  name: string;
  description: string;
  enabled: boolean;
}

/**
 * Configuración del servidor MCP
 */
export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Configuración de un agente
 */
export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
  tools: ToolConfig[];
  verbose?: boolean;
  mcpServers?: MCPServerConfig[];  // Servidores MCP que el agente debe usar
}

/**
 * Metadatos de ejecución del agente
 */
export interface AgentExecutionMetadata {
  agentName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  iterationCount?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}
