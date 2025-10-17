import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/auth/register - Registrar un nuevo usuario
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { user, password, firstName, lastName } = body;
    
    // Validación básica
    if (!user || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todos los campos son requeridos',
        },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres',
        },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ user: user.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'El usuario ya existe',
        },
        { status: 409 }
      );
    }

    // Crear el usuario (el password se hashea automáticamente con el pre-save hook)
    const newUser = await User.create({
      user: user.toLowerCase(),
      password,
      firstName,
      lastName,
    });

    // Retornar usuario sin el password
    const userResponse = {
      id: newUser._id,
      user: newUser.user,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario registrado exitosamente',
        data: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    
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

    // Error de duplicado (unique constraint)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'El usuario ya existe',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al registrar el usuario',
      },
      { status: 500 }
    );
  }
}
