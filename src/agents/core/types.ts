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
  // Para conexión stdio (legacy - lanzar proceso)
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  
  // Para conexión HTTP (nuevo - conectar a servidor existente)
  url?: string;  // URL del servidor MCP (ej: http://localhost:3001)
  
  // Tipo de conexión
  type: 'stdio' | 'http';
  
  // Filtro de herramientas: si se especifica, solo se cargarán estas herramientas
  // Si está vacío o undefined, se cargarán todas las herramientas del servidor
  allowedTools?: string[];
}

/**
 * Configuración de un agente
 */
export interface AgentConfig {
  name: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
  tools: ToolConfig[];
  verbose?: boolean;
  mcpServers?: MCPServerConfig[];
  messageLimit?: number; // Límite de mensajes de cada tipo a mantener en el historial (default: 10)
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
