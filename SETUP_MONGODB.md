# Configuración de MongoDB para QA Agent

## 📋 Requisitos Previos

- Node.js instalado
- MongoDB instalado localmente O una cuenta en MongoDB Atlas

## 🚀 Configuración Paso a Paso

### Opción 1: MongoDB Local

1. **Instalar MongoDB localmente**
   - Windows: Descargar desde [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Mac: `brew install mongodb-community`
   - Linux: Seguir la [documentación oficial](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. **Iniciar MongoDB**
   ```bash
   # Windows (como servicio, se inicia automáticamente)
   # O manualmente:
   mongod
   
   # Mac/Linux
   brew services start mongodb-community
   # O:
   mongod --config /usr/local/etc/mongod.conf
   ```

3. **Crear archivo `.env.local`**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Editar `.env.local`:
   ```
   MONGODB_URI=mongodb://localhost:27017/qa-agent
   ```

### Opción 2: MongoDB Atlas (Cloud)

1. **Crear cuenta en MongoDB Atlas**
   - Ir a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Crear una cuenta gratuita

2. **Crear un Cluster**
   - Seleccionar el plan gratuito (M0)
   - Elegir región más cercana
   - Crear cluster (toma unos minutos)

3. **Configurar acceso**
   - Database Access: Crear un usuario con contraseña
   - Network Access: Agregar IP (usar `0.0.0.0/0` para permitir todas las IPs en desarrollo)

4. **Obtener Connection String**
   - Click en "Connect" en tu cluster
   - Seleccionar "Connect your application"
   - Copiar el connection string

5. **Crear archivo `.env.local`**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Editar `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/qa-agent?retryWrites=true&w=majority
   ```
   
   > ⚠️ Reemplazar `usuario` y `contraseña` con tus credenciales

## 🧪 Verificar la Conexión

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

3. **Probar la API**
   - Abrir el navegador en `http://localhost:3000/dashboard`
   - Intentar crear un nuevo proyecto desde el botón "Nuevo Proyecto"

## 📁 Estructura de la Base de Datos

### Collection: `projects`

```javascript
{
  _id: ObjectId,
  name: String,          // Nombre del proyecto
  url: String,           // URL del proyecto
  viewsCount: Number,    // Contador de vistas
  flowsCount: Number,    // Contador de flujos
  isActive: Boolean,     // Si está activo o no
  createdAt: Date,       // Fecha de creación
  updatedAt: Date        // Fecha de última actualización
}
```

## 🔧 Troubleshooting

### Error: "MONGODB_URI no está definido"
- Asegúrate de crear el archivo `.env.local` en la raíz del proyecto
- Verificar que la variable `MONGODB_URI` esté correctamente definida

### Error de conexión a MongoDB
- **Local**: Verificar que MongoDB esté ejecutándose (`mongod`)
- **Atlas**: Verificar que tu IP esté en la whitelist
- Verificar que el connection string sea correcto

### Error de autenticación
- Verificar usuario y contraseña en el connection string
- En Atlas, verificar que el usuario tenga permisos de lectura/escritura

## 📝 Notas Importantes

- El archivo `.env.local` NO debe subirse a Git (ya está en `.gitignore`)
- Para producción, usar variables de entorno del hosting (Vercel, Railway, etc.)
- Los contadores (`viewsCount`, `flowsCount`) se inicializan en 0 y se actualizarán con funcionalidad futura
