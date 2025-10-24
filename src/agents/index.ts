/**
 * Punto de entrada principal para el sistema de agentes
 */

// Core exports
export { BaseAgent } from './core/base-agent';
export type { 
  AgentConfig, 
  AgentState, 
  AgentResult,
  AgentExecutionMetadata,
  ToolConfig,
  MCPServerConfig,
} from './core/types';
export { AgentStateAnnotation } from './core/types';

// Implementations
export { 
  ContextAnalyzerAgent,
  defaultContextAnalyzerConfig 
} from './implementations/context-analyzer-agent';

// Tools
export {
  createContextAnalysisTool,
  createSearchTool,
  createDataProcessingTool,
} from './tools/simulated-tools';

// MCP Client
export {
  MCPClient,
  createPlaywrightMCPClient,
  createCustomMCPClient,
} from './tools/mcp-client';
