# 🚀 INICIO RÁPIDO - Versión LOCAL

## ⚡ En 5 Minutos Funcionando

### Requisito: Node.js
Si no lo tienes:
1. Ve a https://nodejs.org
2. Descarga versión LTS
3. Instala (siguiente, siguiente, finalizar)

---

## Paso 1: Instalar Backend (2 minutos)

Abre la terminal/CMD en la carpeta del proyecto:

```bash
cd backend
npm install
```

Espera a que termine...

---

## Paso 2: Crear Usuario Admin (30 segundos)

```bash
npm run setup
```

Verás:
```
✅ Usuario creado exitosamente!
   Usuario: admin
   Password: admin123
```

---

## Paso 3: Iniciar Backend (10 segundos)

```bash
npm start
```

Deberías ver:
```
✅ Servidor LOCAL corriendo en http://localhost:5000
📁 Datos guardados en: ./data/
📷 Fotos guardadas en: ./uploads/
```

✅ **Deja esta terminal abierta**

---

## Paso 4: Instalar Frontend (2 minutos)

Abre **OTRA TERMINAL** (no cierres la anterior):

```bash
cd frontend
npm install
```

Espera a que termine...

---

## Paso 5: Iniciar Frontend (10 segundos)

```bash
npm start
```

Se abrirá tu navegador en: **http://localhost:3000**

---

## ✅ ¡LISTO! Ahora Prueba:

### 1. Login
- Usuario: `admin`
- Password: `admin123`

### 2. Registrar Primer Miembro
- Miembros → Nuevo Miembro
- Nombre: "Juan Pérez"
- Guardar → Se crea #0001

### 3. Probar Check-in
- Ve a: http://localhost:3000/kiosco
- Ingresa número: `1`
- Confirma → ✅ Asistencia registrada!

### 4. Ver Dashboard
- Verás: Asistencia Hoy = 1

---

## 📂 ¿Dónde Están Mis Datos?

Todo está en tu computadora:

```
backend/
├── data/
│   ├── miembros.json      ← Lista de miembros
│   ├── asistencias.json   ← Registros de asistencia
│   ├── usuarios.json      ← Usuarios admin
│   └── contador.json      ← Último número asignado
└── uploads/               ← Fotos de miembros
```

Puedes abrir estos archivos con cualquier editor de texto.

---

## 💾 Hacer Backup

Copia estas 2 carpetas a un USB:
- `backend/data/`
- `backend/uploads/`

Para restaurar, solo cópialas de vuelta.

---

## 🆘 Si Algo Sale Mal

**"npm: command not found"**
→ Instala Node.js desde nodejs.org

**"Puerto 5000 en uso"**
→ Cierra otras aplicaciones que usen ese puerto

**"Cannot find module"**
→ Corre `npm install` de nuevo

**Cámara no funciona**
→ Da permisos al navegador (aparece arriba)

---

## 📱 URLs Importantes

- **Kiosco:** http://localhost:3000/kiosco
- **Admin:** http://localhost:3000/admin/login
- **Dashboard:** http://localhost:3000/admin/dashboard

---

## 🎯 Próximos Pasos

1. ✅ Registra a todos tus miembros
2. ✅ Configura tablet/PC en la entrada
3. ✅ Muestra a supervisores cómo exportar a Excel
4. ✅ Haz backup semanal de las carpetas

---

**¿Todo funcionando? ¡Perfecto! 🎉**

¿Problemas? Revisa el README.md completo.
