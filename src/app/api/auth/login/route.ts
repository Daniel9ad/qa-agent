import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/auth/login - Autenticar usuario
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { user, password } = body;
    
    // Validación básica
    if (!user || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario y contraseña son requeridos',
        },
        { status: 400 }
      );
    }

    // Buscar usuario
    const foundUser = await User.findOne({ user: user.toLowerCase() });
    
    if (!foundUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await foundUser.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Retornar usuario sin el password
    const userResponse = {
      id: foundUser._id,
      user: foundUser.user,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
    };

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: userResponse,
    });
  } catch (error: any) {
    console.error('Error al hacer login:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar el login',
      },
      { status: 500 }
    );
  }
}
