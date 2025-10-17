# QA Agent - Estructura del Proyecto

## 📁 Estructura de Directorios

```
qa-agent/
├── src/
│   ├── app/                          # App Router de Next.js
│   │   ├── layout.tsx                # Layout root
│   │   ├── page.tsx                  # Página principal (redirect a login)
│   │   ├── login/
│   │   │   └── page.tsx              # Página de login
│   │   └── dashboard/
│   │       ├── layout.tsx            # Layout con sidebar
│   │       └── page.tsx              # Dashboard principal con stats
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── stats-card.tsx        # Tarjeta de estadísticas
│   │   ├── layout/
│   │   │   └── sidebar.tsx           # Sidebar con proyectos y navegación
│   │   └── ui/                       # Componentes de shadcn/ui
│   │
│   ├── lib/
│   │   └── utils.ts                  # Utilidades (cn, etc.)
│   │
│   ├── types/
│   │   └── index.ts                  # Tipos TypeScript
│   │
│   └── styles/
│       └── globals.css               # Estilos globales
│
├── public/                           # Assets estáticos
├── components.json                   # Configuración de shadcn/ui
├── next.config.ts                    # Configuración de Next.js
├── tsconfig.json                     # Configuración de TypeScript
├── package.json
└── README.md
```

## 🎨 Paleta de Colores

### Colores principales del diseño:
- **Background Principal**: `#0A1612`
- **Background Secundario**: `#0F1E19`
- **Background Terciario**: `#1A2E26`
- **Acento Verde**: `#4ADE80` (acciones, éxito)
- **Texto Principal**: `#E5F5ED`
- **Texto Secundario**: `#9CA8A3`
- **Texto Muted**: `#6B7F77`
- **Bordes**: `#2E4A3D`
- **Amarillo/Warning**: `#DEA154`
- **Rojo/Error**: `#DE5454`

## 🧩 Componentes Principales

### 1. Login (`/login`)
- Formulario de autenticación
- Email y password inputs
- Links para recuperar contraseña y crear cuenta
- Elementos decorativos (círculos de fondo)

### 2. Dashboard Layout (`/dashboard`)
- **Sidebar fijo** (280px):
  - Logo/Brand
  - Lista de proyectos con indicadores
  - Botón para nuevo proyecto
  - Navegación principal (Dashboard, Contexto, Flujos, Resultados)
  
- **Main Content**:
  - Header bar con título y selector de rango de tiempo
  - Área de contenido principal

### 3. Dashboard Page (`/dashboard`)
- **4 Tarjetas de estadísticas**:
  1. Total de Pruebas (con cambio porcentual)
  2. Tasa de Éxito (con cambio porcentual)
  3. Tiempo Promedio (con cambio)
  4. Flujos Activos (con subtítulo)

## 🔧 Tecnologías

- **Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS
- **Icons**: lucide-react
- **TypeScript**: Para type safety

## 📝 Próximos Pasos

1. ✅ Login page
2. ✅ Dashboard layout con sidebar
3. ✅ Dashboard stats cards
4. 🔲 Implementar autenticación real
5. 🔲 Conectar con API/backend
6. 🔲 Añadir gráficos y actividad reciente
7. 🔲 Páginas adicionales (Contexto, Flujos, Resultados)
8. 🔲 Gestión de proyectos (crear, editar, eliminar)

## 🚀 Comandos

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Añadir componentes de shadcn/ui
npx shadcn@latest add [component-name]
```

## 📱 Rutas

- `/` → Redirect a `/login`
- `/login` → Página de autenticación
- `/dashboard` → Dashboard principal con estadísticas
- `/dashboard/context` → (Por implementar)
- `/dashboard/flows` → (Por implementar)
- `/dashboard/results` → (Por implementar)
