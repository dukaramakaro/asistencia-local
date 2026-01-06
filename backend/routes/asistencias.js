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

// POST check-in (registrar asistencia)
router.post('/checkin', async (req, res) => {
  try {
    const { miembroId, nombre, foto, tipo } = req.body;

    let miembro;

    // Si viene miembroId, buscar el miembro
    if (miembroId) {
      miembro = await miembrosDB.buscarPorId(miembroId);
      
      if (!miembro) {
        return res.status(404).json({ error: 'Miembro no encontrado' });
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

module.exports = router;