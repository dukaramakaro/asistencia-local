const express = require('express');
const router = express.Router();
const { miembrosDB, asistenciasDB } = require('../db');
const { limitar } = require('../seguridad');

// Rutas PÚBLICAS del kiosco (no requieren login). Por eso:
//  - devuelven solo lo mínimo para reconocer a la persona (nada de teléfonos ni fechas de nacimiento)
//  - cada consulta trae UN miembro, no la lista completa
//  - hay un límite de peticiones por IP para evitar que alguien descargue todo el padrón
router.use(limitar({ max: 90, ventanaMs: 60 * 1000 }));

const esId = (valor) => /^\d{1,9}$/.test(String(valor));

const publico = (m, yaRegistrado) => ({
  id: m.id,
  numero: m.numero,
  numeroFormateado: m.numeroFormateado,
  nombre: m.nombre,
  fotoBase64: m.fotoBase64 || null,
  tipo: m.tipo,
  yaRegistrado
});

// Buscar por número de miembro: devuelve una sola persona (con foto) y si ya registró hoy
router.get('/numero/:numero', async (req, res) => {
  try {
    const miembro = await miembrosDB.buscarPorNumero(req.params.numero, { fotos: true });
    if (!miembro) return res.status(404).json({ error: 'Miembro no encontrado' });

    const yaRegistrado = await asistenciasDB.verificarAsistenciaHoy(miembro.id);
    res.json(publico(miembro, yaRegistrado));
  } catch (error) {
    console.error('Error en kiosco/numero:', error);
    res.status(500).json({ error: 'Error al buscar miembro' });
  }
});

// Buscar por nombre: lista corta (máx. 10) SIN fotos
router.get('/nombre', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 3) return res.status(400).json({ error: 'Escribe al menos 3 letras' });

    const resultados = await miembrosDB.buscarPorNombre(q);
    res.json(
      resultados.map((m) => ({
        id: m.id,
        numero: m.numero,
        numeroFormateado: m.numeroFormateado,
        nombre: m.nombre,
        tipo: m.tipo
      }))
    );
  } catch (error) {
    console.error('Error en kiosco/nombre:', error);
    res.status(500).json({ error: 'Error al buscar por nombre' });
  }
});

// Una persona por id (con foto): se usa al elegirla de la lista de nombres
router.get('/miembro/:id', async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ error: 'Identificador inválido' });

    const miembro = await miembrosDB.buscarPorId(req.params.id, { fotos: true });
    if (!miembro || miembro.activo === false) return res.status(404).json({ error: 'Miembro no encontrado' });

    const yaRegistrado = await asistenciasDB.verificarAsistenciaHoy(miembro.id);
    res.json(publico(miembro, yaRegistrado));
  } catch (error) {
    console.error('Error en kiosco/miembro:', error);
    res.status(500).json({ error: 'Error al buscar miembro' });
  }
});

module.exports = router;
