# 🏥 Sistema de Gestión Médica

Sistema completo de gestión para consultorios médicos que permite administrar pacientes, doctores, citas, historias clínicas y reseñas.

## 🚀 Características

- **👥 Gestión de Usuarios**: Pacientes, Doctores y Administradores
- **📅 Sistema de Citas**: Programación y seguimiento de consultas
- **🏥 Historias Clínicas**: Registro completo de diagnósticos y tratamientos
- **⭐ Sistema de Reseñas**: Calificaciones y comentarios para doctores
- **📁 Gestión de Archivos**: Subida de imágenes y documentos a Cloudinary
- **🔐 Autenticación Segura**: JWT con diferentes niveles de acceso

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (JSON Web Tokens)
- **Archivos**: Multer + Cloudinary
- **Seguridad**: Bcrypt para contraseñas

## 📋 Módulos del Sistema

### 🔐 Autenticación
- Login para Pacientes, Doctores y Administradores
- Middleware de autorización por roles
- Tokens JWT seguros

### 👥 Pacientes
- Registro y perfil de pacientes
- Historial médico completo
- Gestión de citas personales

### 🩺 Doctores
- Perfiles profesionales con especialidades
- Gestión de horarios y citas
- Acceso a historias clínicas

### 📅 Citas Médicas
- Programación de consultas
- Control de conflictos de horarios
- Estados: programada, completada, cancelada

### 🏥 Historias Clínicas
- Registro de diagnósticos y tratamientos
- Archivos adjuntos (imágenes, documentos)
- Seguimiento médico completo

### ⭐ Reseñas
- Sistema de calificaciones (1-5 estrellas)
- Comentarios de pacientes
- Estadísticas por doctor

### 📊 Departamentos
- Organización por especialidades médicas
- Categorización de doctores

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/sistema-medico.git
cd sistema-medico
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```
Editar el archivo `.env` con tus configuraciones:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/sistema-medico

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Admin
ADMIN_EMAIL=admin@clinica.com
ADMIN_PASSWORD=admin123
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 📚 API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/verify` - Verificar token

### Pacientes
- `GET /api/patients` - Listar pacientes
- `POST /api/patients` - Crear paciente
- `GET /api/patients/:id` - Obtener paciente
- `PUT /api/patients/:id` - Actualizar paciente
- `DELETE /api/patients/:id` - Eliminar paciente

### Doctores
- `GET /api/doctors` - Listar doctores
- `POST /api/doctors` - Crear doctor
- `GET /api/doctors/:id` - Obtener doctor
- `PUT /api/doctors/:id` - Actualizar doctor
- `DELETE /api/doctors/:id` - Eliminar doctor

### Citas
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/:id` - Obtener cita
- `PUT /api/appointments/:id` - Actualizar cita
- `DELETE /api/appointments/:id` - Eliminar cita

### Historias Clínicas
- `GET /api/historias` - Listar historias
- `POST /api/historias` - Crear historia
- `GET /api/historias/:id` - Obtener historia
- `PUT /api/historias/:id` - Actualizar historia
- `DELETE /api/historias/:id` - Eliminar historia

### Reseñas
- `GET /api/resenas` - Listar reseñas
- `POST /api/resenas` - Crear reseña
- `GET /api/resenas/:id` - Obtener reseña
- `PUT /api/resenas/:id` - Actualizar reseña
- `DELETE /api/resenas/:id` - Eliminar reseña

### Departamentos
- `GET /api/departamentos` - Listar departamentos
- `POST /api/departamentos` - Crear departamento
- `GET /api/departamentos/:id` - Obtener departamento
- `PUT /api/departamentos/:id` - Actualizar departamento
- `DELETE /api/departamentos/:id` - Eliminar departamento

## 🔐 Roles y Permisos

### 👨‍💼 Administrador
- Acceso completo al sistema
- Gestión de todos los usuarios
- Eliminación de registros

### 🩺 Doctor
- Ver y gestionar sus citas
- Acceder a historias clínicas de sus pacientes
- Ver sus reseñas

### 👤 Paciente
- Gestionar su perfil
- Programar citas
- Ver su historial médico
- Calificar doctores

## 🗂️ Estructura del Proyecto

```
src/
├── controllers/     # Lógica de negocio
├── models/         # Modelos de MongoDB
├── routes/         # Rutas de la API
├── middleware/     # Middlewares de autenticación
├── config/         # Configuraciones
└── app.js         # Aplicación principal
```


## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Gerardo Quintanilla 


