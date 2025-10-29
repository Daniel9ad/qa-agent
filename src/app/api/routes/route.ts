import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/Route';
import Project from '@/models/Project';

/**
 * GET /api/routes - Obtener todas las rutas o filtrar por proyecto
 * Query params:
 *  - projectId: (opcional) Filtrar rutas por proyecto
 *  - explored: (opcional) Filtrar rutas por estado de exploración (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const explored = searchParams.get('explored');

    // Construir filtros
    const filter: any = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (explored !== null) {
      filter.explored = explored === 'true';
    }

    // Obtener rutas con información del proyecto
    const routes = await Route.find(filter)
      .populate('projectId', 'name url')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      routes,
      count: routes.length,
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al obtener las rutas' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/routes - Crear una nueva ruta
 * Body: { projectId, url, description?, explored? }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { projectId, url, description = '', explored = false } = body;

    // Validar datos requeridos
    if (!projectId || !url) {
      return NextResponse.json(
        { success: false, error: 'projectId y url son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si la ruta ya existe
    const existingRoute = await Route.findOne({ projectId, url });
    if (existingRoute) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Esta ruta ya existe para el proyecto',
          route: existingRoute,
        },
        { status: 409 }
      );
    }

    // Crear la ruta
    const route = await Route.create({
      projectId,
      url,
      description,
      explored,
    });

    // Poblar la información del proyecto
    await route.populate('projectId', 'name url');

    return NextResponse.json({
      success: true,
      message: 'Ruta creada exitosamente',
      route,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al crear la ruta' 
      },
      { status: 500 }
    );
  }
}
