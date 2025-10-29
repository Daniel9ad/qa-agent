import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import Route from "@/models/Route";
import Project from "@/models/Project";
import connectDB from "@/lib/mongodb";
import { ROUTE_CREATION_TOOL } from "../prompts/tools";

/**
 * Herramienta para crear rutas (routes) de una aplicación web
 * Permite al agente registrar las rutas de un proyecto en la base de datos
 */
export const routeCreationTool = () => {
  return new DynamicStructuredTool({
    name: "create_route",
    description: ROUTE_CREATION_TOOL,
    schema: z.object({
      projectId: z.string().describe("El ID del proyecto al que pertenece la ruta"),
      url: z.string().describe("La URL de la ruta (puede ser relativa o absoluta)"),
      description: z.string().optional().describe("Descripción de la funcionalidad o propósito de esta ruta"),
    }),
    func: async ({ projectId, url, description = "" }) => {
      try {
        // Conectar a la base de datos
        await connectDB();

        // Verificar que el proyecto existe
        const project = await Project.findById(projectId);
        if (!project) {
          return JSON.stringify({
            success: false,
            error: `Proyecto con ID ${projectId} no encontrado`,
          }, null, 2);
        }

        // Verificar si la ruta ya existe para este proyecto
        const existingRoute = await Route.findOne({ projectId, url });
        if (existingRoute) {
          return JSON.stringify({
            success: false,
            error: `La ruta "${url}" ya existe para este proyecto`,
            existingRoute: {
              id: existingRoute._id,
              url: existingRoute.url,
              description: existingRoute.description,
            },
          }, null, 2);
        }

        // Crear la nueva ruta
        const newRoute = await Route.create({
          projectId,
          url,
          description,
        });

        return JSON.stringify({
          success: true,
          message: "Ruta creada exitosamente",
          route: {
            id: newRoute._id,
            projectId: newRoute.projectId,
            url: newRoute.url,
            description: newRoute.description,
            createdAt: newRoute.createdAt,
          },
          project: {
            id: project._id,
            name: project.name,
          },
        }, null, 2);
      } catch (error) {
        console.error("Error creating route:", error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido al crear la ruta",
        }, null, 2);
      }
    },
  });
};
