const express = require('express');
const router = express.Router();
const { asistenciasDB, miembrosDB } = require('../db');
const { requireAuth, optionalAuth, limitar } = require('../seguridad');

const esId = (valor) => /^\d{1,9}$/.test(String(valor));

// Fotos de visitantes: el kiosco ya las reduce, esto es un tope por si llega algo más grande
const MAX_FOTO_CHARS = 1_500_000;
const fotoValida = (foto) => typeof foto === 'string' && foto.startsWith('data:image/') && foto.length <= MAX_FOTO_CHARS;

// GET todas las asistencias (panel de administración)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { fecha, fechaInicio, fechaFin } = req.query;

    const filtros = {};
    if (fecha) filtros.fecha = fecha;
    if (fechaInicio && fechaFin) {
      filtros.fechaInicio = fechaInicio;
      filtros.fechaFin = fechaFin;
    }

    const asistencias = await asistenciasDB.todas(filtros);
    res.json(asistencias);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
});

// GET verificar si miembro ya tiene asistencia hoy (panel de administración)
router.get('/verificar/:miembroId', requireAuth, async (req, res) => {
  try {
    const { miembroId } = req.params;
    if (!esId(miembroId)) return res.status(400).json({ error: 'Identificador inválido' });

    const yaRegistrado = await asistenciasDB.verificarAsistenciaHoy(miembroId);
    res.json({ yaRegistrado });
  } catch (error) {
    console.error('Error al verificar asistencia:', error);
    res.status(500).json({ error: 'Error al verificar asistencia' });
  }
});

// POST check-in (registrar asistencia). Es PÚBLICO porque lo usa el kiosco,
// pero con límite de peticiones, y "forzar" solo funciona con sesión iniciada.
router.post('/checkin', limitar({ max: 60, ventanaMs: 60 * 1000 }), optionalAuth, async (req, res) => {
  try {
    const { miembroId, nombre, foto, tipo } = req.body || {};
    const forzar = Boolean(req.body && req.body.forzar) && Boolean(req.user);

    let miembro;

    // Si viene miembroId, buscar el miembro
    if (miembroId) {
      if (!esId(miembroId)) return res.status(400).json({ error: 'Identificador inválido' });

      miembro = await miembrosDB.buscarPorId(miembroId);

      if (!miembro) {
        return res.status(404).json({ error: 'Miembro no encontrado' });
      }

      // Verificar si ya tiene asistencia hoy (a menos que un usuario con sesión lo fuerce)
      if (!forzar) {
        const yaRegistrado = await asistenciasDB.verificarAsistenciaHoy(miembroId);
        if (yaRegistrado) {
          return res.status(409).json({
            error: 'Ya registrado',
            mensaje: 'Ya registraste tu asistencia hoy',
            yaRegistrado: true
          });
        }
      }
    }
    // Si es visitante nuevo, crearlo
    else if (nombre && tipo === 'visitante') {
      if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 120) {
        return res.status(400).json({ error: 'Nombre inválido' });
      }
      if (foto && !fotoValida(foto)) {
        return res.status(400).json({ error: 'Foto inválida o demasiado grande' });
      }

      const nuevoMiembro = {
        nombre: nombre.trim(),
        fotoBase64: foto || null,
        tipo: 'visitante'
      };

      miembro = await miembrosDB.crear(nuevoMiembro);
    }
    else {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Registrar asistencia (la foto vive en "miembros"; no se duplica aquí)
    const asistencia = await asistenciasDB.crear({
      miembroId: miembro.id,
      nombre: miembro.nombre,
      tipo: miembro.tipo
    });

    res.status(201).json({
      mensaje: 'Asistencia registrada',
      asistencia,
      miembro
    });
  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
});

// PUT actualizar asistencia
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!esId(id)) return res.status(400).json({ error: 'Identificador inválido' });

    const { miembroId, nombre, tipo } = req.body;

    const asistencia = await asistenciasDB.actualizar(id, { miembroId, nombre, tipo });

    if (!asistencia) {
      return res.status(404).json({ error: 'Asistencia no encontrada' });
    }

    res.json(asistencia);
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    res.status(500).json({ error: 'Error al actualizar asistencia' });
  }
});

// DELETE eliminar asistencia
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!esId(id)) return res.status(400).json({ error: 'Identificador inválido' });

    const eliminada = await asistenciasDB.eliminar(id);

    if (!eliminada) {
      return res.status(404).json({ error: 'Asistencia no encontrada' });
    }

    res.json({ mensaje: 'Asistencia eliminada', id });
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    res.status(500).json({ error: 'Error al eliminar asistencia' });
  }
});

module.exports = router;
