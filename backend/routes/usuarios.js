const express = require('express');
const router = express.Router();
const { pool } = require('../db');

function serializeDbError(err) {
  if (!err) return { message: 'Unknown error' };
  return {
    message: err.message || String(err),
    code: err.code || null,
    detail: err.detail || null
  };
}

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, usuario, nombre, rol, activo
       FROM usuarios
       ORDER BY nombre ASC`
    );
    
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios', detalle: serializeDbError(err) });
  }
});

// Cambiar contraseña de un usuario (admin)
router.patch('/:id/cambiar-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaPassword } = req.body;

    if (!nuevaPassword || nuevaPassword.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
    }

    const { rows } = await pool.query(
      `UPDATE usuarios 
       SET password = $1
       WHERE id = $2
       RETURNING id, usuario, nombre, rol`,
      [nuevaPassword, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ 
      mensaje: 'Contraseña actualizada exitosamente',
      usuario: rows[0]
    });
  } catch (err) {
    console.error('Error cambiando contraseña:', err);
    res.status(500).json({ error: 'Error al cambiar contraseña', detalle: serializeDbError(err) });
  }
});

// Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { usuario, password, nombre, rol } = req.body;

    if (!usuario || !password || !nombre) {
      return res.status(400).json({ error: 'Usuario, contraseña y nombre son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const { rows } = await pool.query(
      `INSERT INTO usuarios (usuario, password, nombre, rol, activo)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, usuario, nombre, rol, activo`,
      [usuario, password, nombre, rol || 'admin']
    );

    res.json({
      mensaje: 'Usuario creado exitosamente',
      usuario: rows[0]
    });
  } catch (err) {
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error al crear usuario', detalle: serializeDbError(err) });
  }
});

// Activar/desactivar usuario
router.patch('/:id/toggle-activo', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `UPDATE usuarios 
       SET activo = NOT activo
       WHERE id = $1
       RETURNING id, usuario, nombre, rol, activo`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: `Usuario ${rows[0].activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: rows[0]
    });
  } catch (err) {
    console.error('Error cambiando estado usuario:', err);
    res.status(500).json({ error: 'Error al cambiar estado', detalle: serializeDbError(err) });
  }
});

module.exports = router;
