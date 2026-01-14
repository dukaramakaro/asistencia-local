const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const miembrosRoutes = require('./routes/miembros');
const asistenciasRoutes = require('./routes/asistencias');
const authRoutes = require('./routes/auth');
const exportarRoutes = require('./routes/exportar');
const usuariosRoutes = require('./routes/usuarios');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/miembros', miembrosRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/exportar', exportarRoutes);
app.use('/api/usuarios', usuariosRoutes);

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
