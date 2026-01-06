# 📋 Sistema de Asistencia LOCAL

Sistema completo de gestión de asistencia **SIN INTERNET** - Todo guardado localmente en tu computadora.

## ✨ Características Principales

### ✅ 100% LOCAL - Sin Internet
- **Base de datos:** Archivos JSON en tu computadora
- **Fotos:** Guardadas en carpeta `uploads/`
- **Sin dependencias:** No necesitas MongoDB ni Cloudinary
- **Portátil:** Copia la carpeta y funciona en otra PC

### 🖥️ Kiosco de Check-in
- Check-in por número de miembro (súper rápido)
- Búsqueda por nombre con autocompletado
- Registro de visitantes con foto
- 100% responsive (tablet, PC, laptop)

### 📱 Panel de Supervisores
- Dashboard con estadísticas en tiempo real
- Gestión completa de miembros con:
  - Nombre completo
  - Fecha de nacimiento (edad auto-calculada)
  - Teléfono y email
  - Foto
- Exportar a Excel con un click
- Sistema de login simple

## 📦 Estructura del Proyecto

```
asistencia-local/
├── backend/
│   ├── data/               ← Aquí se guardan los JSON
│   │   ├── miembros.json
│   │   ├── asistencias.json
│   │   ├── usuarios.json
│   │   └── contador.json
│   ├── uploads/            ← Aquí se guardan las fotos
│   ├── routes/
│   ├── db.js              ← Maneja archivos JSON
│   ├── server.js
│   └── setup.js
└── frontend/
    └── src/
        └── pages/
```

## 🚀 Instalación RÁPIDA

### 1. Instalar Node.js

Si no lo tienes instalado:
- Ve a: https://nodejs.org
- Descarga la versión LTS (recomendada)
- Instala normalmente

### 2. Instalar Backend

```bash
cd asistencia-local/backend
npm install
```

### 3. Crear Primer Usuario

```bash
npm run setup
```

Verás:
```
✅ Usuario creado exitosamente!
   Usuario: admin
   Password: admin123
```

### 4. Instalar Frontend

```bash
cd ../frontend
npm install
```

## ▶️ Ejecutar el Sistema

Necesitas **DOS terminales**:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Deberías ver:
```
✅ Servidor LOCAL corriendo en http://localhost:5000
📁 Datos guardados en: ./data/
📷 Fotos guardadas en: ./uploads/
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Se abre automáticamente en `http://localhost:3000`

## 🎯 Uso del Sistema

### 1. Login como Admin
- Ve a: http://localhost:3000/admin/login
- Usuario: `admin`
- Password: `admin123`

### 2. Registrar Miembros
- Dashboard → Miembros → Nuevo Miembro
- Completa los datos
- Sistema asigna número automático (#0001, #0002...)

### 3. Check-in en Kiosco
- Ve a: http://localhost:3000/kiosco
- Miembro ingresa su número o nombre
- Confirma asistencia
- ✅ Registrado!

### 4. Exportar a Excel
- Dashboard → Click en "Exportar"
- Se descarga archivo Excel con todos los datos

## 📂 Archivos de Datos

Todos los datos están en archivos JSON simples que puedes abrir:

**backend/data/miembros.json:**
```json
[
  {
    "id": "1234567890",
    "numeroMiembro": 1,
    "numeroFormateado": "0001",
    "nombre": "Juan Pérez",
    "nombreNormalizado": "juan perez",
    "fechaNacimiento": "1990-05-15",
    "edad": 34,
    "fotoUrl": "/uploads/foto123.jpg",
    "telefono": "998-123-4567",
    "tipo": "miembro",
    "activo": true,
    "createdAt": "2024-12-28T..."
  }
]
```

**backend/data/asistencias.json:**
```json
[
  {
    "id": "1234567891",
    "miembroId": "1234567890",
    "numeroMiembro": 1,
    "nombreMiembro": "Juan Pérez",
    "fecha": "2024-12-28",
    "horaLlegada": "2024-12-28T10:30:00Z",
    "evento": "Curso"
  }
]
```

## 📥 Exportar a Excel

### Exportar Asistencias
```
GET http://localhost:5000/api/exportar/asistencias?fecha=2024-12-28
```
O desde el panel admin: Dashboard → Exportar Asistencias

### Exportar Lista de Miembros
```
GET http://localhost:5000/api/exportar/miembros
```
O desde el panel admin: Miembros → Exportar Lista

## 💾 Respaldo de Datos

Para hacer backup de toda tu información:

**Windows:**
```bash
xcopy backend\data backup\data\ /E /I
xcopy backend\uploads backup\uploads\ /E /I
```

**Mac/Linux:**
```bash
cp -r backend/data backup/
cp -r backend/uploads backup/
```

O simplemente copia las carpetas `data/` y `uploads/` a un USB.

## 📱 Rutas de la Aplicación

- **Kiosco:** http://localhost:3000/kiosco
- **Admin Login:** http://localhost:3000/admin/login
- **Dashboard:** http://localhost:3000/admin/dashboard
- **Miembros:** http://localhost:3000/admin/miembros

## 🔄 Portabilidad

### Mover a Otra Computadora:

1. Copia toda la carpeta `asistencia-local/`
2. En la nueva PC:
   ```bash
   cd asistencia-local/backend
   npm install
   npm start
   ```
3. En otra terminal:
   ```bash
   cd asistencia-local/frontend
   npm install
   npm start
   ```

¡Todos tus datos y fotos vienen incluidos!

## 🛠️ Ventajas de la Versión LOCAL

✅ **Sin costos:** No pagas servicios en la nube
✅ **Sin internet:** Funciona completamente offline
✅ **Privacidad total:** Los datos nunca salen de tu PC
✅ **Portátil:** Lleva todo en un USB
✅ **Simple:** No necesitas configurar credenciales
✅ **Rápido:** Todo es instantáneo (sin latencia)

## ⚠️ Limitaciones

❌ **No multi-dispositivo:** Solo funciona en una PC a la vez
❌ **Sin sincronización:** No puedes acceder desde múltiples lugares
❌ **Backup manual:** Debes hacer respaldos manualmente

## 🔧 Troubleshooting

**Error: Puerto 5000 en uso**
- Cambia el puerto en backend/server.js
- También actualízalo en todos los archivos del frontend

**Fotos no se ven**
- Verifica que la carpeta `uploads/` existe
- Verifica permisos de escritura

**Datos no se guardan**
- Verifica que la carpeta `data/` existe
- Verifica permisos de escritura

## 📊 Estructura de Datos

### Miembros
- Número auto-incremental
- Nombre completo
- Fecha de nacimiento (edad calculada automáticamente)
- Teléfono y email (opcionales)
- Foto (guardada localmente)
- Tipo: miembro o visitante
- Estado: activo/inactivo

### Asistencias
- Referencia al miembro
- Fecha y hora exacta
- Evento (curso, clase, etc.)

### Usuarios
- Login para supervisores
- Contraseña (cambiar después del setup)

## 🎯 Próximas Mejoras

- [ ] Importar desde Excel
- [ ] Backup automático
- [ ] Múltiples eventos/cursos
- [ ] Reportes con gráficas
- [ ] Imprimir credenciales
- [ ] Código QR para check-in

## 📄 Licencia

Sistema desarrollado por ThinkTank Creations para uso educativo y organizacional.

---

**Sistema 100% LOCAL - Sin dependencias de internet ✅**
