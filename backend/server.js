const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const { requireAuth, requireAdmin } = require('./seguridad');

const miembrosRoutes = require('./routes/miembros');
const asistenciasRoutes = require('./routes/asistencias');
const authRoutes = require('./routes/auth');
const exportarRoutes = require('./routes/exportar');
const usuariosRoutes = require('./routes/usuarios');
const kioscoRoutes = require('./routes/kiosco');

const app = express();

// Render pone un proxy delante: sin esto, req.ip sería siempre la IP del proxy
// y el límite de peticiones por IP castigaría a todos por igual.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(cors());

// El check-in público (kiosco) solo necesita fotos pequeñas: tope de 2 MB en esa ruta.
// Debe ir ANTES del parser general para que el tope se aplique.
app.use('/api/asistencias/checkin', express.json({ limit: '2mb' }));
app.use(express.json({ limit: '10mb' }));

// --- Rutas públicas (kiosco y login) ---
app.use('/api/auth', authRoutes);
app.use('/api/kiosco', kioscoRoutes);
// Asistencias: el check-in es público; el resto exige sesión (se aplica dentro del archivo)
app.use('/api/asistencias', asistenciasRoutes);

// --- Rutas que exigen sesión iniciada ---
app.use('/api/miembros', requireAuth, miembrosRoutes);
app.use('/api/exportar', requireAuth, exportarRoutes);
// Gestión de usuarios: solo administradores
app.use('/api/usuarios', requireAuth, requireAdmin, usuariosRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mensaje: 'API funcionando correctamente con PostgreSQL',
    fecha: new Date().toISOString(),
    almacenamiento: 'PostgreSQL'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Base de datos: PostgreSQL`);
});
