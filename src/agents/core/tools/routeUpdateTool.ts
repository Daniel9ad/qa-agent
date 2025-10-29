import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import Route from "@/models/Route";
import connectDB from "@/lib/mongodb";
import { ROUTE_UPDATE_TOOL } from "../prompts/tools";

/**
 * Herramienta para actualizar el estado de una ruta
 * Permite al agente marcar rutas como exploradas o actualizar su información
 */
export const routeUpdateTool = () => {
  return new DynamicStructuredTool({
    name: "update_route",
    description: ROUTE_UPDATE_TOOL,
    schema: z.object({
      routeId: z.string().describe("El ID de la ruta a actualizar"),
      description: z.string().optional().describe("Nueva descripción de la ruta"),
      url: z.string().optional().describe("Nueva URL de la ruta"),
    }),
    func: async ({ routeId, description, url }) => {
      try {
        await connectDB();

        // Verificar que la ruta existe
        const existingRoute = await Route.findById(routeId);
        if (!existingRoute) {
          return JSON.stringify({
            success: false,
            error: `Ruta con ID ${routeId} no encontrada`,
          }, null, 2);
        }

        // Construir objeto de actualización
        const updateData: any = {};
        if (description !== undefined) updateData.description = description;
        if (url !== undefined) updateData.url = url;

        if (Object.keys(updateData).length === 0) {
          return JSON.stringify({
            success: false,
            error: "No se proporcionaron campos para actualizar",
          }, null, 2);
        }

        // Actualizar la ruta
        const updatedRoute = await Route.findByIdAndUpdate(
          routeId,
          updateData,
          { new: true, runValidators: true }
        ).populate('projectId', 'name url');

        return JSON.stringify({
          success: true,
          message: "Ruta actualizada exitosamente",
          route: {
            id: updatedRoute._id,
            projectId: updatedRoute.projectId,
            url: updatedRoute.url,
            description: updatedRoute.description,
            updatedAt: updatedRoute.updatedAt,
          },
          changes: updateData,
        }, null, 2);
      } catch (error) {
        console.error("Error updating route:", error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido al actualizar la ruta",
        }, null, 2);
      }
    },
  });
};
