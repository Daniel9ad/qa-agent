/**
 * Herramientas simuladas para pruebas
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Herramienta simulada de análisis de contexto
 */
export const createContextAnalysisTool = () => {
  return new DynamicStructuredTool({
    name: "analyze_context",
    description: "Analiza el contexto proporcionado y genera un reporte detallado. Útil para entender el contenido de documentos o información.",
    schema: z.object({
      context: z.string().describe("El contexto o texto a analizar"),
      depth: z.enum(["basic", "detailed", "comprehensive"]).optional().describe("Nivel de profundidad del análisis"),
    }),
    func: async ({ context, depth = "basic" }) => {
      // Simular un delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      const analysisLevels = {
        basic: {
          summary: `Análisis básico del contexto (${context.length} caracteres)`,
          keyPoints: ["Punto clave 1", "Punto clave 2"],
          sentiment: "neutral",
        },
        detailed: {
          summary: `Análisis detallado del contexto (${context.length} caracteres)`,
          keyPoints: ["Punto clave 1", "Punto clave 2", "Punto clave 3", "Punto clave 4"],
          sentiment: "neutral",
          topics: ["Tema 1", "Tema 2", "Tema 3"],
          complexity: "medium",
        },
        comprehensive: {
          summary: `Análisis comprehensivo del contexto (${context.length} caracteres)`,
          keyPoints: ["Punto clave 1", "Punto clave 2", "Punto clave 3", "Punto clave 4", "Punto clave 5"],
          sentiment: "neutral",
          topics: ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
          complexity: "medium",
          entities: ["Entidad 1", "Entidad 2"],
          recommendations: ["Recomendación 1", "Recomendación 2"],
        },
      };

      const result = analysisLevels[depth];

      return JSON.stringify(result, null, 2);
    },
  });
};

/**
 * Herramienta simulada de búsqueda de información
 */
export const createSearchTool = () => {
  return new DynamicStructuredTool({
    name: "search_information",
    description: "Busca información relevante sobre un tema específico. Útil para obtener datos actualizados.",
    schema: z.object({
      query: z.string().describe("La consulta de búsqueda"),
      limit: z.number().optional().describe("Número máximo de resultados"),
    }),
    func: async ({ query, limit = 5 }) => {
      // Simular un delay de búsqueda
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResults = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        title: `Resultado ${i + 1} para: ${query}`,
        snippet: `Este es un fragmento de información relevante sobre ${query}...`,
        relevance: Math.random().toFixed(2),
      }));

      return JSON.stringify({
        query,
        totalResults: mockResults.length,
        results: mockResults,
      }, null, 2);
    },
  });
};

/**
 * Herramienta simulada de procesamiento de datos
 */
export const createDataProcessingTool = () => {
  return new DynamicStructuredTool({
    name: "process_data",
    description: "Procesa y transforma datos según el formato especificado. Útil para limpiar y estructurar información.",
    schema: z.object({
      data: z.string().describe("Los datos a procesar"),
      operation: z.enum(["clean", "transform", "validate", "summarize"]).describe("Operación a realizar"),
    }),
    func: async ({ data, operation }) => {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 800));

      const operations = {
        clean: {
          operation: "clean",
          input_size: data.length,
          output_size: data.length,
          removed_items: 0,
          status: "completed",
        },
        transform: {
          operation: "transform",
          input_format: "raw",
          output_format: "structured",
          status: "completed",
        },
        validate: {
          operation: "validate",
          is_valid: true,
          errors: [],
          warnings: [],
          status: "completed",
        },
        summarize: {
          operation: "summarize",
          original_length: data.length,
          summary_length: Math.floor(data.length * 0.3),
          compression_ratio: "70%",
          status: "completed",
        },
      };

      return JSON.stringify(operations[operation], null, 2);
    },
  });
};
