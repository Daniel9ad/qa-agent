import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import Route from "@/models/Route";
import Project from "@/models/Project";
import connectDB from "@/lib/mongodb";
import { ROUTE_LIST_TOOL } from "../prompts/tools";

/**
 * Herramienta para listar rutas de un proyecto
 * Permite al agente consultar las rutas registradas
 */
export const routeListTool = () => {
  return new DynamicStructuredTool({
    name: "list_routes",
    description: ROUTE_LIST_TOOL,
    schema: z.object({
      projectId: z.string().describe("El ID del proyecto del cual listar las rutas"),
      limit: z.number().optional().describe("Número máximo de rutas a retornar (por defecto: 50)"),
    }),
    func: async ({ projectId, limit = 50 }) => {
      try {
        await connectDB();

        // Verificar que el proyecto existe
        const project = await Project.findById(projectId);
        if (!project) {
          return JSON.stringify({
            success: false,
            error: `Proyecto con ID ${projectId} no encontrado`,
          }, null, 2);
        }

        // Construir filtro
        const filter: any = { projectId };

        // Obtener rutas
        const routes = await Route.find(filter)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean();

        // Estadísticas
        const totalRoutes = await Route.countDocuments({ projectId });
        const unexploredCount = await Route.countDocuments({ projectId, explored: false });

        return JSON.stringify({
          success: true,
          project: {
            id: project._id,
            name: project.name,
            url: project.url,
          },
          statistics: {
            total: totalRoutes,
            unexplored: unexploredCount,
          },
          routes: routes.map(route => ({
            id: route._id,
            url: route.url,
            description: route.description,
            createdAt: route.createdAt,
          })),
          count: routes.length,
        }, null, 2);
      } catch (error) {
        console.error("Error listing routes:", error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido al listar las rutas",
        }, null, 2);
      }
    },
  });
};
