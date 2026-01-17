const express = require('express');
const router = express.Router();
const { pool } = require('../db');

async function ensureUsuariosTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      usuario VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      rol VARCHAR(50) DEFAULT 'admin',
      activo BOOLEAN DEFAULT true
    );
  `);
}

function serializeDbError(err) {
  if (!err) return { message: 'Unknown error' };

  return {
    message: err.message || String(err),
    code: err.code || null,
    detail: err.detail || null,
    hint: err.hint || null,
    where: err.where || null,
    schema: err.schema || null,
    table: err.table || null,
    column: err.column || null,
    dataType: err.dataType || null,
    constraint: err.constraint || null,
    routine: err.routine || null
  };
}

router.post('/login', async (req, res) => {
  try {
    await ensureUsuariosTable();

    const { usuario, password } = req.body || {};
    if (!usuario || !password) return res.status(400).json({ error: 'Faltan credenciales' });

    const { rows } = await pool.query(
      `SELECT id, usuario, password, nombre, rol, activo
       FROM usuarios
       WHERE usuario = $1 AND activo = true
       LIMIT 1`,
      [usuario]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (user.password !== password) return res.status(401).json({ error: 'Contraseña incorrecta' });

    return res.json({
      mensaje: 'Login exitoso',
      usuario: { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión', detalle: serializeDbError(err) });
  }
});

router.get('/setup-admin', async (req, res) => {
  try {
    await ensureUsuariosTable();

    const exists = await pool.query(`SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1`);
    if (exists.rows.length > 0) {
      return res.json({ mensaje: 'Usuario admin ya existe', usuario: 'admin' });
    }

    await pool.query(
      `INSERT INTO usuarios (usuario, password, nombre, rol, activo)
       VALUES ($1, $2, $3, $4, true)`,
      ['admin', 'admin123', 'Administrador', 'admin']
    );

    return res.json({ mensaje: 'Usuario admin creado exitosamente', usuario: 'admin', password: 'admin123' });
  } catch (err) {
    console.error('SETUP-ADMIN ERROR:', err);
    return res.status(500).json({ error: 'Error creando admin', detalle: serializeDbError(err) });
  }
});

// TEMPORAL: Resetear contraseña del admin a 'admin123'
// Visitar: /api/auth/reset-admin
// ⚠️ BORRAR ESTE ENDPOINT DESPUÉS DE USAR
router.get('/reset-admin', async (req, res) => {
  try {
    await ensureUsuariosTable();

    const result = await pool.query(
      `UPDATE usuarios SET password = 'admin123', activo = true WHERE usuario = 'admin' RETURNING id`
    );

    if (result.rows.length > 0) {
      return res.json({ 
        mensaje: '✅ Contraseña de admin reseteada y activado', 
        usuario: 'admin', 
        password: 'admin123',
        aviso: '⚠️ CAMBIA LA CONTRASEÑA Y BORRA ESTE ENDPOINT'
      });
    } else {
      // Si no existe admin, crearlo
      await pool.query(
        `INSERT INTO usuarios (usuario, password, nombre, rol, activo)
         VALUES ($1, $2, $3, $4, true)`,
        ['admin', 'admin123', 'Administrador', 'admin']
      );
      return res.json({ 
        mensaje: '✅ Usuario admin creado', 
        usuario: 'admin', 
        password: 'admin123',
        aviso: '⚠️ CAMBIA LA CONTRASEÑA Y BORRA ESTE ENDPOINT'
      });
    }
  } catch (err) {
    console.error('RESET-ADMIN ERROR:', err);
    return res.status(500).json({ error: 'Error reseteando admin', detalle: serializeDbError(err) });
  }
});

// TEMPORAL: Crear usuario de prueba
// Visitar: /api/auth/crear-test
// ⚠️ BORRAR ESTE ENDPOINT Y EL USUARIO DESPUÉS DE USAR
router.get('/crear-test', async (req, res) => {
  try {
    await ensureUsuariosTable();

    // Borrar si ya existe
    await pool.query(`DELETE FROM usuarios WHERE usuario = 'test_temporal'`);

    await pool.query(
      `INSERT INTO usuarios (usuario, password, nombre, rol, activo)
       VALUES ($1, $2, $3, $4, true)`,
      ['test_temporal', 'test123', 'Usuario de Prueba', 'admin']
    );

    return res.json({ 
      mensaje: '✅ Usuario de prueba creado', 
      usuario: 'test_temporal', 
      password: 'test123',
      aviso: '⚠️ BORRA ESTE USUARIO Y ENDPOINT CUANDO TERMINES'
    });
  } catch (err) {
    console.error('CREAR-TEST ERROR:', err);
    return res.status(500).json({ error: 'Error creando usuario test', detalle: serializeDbError(err) });
  }
});

// TEMPORAL: Borrar usuario de prueba
// Visitar: /api/auth/borrar-test
router.get('/borrar-test', async (req, res) => {
  try {
    await pool.query(`DELETE FROM usuarios WHERE usuario = 'test_temporal'`);
    return res.json({ mensaje: '✅ Usuario test_temporal eliminado' });
  } catch (err) {
    console.error('BORRAR-TEST ERROR:', err);
    return res.status(500).json({ error: 'Error borrando usuario test', detalle: serializeDbError(err) });
  }
});

module.exports = router;
