const express = require('express');
const router = express.Router();
const { pool, miembrosDB, calcularEdad } = require('../db');

// Convertir fecha a formato YYYY-MM-DD para inputs type="date"
const formatearFecha = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get('/', async (req, res) => {
  try {
    const incluirInactivos = String(req.query.inactivos || 'true') === 'true';

    const { rows } = await pool.query(
      `SELECT *
       FROM miembros
       WHERE ($1::boolean = true) OR (activo = true)
       ORDER BY CAST(numero AS INT) ASC`,
      [incluirInactivos]
    );

    res.json(rows.map(m => ({
      id: String(m.id),
      numero: m.numero,
      numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
      nombre: m.nombre,
      fechaNacimiento: formatearFecha(m.fecha_nacimiento),
      edad: m.edad,
      telefono: m.telefono,
      telefonoEmergencia: m.telefono_emergencia,
      observaciones: m.email || '',
      fotoBase64: m.foto_base64,
      tipo: m.tipo,
      activo: m.activo,
      fechaRegistro: m.fecha_registro
    })));
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({ error: 'Error al obtener miembros', detalle: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.nombre) return res.status(400).json({ error: 'Nombre es requerido' });

    const creado = await miembrosDB.crear({
      nombre: body.nombre,
      fechaNacimiento: body.fechaNacimiento || null,
      telefono: body.telefono || null,
      telefonoEmergencia: body.telefonoEmergencia || null,
      email: body.observaciones || body.email || '',
      fotoBase64: body.fotoBase64 || body.foto || null,
      tipo: body.tipo || 'miembro'
    });

    res.json(creado);
  } catch (error) {
    console.error('Error al crear miembro:', error);
    res.status(500).json({ error: 'Error al crear miembro', detalle: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const { rows: exists } = await pool.query('SELECT * FROM miembros WHERE id = $1', [id]);
    if (exists.length === 0) return res.status(404).json({ error: 'Miembro no encontrado' });

    // Normalizar valores vacíos a null
    const fechaNacimiento = body.fechaNacimiento === '' ? null : (body.fechaNacimiento ?? exists[0].fecha_nacimiento);
    const campos = {
      nombre: body.nombre ?? exists[0].nombre,
      fecha_nacimiento: fechaNacimiento,
      edad: calcularEdad(fechaNacimiento),
      telefono: body.telefono === '' ? null : (body.telefono ?? exists[0].telefono),
      telefono_emergencia: body.telefonoEmergencia === '' ? null : (body.telefonoEmergencia ?? exists[0].telefono_emergencia),
      email: body.observaciones === '' ? null : (body.observaciones ?? body.email ?? exists[0].email),
      foto_base64: body.fotoBase64 ?? body.foto ?? exists[0].foto_base64,
      activo: typeof body.activo === 'boolean' ? body.activo : exists[0].activo
    };

    const { rows } = await pool.query(
      `UPDATE miembros
       SET nombre = $1,
           fecha_nacimiento = $2,
           edad = $3,
           telefono = $4,
           telefono_emergencia = $5,
           email = $6,
           foto_base64 = $7,
           activo = $8
       WHERE id = $9
       RETURNING *`,
      [
        campos.nombre,
        campos.fecha_nacimiento,
        campos.edad,
        campos.telefono,
        campos.telefono_emergencia,
        campos.email,
        campos.foto_base64,
        campos.activo,
        id
      ]
    );

    const m = rows[0];
    res.json({
      id: String(m.id),
      numero: m.numero,
      numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
      nombre: m.nombre,
      fechaNacimiento: formatearFecha(m.fecha_nacimiento),
      edad: m.edad,
      telefono: m.telefono,
      telefonoEmergencia: m.telefono_emergencia,
      observaciones: m.email || '',
      fotoBase64: m.foto_base64,
      tipo: m.tipo,
      activo: m.activo,
      fechaRegistro: m.fecha_registro
    });
  } catch (error) {
    console.error('Error al actualizar miembro:', error);
    res.status(500).json({ error: 'Error al actualizar miembro', detalle: error.message });
  }
});

router.patch('/:id/inactivar', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE miembros SET activo = false WHERE id = $1 RETURNING *`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
    res.json({ mensaje: 'Miembro inactivado', miembro: rows[0] });
  } catch (error) {
    console.error('Error al inactivar miembro:', error);
    res.status(500).json({ error: 'Error al inactivar miembro', detalle: error.message });
  }
});

router.patch('/:id/activar', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE miembros SET activo = true WHERE id = $1 RETURNING *`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
    res.json({ mensaje: 'Miembro activado', miembro: rows[0] });
  } catch (error) {
    console.error('Error al activar miembro:', error);
    res.status(500).json({ error: 'Error al activar miembro', detalle: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE miembros SET activo = false WHERE id = $1 RETURNING *`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
    res.json({ mensaje: 'Miembro eliminado (inactivado)', miembro: rows[0] });
  } catch (error) {
    console.error('Error al eliminar miembro:', error);
    res.status(500).json({ error: 'Error al eliminar miembro', detalle: error.message });
  }
});

// Permanente (borra el miembro, conserva historial: desvincula asistencias)
async function borrarPermanente(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: prev } = await client.query('SELECT * FROM miembros WHERE id = $1', [id]);
    if (prev.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, data: { error: 'Miembro no encontrado' } };
    }

    // Desvincula asistencias para conservar historial y evitar FK
    await client.query('UPDATE asistencias SET miembro_id = NULL WHERE miembro_id = $1', [id]);

    // Borra el miembro
    await client.query('DELETE FROM miembros WHERE id = $1', [id]);

    await client.query('COMMIT');
    return { ok: true, status: 200, data: { mensaje: 'Miembro eliminado permanentemente (historial conservado)', miembro: prev[0] } };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    return { ok: false, status: 500, data: { error: 'Error al eliminar permanentemente', detalle: e.message } };
  } finally {
    client.release();
  }
}

router.delete('/:id/permanente', async (req, res) => {
  const r = await borrarPermanente(req.params.id);
  return res.status(r.status).json(r.data);
});

router.delete('/:id/permanent', async (req, res) => {
  const r = await borrarPermanente(req.params.id);
  return res.status(r.status).json(r.data);
});

router.delete('/permanente/:id', async (req, res) => {
  const r = await borrarPermanente(req.params.id);
  return res.status(r.status).json(r.data);
});

router.delete('/permanent/:id', async (req, res) => {
  const r = await borrarPermanente(req.params.id);
  return res.status(r.status).json(r.data);
});

module.exports = router;
