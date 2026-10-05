const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { crearToken, limitar } = require('../seguridad');

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

// Máx. 10 intentos FALLIDOS cada 15 minutos por IP (los logins correctos no cuentan)
const limiteLogin = limitar({
  max: 10,
  ventanaMs: 15 * 60 * 1000,
  contarSoloErrores: true,
  mensaje: 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.'
});

router.post('/login', limiteLogin, async (req, res) => {
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

    const datosUsuario = { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol };

    return res.json({
      mensaje: 'Login exitoso',
      usuario: datosUsuario,
      token: crearToken(datosUsuario)
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión', detalle: serializeDbError(err) });
  }
});

// Se eliminaron los endpoints de emergencia (setup-admin, reset-admin, crear-test,
// borrar-test) y la clave que estaba escrita en el código.
// Para resetear una contraseña, hazlo directamente en la base (consola SQL de Neon):
//   UPDATE usuarios SET password = 'nueva-clave', activo = true WHERE usuario = 'admin';

module.exports = router;
