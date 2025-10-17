# Autenticación con NextAuth.js y MongoDB

## 📋 Descripción

Sistema de autenticación simple implementado con NextAuth.js v5 y MongoDB, usando credenciales (usuario/contraseña).

## 🔑 Características

- ✅ Registro de usuarios con validación
- ✅ Login con NextAuth.js
- ✅ Hash de contraseñas con bcryptjs
- ✅ Sesiones JWT
- ✅ Tipos TypeScript completos
- ✅ UI integrada con el diseño de la app

## 📁 Estructura

```
src/
├── models/
│   └── User.ts                      # Modelo de Usuario (Mongoose)
├── auth/
│   ├── auth.config.ts               # Configuración de providers
│   ├── auth.ts                      # Configuración principal de NextAuth
│   └── next-auth.d.ts               # Tipos de TypeScript
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/       # Endpoint de NextAuth
│   │       ├── register/route.ts    # Endpoint de registro
│   │       └── login/route.ts       # Endpoint de login (opcional)
│   ├── login/
│   │   └── page.tsx                 # Página de login
│   └── register/
│       └── page.tsx                 # Página de registro
```

## 🚀 Uso

### 1. Registrar un Usuario

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "user": "juan",
  "password": "123456",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": "6789abc...",
    "user": "juan",
    "firstName": "Juan",
    "lastName": "Pérez",
    "createdAt": "2024-10-17T..."
  }
}
```

**O desde la UI:** Ir a `/register`

### 2. Login

**Opción A - Con NextAuth (Recomendado):**

Usar la UI en `/login` que utiliza NextAuth internamente.

**Opción B - API directa:**

`POST /api/auth/login` (para uso desde otros clientes)

```json
{
  "user": "juan",
  "password": "123456"
}
```

### 3. Acceder a la Sesión

En componentes de servidor:
```typescript
import { auth } from "@/auth/auth";

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }
  
  console.log(session.user.firstName);
  return <div>Hola {session.user.firstName}</div>;
}
```

En componentes de cliente:
```typescript
"use client";
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Cargando...</div>;
  if (!session) return <div>No autenticado</div>;
  
  return <div>Hola {session.user.firstName}</div>;
}
```

### 4. Logout

```typescript
import { signOut } from "next-auth/react";

<button onClick={() => signOut()}>
  Cerrar Sesión
</button>
```

## 🗄️ Modelo de Usuario

```typescript
interface IUser {
  user: string;         // Nombre de usuario (único, lowercase)
  password: string;     // Hash de la contraseña
  firstName: string;    // Nombre
  lastName: string;     // Apellido
  createdAt: Date;      // Fecha de creación
  updatedAt: Date;      // Fecha de actualización
}
```

### Validaciones

- **user:** Mínimo 3 caracteres, máximo 50, único
- **password:** Mínimo 6 caracteres (se hashea automáticamente)
- **firstName:** Máximo 100 caracteres
- **lastName:** Máximo 100 caracteres

## 🔒 Seguridad

### Hash de Contraseñas

Las contraseñas se hashean automáticamente con `bcryptjs` usando un salt de 10 rounds antes de guardarse en la base de datos.

```typescript
// Pre-save hook en User.ts
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

### Comparación de Contraseñas

```typescript
// Método del modelo User
const isValid = await user.comparePassword(password);
```

### Sesiones JWT

Las sesiones se manejan con JWT y tienen una duración de 30 días.

```typescript
session: { 
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 días
}
```

## 📝 Tipos de Sesión

```typescript
// Tipo de Session
interface Session {
  user: {
    id: string;
    user: string;
    firstName: string;
    lastName: string;
  };
}

// Tipo de User (retornado por authorize)
interface User {
  id: string;
  user: string;
  firstName: string;
  lastName: string;
}
```

## 🧪 Pruebas

### Registro Manual (con MongoDB)

```bash
# Conectarse a MongoDB
mongosh "mongodb://daniel:daniel@localhost:27017/qa-agent?authSource=admin"

# Ver usuarios
use qa-agent
db.users.find().pretty()
```

### Crear Usuario de Prueba

Opción 1 - Desde la UI: Ir a `/register`

Opción 2 - Con curl:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user": "testuser",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login de Prueba

Ir a `http://localhost:3000/login` y usar las credenciales creadas.

## 🔧 Configuración de NextAuth

### Variables de Entorno

NextAuth requiere una variable `NEXTAUTH_SECRET` para producción:

```env
NEXTAUTH_SECRET=tu_clave_secreta_aquí
```

Generar una clave:
```bash
openssl rand -base64 32
```

### Rutas Protegidas

Para proteger rutas, usa middleware:

```typescript
// middleware.ts
export { auth as middleware } from "@/auth/auth";

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*'],
};
```

## 🚨 Errores Comunes

### Error: "El usuario ya existe"
El campo `user` es único. Usar otro nombre de usuario.

### Error de autenticación en MongoDB
Verificar que el `MONGODB_URI` incluya `?authSource=admin`:
```
MONGODB_URI=mongodb://user:pass@localhost:27017/qa-agent?authSource=admin
```

### La sesión no persiste
Verificar que `NEXTAUTH_SECRET` esté configurado en producción.

### Error en authorize()
Revisar los logs de la consola. Los errores se registran con `console.error()`.

## 📚 Referencias

- [NextAuth.js v5 Docs](https://authjs.dev/)
- [MongoDB with Mongoose](https://mongoosejs.com/)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)

## 🎯 Próximos Pasos

- [ ] Implementar recuperación de contraseña
- [ ] Agregar verificación de email
- [ ] Roles y permisos de usuario
- [ ] OAuth providers (Google, GitHub, etc.)
- [ ] Rate limiting en login
- [ ] Auditoría de intentos de login
