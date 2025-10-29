import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/Route';

/**
 * GET /api/routes/[id] - Obtener una ruta específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const route = await Route.findById(params.id)
      .populate('projectId', 'name url')
      .lean();

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      route,
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al obtener la ruta' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/routes/[id] - Actualizar una ruta
 * Body: { url?, description?, explored? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { url, description, explored } = body;

    // Construir objeto de actualización
    const updateData: any = {};
    if (url !== undefined) updateData.url = url;
    if (description !== undefined) updateData.description = description;
    if (explored !== undefined) updateData.explored = explored;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    const route = await Route.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('projectId', 'name url');

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ruta actualizada exitosamente',
      route,
    });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al actualizar la ruta' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/routes/[id] - Eliminar una ruta
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const route = await Route.findByIdAndDelete(params.id);

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ruta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al eliminar la ruta' 
      },
      { status: 500 }
    );
  }
}
