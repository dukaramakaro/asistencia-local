# 📊 EJEMPLO DE DATOS - Cómo se ve todo guardado

## 📁 Estructura de Carpetas

```
backend/
├── data/                    ← AQUÍ ESTÁN TUS DATOS
│   ├── miembros.json       ← Base de datos de personas
│   ├── asistencias.json    ← Registros de asistencia
│   ├── usuarios.json       ← Usuarios admin
│   └── contador.json       ← Contador de números
└── uploads/                 ← AQUÍ ESTÁN LAS FOTOS
    ├── 1735516800000-123.jpg
    ├── 1735516900000-456.jpg
    └── ...
```

---

## 👥 Ejemplo: miembros.json

Este archivo contiene la "base de datos" de todas las personas registradas:

```json
[
  {
    "id": "1735516800000",
    "numeroMiembro": 1,
    "numeroFormateado": "0001",
    "nombre": "Juan Pérez González",
    "nombreNormalizado": "juan perez gonzalez",
    "fechaNacimiento": "1990-05-15",
    "edad": 34,
    "fotoUrl": "/uploads/1735516800000-123.jpg",
    "telefono": "998-123-4567",
    "email": "juan@correo.com",
    "tipo": "miembro",
    "activo": true,
    "createdAt": "2024-12-29T10:00:00.000Z"
  },
  {
    "id": "1735516900000",
    "numeroMiembro": 2,
    "numeroFormateado": "0002",
    "nombre": "María López Sánchez",
    "nombreNormalizado": "maria lopez sanchez",
    "fechaNacimiento": "1995-08-22",
    "edad": 29,
    "fotoUrl": "/uploads/1735516900000-456.jpg",
    "telefono": "999-234-5678",
    "email": "maria@correo.com",
    "tipo": "miembro",
    "activo": true,
    "createdAt": "2024-12-29T10:05:00.000Z"
  },
  {
    "id": "1735517000000",
    "numeroMiembro": 1,
    "numeroFormateado": "V-0001",
    "nombre": "Pedro Ramírez",
    "nombreNormalizado": "pedro ramirez",
    "fechaNacimiento": "2000-03-10",
    "edad": 24,
    "fotoUrl": "/uploads/1735517000000-789.jpg",
    "telefono": null,
    "email": null,
    "tipo": "visitante",
    "activo": true,
    "createdAt": "2024-12-29T10:10:00.000Z"
  }
]
```

### Explicación de campos:

- **id**: Identificador único (timestamp)
- **numeroMiembro**: Número auto-incremental (1, 2, 3...)
- **numeroFormateado**: Número para mostrar (#0001, #0002, V-0001)
- **nombre**: Nombre completo
- **nombreNormalizado**: Nombre en minúsculas (para búsqueda)
- **fechaNacimiento**: YYYY-MM-DD (se calcula edad automática)
- **edad**: Calculada automáticamente
- **fotoUrl**: Ruta a la foto en /uploads/
- **telefono**: Opcional
- **email**: Opcional
- **tipo**: "miembro" o "visitante"
- **activo**: true/false (para eliminar sin borrar)
- **createdAt**: Fecha de registro

---

## ✅ Ejemplo: asistencias.json

Este archivo guarda CADA check-in que se hace:

```json
[
  {
    "id": "1735520400000",
    "miembroId": "1735516800000",
    "numeroMiembro": 1,
    "nombreMiembro": "Juan Pérez González",
    "fecha": "2024-12-29",
    "horaLlegada": "2024-12-29T09:30:15.000Z",
    "evento": "Curso",
    "createdAt": "2024-12-29T09:30:15.000Z"
  },
  {
    "id": "1735520500000",
    "miembroId": "1735516900000",
    "numeroMiembro": 2,
    "nombreMiembro": "María López Sánchez",
    "fecha": "2024-12-29",
    "horaLlegada": "2024-12-29T09:45:30.000Z",
    "evento": "Curso",
    "createdAt": "2024-12-29T09:45:30.000Z"
  },
  {
    "id": "1735524000000",
    "miembroId": "1735516800000",
    "numeroMiembro": 1,
    "nombreMiembro": "Juan Pérez González",
    "fecha": "2024-12-30",
    "horaLlegada": "2024-12-30T10:00:00.000Z",
    "evento": "Curso",
    "createdAt": "2024-12-30T10:00:00.000Z"
  }
]
```

### Explicación:

- **id**: Identificador único
- **miembroId**: Referencia al miembro que asistió
- **numeroMiembro**: Número de la persona (para buscar rápido)
- **nombreMiembro**: Nombre (guardado por si cambia después)
- **fecha**: Día de asistencia (YYYY-MM-DD)
- **horaLlegada**: Hora exacta del check-in
- **evento**: Tipo de evento (curso, clase, etc.)

---

## 👤 Ejemplo: usuarios.json

Usuarios que pueden acceder al panel admin:

```json
[
  {
    "id": "1735516700000",
    "usuario": "admin",
    "password": "admin123",
    "nombre": "Administrador Principal",
    "rol": "admin",
    "activo": true,
    "createdAt": "2024-12-29T09:00:00.000Z"
  },
  {
    "id": "1735516750000",
    "usuario": "supervisor1",
    "password": "super123",
    "nombre": "María Supervisor",
    "rol": "supervisor",
    "activo": true,
    "createdAt": "2024-12-29T09:05:00.000Z"
  }
]
```

---

## 🔢 Ejemplo: contador.json

Lleva el control de los números asignados:

```json
{
  "miembro": 2,
  "visitante": 1
}
```

Esto significa:
- Próximo miembro será: #0003
- Próximo visitante será: V-0002

---

## 📥 EXCEL Exportado - Ejemplo

### Archivo: asistencias_2024-12-29.xlsx

| Número | Nombre              | Fecha      | Hora  | Tipo     | Teléfono     | Email          |
|--------|---------------------|------------|-------|----------|--------------|----------------|
| 1      | Juan Pérez González | 2024-12-29 | 09:30 | miembro  | 998-123-4567 | juan@correo.com|
| 2      | María López Sánchez | 2024-12-29 | 09:45 | miembro  | 999-234-5678 | maria@correo.com|

### Archivo: miembros_2024-12-29.xlsx

| Número | Nombre              | Fecha Nac. | Edad | Teléfono     | Email           | Tipo     | Fecha Registro |
|--------|---------------------|------------|------|--------------|-----------------|----------|----------------|
| 0001   | Juan Pérez González | 15/05/1990 | 34   | 998-123-4567 | juan@correo.com | miembro  | 29/12/2024     |
| 0002   | María López Sánchez | 22/08/1995 | 29   | 999-234-5678 | maria@correo.com| miembro  | 29/12/2024     |
| V-0001 | Pedro Ramírez       | 10/03/2000 | 24   |              |                 | visitante| 29/12/2024     |

---

## 🔄 Flujo Completo Ejemplo

### 1. REGISTRO (Admin hace esto)
```
Admin → Nuevo Miembro:
  Nombre: "Ana García"
  Fecha Nacimiento: "2002-07-18"
  Teléfono: "997-555-1234"
  Foto: [captura]
  
→ Sistema guarda en miembros.json:
  {
    "numeroMiembro": 3,
    "numeroFormateado": "0003",
    "nombre": "Ana García",
    "fechaNacimiento": "2002-07-18",
    "edad": 22,  ← Calculada automática
    ...
  }
```

### 2. CHECK-IN (Ana lo hace)
```
Kiosco:
  Ana escribe: "3"
  Ve su foto y nombre
  Confirma
  
→ Sistema guarda en asistencias.json:
  {
    "numeroMiembro": 3,
    "nombreMiembro": "Ana García",
    "fecha": "2024-12-29",
    "horaLlegada": "2024-12-29T10:15:00Z"
  }
```

### 3. CONSULTA (Admin revisa)
```
Dashboard muestra:
  ✅ Asistencias hoy: 3
  
  Lista:
  - 09:30 - Juan Pérez (#0001)
  - 09:45 - María López (#0002)  
  - 10:15 - Ana García (#0003)
```

### 4. EXPORTAR
```
Click "Exportar" → Descarga Excel con todo
```

---

## 💡 Ventajas de este Sistema

✅ **Simple**: Archivos de texto que puedes abrir y leer
✅ **Editable**: Puedes corregir algo directo en el JSON
✅ **Portable**: Copia las carpetas = tienes todo
✅ **Sin internet**: Funciona 100% offline
✅ **Backup fácil**: Copia data/ y uploads/ a USB

---

## 🔧 Si Necesitas Editar Manualmente

Puedes abrir los archivos .json con:
- Notepad / Bloc de notas
- VS Code
- Notepad++
- Cualquier editor de texto

**⚠️ CUIDADO:** Respeta el formato JSON (comas, llaves, comillas)

---

¡Este es el corazón de tu sistema! Todo está en archivos locales simples. 📁
