# Uso del Estado del Proyecto (Redux)

## Descripción

El proyecto seleccionado ahora se guarda en Redux y se persiste automáticamente usando `redux-persist`. Esto significa que:

1. **El proyecto seleccionado se mantiene entre recargas de página**
2. **Todos los componentes pueden acceder al proyecto actual**
3. **Cuando cambias de proyecto, todos los componentes se actualizan automáticamente**

## Estructura del State

```typescript
interface ProjectState {
  projects: Project[];           // Lista de todos los proyectos
  selectedProject: Project | null;  // Proyecto actualmente seleccionado
  selectedProjectId: string | null; // ID del proyecto seleccionado
}
```

## Cómo Usar en Componentes

### 1. Acceder al Proyecto Seleccionado

```tsx
"use client";

import { useAppSelector } from "@/hooks/use-store";

export default function MiComponente() {
  const { selectedProject } = useAppSelector((state) => state.project);

  if (!selectedProject) {
    return <div>No hay proyecto seleccionado</div>;
  }

  return (
    <div>
      <h1>{selectedProject.name}</h1>
      <p>URL: {selectedProject.url}</p>
      <p>Vistas: {selectedProject.viewsCount}</p>
      <p>Flujos: {selectedProject.flowsCount}</p>
    </div>
  );
}
```

### 2. Acceder a la Lista de Proyectos

```tsx
"use client";

import { useAppSelector } from "@/hooks/use-store";

export default function ListaProyectos() {
  const { projects } = useAppSelector((state) => state.project);

  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  );
}
```

### 3. Cambiar el Proyecto Seleccionado

```tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { setSelectedProject } from "@/lib/redux/features/projectSlice";

export default function CambiadorProyecto() {
  const dispatch = useAppDispatch();
  const { projects, selectedProjectId } = useAppSelector((state) => state.project);

  const handleChange = (projectId: string) => {
    dispatch(setSelectedProject(projectId));
  };

  return (
    <select 
      value={selectedProjectId || ""} 
      onChange={(e) => handleChange(e.target.value)}
    >
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
```

### 4. Actualizar la Lista de Proyectos

```tsx
"use client";

import { useAppDispatch } from "@/hooks/use-store";
import { setProjects } from "@/lib/redux/features/projectSlice";

export default function ActualizadorProyectos() {
  const dispatch = useAppDispatch();

  const recargarProyectos = async () => {
    const response = await fetch("/api/projects");
    const data = await response.json();
    
    if (data.success) {
      const projectsList = data.data.map((p: any) => ({
        id: p._id,
        name: p.name,
        url: p.url,
        viewsCount: p.viewsCount,
        flowsCount: p.flowsCount,
        isActive: p.isActive,
      }));
      
      dispatch(setProjects(projectsList));
    }
  };

  return (
    <button onClick={recargarProyectos}>
      Recargar Proyectos
    </button>
  );
}
```

## Acciones Disponibles

### `setProjects(projects: Project[])`
Establece la lista completa de proyectos. Si no hay un proyecto seleccionado, selecciona automáticamente el primero.

```typescript
dispatch(setProjects([
  { id: "1", name: "Proyecto 1", url: "https://...", ... },
  { id: "2", name: "Proyecto 2", url: "https://...", ... },
]));
```

### `setSelectedProject(projectId: string)`
Cambia el proyecto seleccionado por su ID.

```typescript
dispatch(setSelectedProject("project-id-123"));
```

### `clearProject()`
Limpia todo el estado (útil para logout).

```typescript
dispatch(clearProject());
```

## Selectores Útiles

```typescript
// Obtener el proyecto seleccionado
const selectedProject = useAppSelector((state) => state.project.selectedProject);

// Obtener el ID del proyecto seleccionado
const selectedProjectId = useAppSelector((state) => state.project.selectedProjectId);

// Obtener todos los proyectos
const projects = useAppSelector((state) => state.project.projects);

// Verificar si hay un proyecto seleccionado
const hasSelectedProject = useAppSelector((state) => 
  state.project.selectedProject !== null
);

// Obtener el nombre del proyecto actual
const projectName = useAppSelector((state) => 
  state.project.selectedProject?.name || "Sin proyecto"
);
```

## Persistencia

El estado del proyecto se persiste automáticamente en `localStorage` con la key `project`. Esto significa que:

- ✅ El proyecto seleccionado se mantiene al recargar la página
- ✅ Los datos se sincronizan automáticamente
- ✅ No necesitas preocuparte por guardar/cargar manualmente

## Ejemplo Completo: Página con Proyecto

```tsx
"use client";

import { useAppSelector } from "@/hooks/use-store";

export default function MiPaginaConProyecto() {
  const { selectedProject } = useAppSelector((state) => state.project);

  return (
    <div className="p-6">
      {selectedProject ? (
        <div>
          <h1 className="text-2xl font-bold mb-4">
            {selectedProject.name}
          </h1>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">URL:</span>
              <span className="ml-2">{selectedProject.url}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Vistas:</span>
              <span className="ml-2">{selectedProject.viewsCount}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Flujos:</span>
              <span className="ml-2">{selectedProject.flowsCount}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className={`ml-2 ${
                selectedProject.isActive ? 'text-green-500' : 'text-red-500'
              }`}>
                {selectedProject.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          No hay proyecto seleccionado
        </div>
      )}
    </div>
  );
}
```

## Flujo Completo

1. **Usuario selecciona proyecto en el Sidebar**
   - Se llama a `onProjectChange(projectId)` en el Sidebar
   - El `layout.tsx` llama a `dispatch(setSelectedProject(projectId))`

2. **Redux actualiza el estado**
   - `selectedProjectId` se actualiza
   - `selectedProject` se busca en la lista de proyectos
   - El estado se persiste en localStorage

3. **Componentes se actualizan**
   - Todos los componentes que usan `useAppSelector` se re-renderizan
   - Muestran los datos del nuevo proyecto seleccionado

4. **Persistencia**
   - Al recargar la página, Redux carga el estado desde localStorage
   - El proyecto seleccionado se mantiene

## Beneficios

✅ **Estado centralizado**: Un solo lugar para el proyecto actual
✅ **Sincronización automática**: Todos los componentes siempre tienen los datos actuales
✅ **Persistencia**: El proyecto se mantiene entre sesiones
✅ **Type-safe**: TypeScript garantiza que los datos son correctos
✅ **Fácil de usar**: Hooks simples para acceder al estado
