const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { asistenciasDB, miembrosDB } = require('../db');

function normalizarBase64(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // Si viene como data URL: data:image/jpeg;base64,....
  const m = s.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (m && m[2]) {
    return { base64: m[2], ext: (m[1] || 'jpeg').toLowerCase().replace('jpg', 'jpeg') };
  }

  // Si viene solo base64
  return { base64: s, ext: 'jpeg' };
}

function insertarImagen(workbook, worksheet, base64Input, rowIndex1Based, colIndex1Based, opts = {}) {
  const normalized = normalizarBase64(base64Input);
  if (!normalized) return;

  const width = opts.width || 60;
  const height = opts.height || 60;

  const imageId = workbook.addImage({
    base64: normalized.base64,
    extension: normalized.ext === 'png' ? 'png' : 'jpeg'
  });

  // ExcelJS usa indices 0-based para tl
  worksheet.addImage(imageId, {
    tl: { col: colIndex1Based - 1, row: rowIndex1Based - 1 },
    ext: { width, height }
  });

  // Ajustes de fila/columna para que quepa bien
  const row = worksheet.getRow(rowIndex1Based);
  row.height = Math.max(row.height || 0, 48);

  const col = worksheet.getColumn(colIndex1Based);
  col.width = Math.max(col.width || 0, 12);
}

// Exportar asistencias a Excel
router.get('/asistencias', async (req, res) => {
  try {
    const { fecha, fechaInicio, fechaFin } = req.query;

    const filtros = {};
    if (fecha) {
      filtros.fecha = fecha;
    } else if (fechaInicio || fechaFin) {
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
    }

    const asistencias = await asistenciasDB.todas(filtros);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencias');

    worksheet.columns = [
      { header: 'Foto', key: 'foto', width: 12 },
      { header: 'Número', key: 'numero', width: 12 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Hora', key: 'hora', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 35 }
    ];

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    asistencias.forEach((a) => {
      const miembro = a.miembro;

      worksheet.addRow({
        foto: '',
        numero: miembro?.numeroFormateado || miembro?.numero || '',
        nombre: miembro?.nombre || a.nombre || '',
        fecha: a.fecha || '',
        hora: a.hora
          ? new Date(a.hora).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'America/Cancun'
            })
          : '',
        tipo: miembro?.tipo || a.tipo || 'visitante',
        telefono: miembro?.telefono || '',
        observaciones: miembro?.observaciones || ''
      });
    });

    // Insertar fotos después de crear filas
    for (let i = 0; i < asistencias.length; i++) {
      const a = asistencias[i];
      const miembro = a.miembro;

      const fotoPreferida = a.fotoBase64 || miembro?.fotoBase64 || null;
      const rowIndex = i + 2; // 1 es header
      insertarImagen(workbook, worksheet, fotoPreferida, rowIndex, 1, { width: 60, height: 60 });
    }

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    const fechaDescarga = fecha
      ? fecha
      : (fechaInicio && fechaFin ? `${fechaInicio}_${fechaFin}` : new Date().toISOString().split('T')[0]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=asistencias_${fechaDescarga}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar asistencias:', error);
    res.status(500).json({ error: 'Error al exportar Excel' });
  }
});

// Exportar lista de miembros a Excel
router.get('/miembros', async (req, res) => {
  try {
    const miembros = (await miembrosDB.todas()).filter(m => m.activo !== false);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Miembros');

    worksheet.columns = [
      { header: 'Foto', key: 'foto', width: 12 },
      { header: 'Número', key: 'numero', width: 12 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Fecha Nacimiento', key: 'fechaNacimiento', width: 15 },
      { header: 'Edad', key: 'edad', width: 8 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Tel. Emergencia', key: 'telefonoEmergencia', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 35 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Fecha Registro', key: 'registro', width: 15 }
    ];

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    miembros.forEach((m) => {
      worksheet.addRow({
        foto: '',
        numero: m.numeroFormateado || m.numero,
        nombre: m.nombre,
        fechaNacimiento: m.fechaNacimiento ? new Date(m.fechaNacimiento).toLocaleDateString('es-MX') : '',
        edad: m.edad || '',
        telefono: m.telefono || '',
        telefonoEmergencia: m.telefonoEmergencia || '',
        observaciones: m.observaciones || '',
        tipo: m.tipo,
        registro: m.fechaRegistro ? new Date(m.fechaRegistro).toLocaleDateString('es-MX') : ''
      });
    });

    for (let i = 0; i < miembros.length; i++) {
      const m = miembros[i];
      const rowIndex = i + 2;
      insertarImagen(workbook, worksheet, m.fotoBase64, rowIndex, 1, { width: 60, height: 60 });
    }

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=miembros_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar miembros:', error);
    res.status(500).json({ error: 'Error al exportar Excel' });
  }
});

module.exports = router;
