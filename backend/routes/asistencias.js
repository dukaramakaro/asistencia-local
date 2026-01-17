const express = require('express');
const router = express.Router();
const { asistenciasDB, miembrosDB } = require('../db');

// GET todas las asistencias
router.get('/', async (req, res) => {
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

// GET verificar si miembro ya tiene asistencia hoy
router.get('/verificar/:miembroId', async (req, res) => {
  try {
    const { miembroId } = req.params;
    const yaRegistrado = await asistenciasDB.verificarAsistenciaHoy(miembroId);
    res.json({ yaRegistrado });
  } catch (error) {
    console.error('Error al verificar asistencia:', error);
    res.status(500).json({ error: 'Error al verificar asistencia' });
  }
});

// POST check-in (registrar asistencia)
router.post('/checkin', async (req, res) => {
  try {
    const { miembroId, nombre, foto, tipo, forzar } = req.body;

    let miembro;

    // Si viene miembroId, buscar el miembro
    if (miembroId) {
      miembro = await miembrosDB.buscarPorId(miembroId);
      
      if (!miembro) {
        return res.status(404).json({ error: 'Miembro no encontrado' });
      }

      // Verificar si ya tiene asistencia hoy (a menos que se fuerce)
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
      const nuevoMiembro = {
        nombre,
        fotoBase64: foto || null,
        tipo: 'visitante'
      };
      
      miembro = await miembrosDB.crear(nuevoMiembro);
    } 
    else {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Registrar asistencia
    const asistencia = await asistenciasDB.crear({
      miembroId: miembro.id,
      nombre: miembro.nombre,
      fotoBase64: miembro.fotoBase64,
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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