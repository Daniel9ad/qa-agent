import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';

// GET /api/projects - Obtener todos los proyectos
export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener los proyectos',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Crear un nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { name, url } = body;
    
    if (!name || !url) {
      return NextResponse.json(
        {
          success: false,
          error: 'El nombre y la URL son requeridos',
        },
        { status: 400 }
      );
    }
    
    // Crear el proyecto
    const project = await Project.create({
      name,
      url,
      viewsCount: 0,
      flowsCount: 0,
      isActive: false,
    });
    
    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear proyecto:', error);
    
    // Errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          error: Object.values(error.errors).map((e: any) => e.message).join(', '),
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear el proyecto',
      },
      { status: 500 }
    );
  }
}
