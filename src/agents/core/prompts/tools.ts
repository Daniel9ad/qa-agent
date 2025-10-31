export const ROUTE_CREATION_TOOL = `Registra una nueva ruta (URL) de una aplicación web en la base de datos.

Parámetros:
- projectId: ID del proyecto MongoDB (24 caracteres hexadecimales)
- path: Ruta de la aplicación (ej: '/login', '/dashboard')
- url: URL de la ruta (ej: 'https://ejemplo.com/login') debe ser completa y válida
- title: Título breve de la ruta (ej: 'Página de Inicio de Sesión')
- description: La descripcion de cada ruta es importante, por que se utilizara esta descripcion 
como contexto para otro agente que tendria que poder entender que hay en la ruta y las acciones 
que puede realizar, quiero una descripcion detallada de cada ruta.

Usa esta herramienta cuando identifiques una nueva página o endpoint en la aplicación que estás explorando.`;

export const ROUTE_LIST_TOOL = "Lista todas las rutas registradas de un proyecto específico. Muestra el ID, URL, descripción y estado de exploración de cada ruta. Útil para ver qué rutas ya has registrado y evitar duplicados.";

export const ROUTE_UPDATE_TOOL = "Actualiza la información de una ruta existente en la base de datos. Puedes modificar su URL, descripción o marcarla como explorada. Requiere el ID de la ruta a actualizar.";
