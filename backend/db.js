const { Pool } = require('pg');

// Render Postgres requiere SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Fecha YYYY-MM-DD en America/Cancun
const fechaCancun = () => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Cancun',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(new Date());
};

// Inicializar tablas
const inicializarDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'admin',
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS miembros (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(10) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        fecha_nacimiento DATE,
        edad INTEGER,
        telefono VARCHAR(20),
        telefono_emergencia VARCHAR(20),
        email VARCHAR(255),
        foto_base64 TEXT,
        tipo VARCHAR(20) DEFAULT 'miembro',
        activo BOOLEAN DEFAULT true,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id SERIAL PRIMARY KEY,
        miembro_id INTEGER REFERENCES miembros(id),
        nombre VARCHAR(255),
        foto_base64 TEXT,
        fecha DATE NOT NULL,
        hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tipo VARCHAR(20) DEFAULT 'miembro'
      )
    `);

    // Usuario inicial SOLO en una instalación nueva (tabla vacía).
    // Antes se recreaba "admin/admin123" en cada arranque si no existía un usuario
    // llamado "admin", lo que dejaba una puerta abierta con contraseña conocida.
    const { rows } = await pool.query('SELECT 1 FROM usuarios LIMIT 1');
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO usuarios (usuario, password, nombre, rol, activo) VALUES ($1, $2, $3, $4, true)',
        ['admin', 'admin123', 'Administrador', 'admin']
      );
      console.warn('⚠️ Instalación nueva: se creó el usuario admin / admin123. Cambia la contraseña al entrar.');
    }

    console.log('✅ Base de datos inicializada (usuarios/miembros/asistencias)');
  } catch (error) {
    console.error('❌ Error inicializando DB:', error);
  }
};

// Calcular edad
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
};

// ---------------------------------------------------------------------------
// IMPORTANTE (tráfico de red de Neon):
// foto_base64 pesa cientos de KB por fila. Nunca se usa SELECT * en miembros:
// las columnas se listan explícitamente y la foto se pide solo cuando hace falta.
// ---------------------------------------------------------------------------
const COLS_MIEMBRO =
  'id, numero, nombre, fecha_nacimiento, edad, telefono, telefono_emergencia, email, tipo, activo, fecha_registro';

const mapMiembro = (m) => ({
  id: String(m.id),
  numero: m.numero,
  numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
  nombre: m.nombre,
  fechaNacimiento: m.fecha_nacimiento,
  edad: calcularEdad(m.fecha_nacimiento),
  telefono: m.telefono,
  telefonoEmergencia: m.telefono_emergencia,
  email: m.email,
  observaciones: m.email || '',
  // Solo viene si la consulta pidió la foto (si no, queda undefined y no se envía)
  fotoBase64: m.foto_base64,
  tipo: m.tipo,
  activo: m.activo,
  fechaRegistro: m.fecha_registro
});

// Miembros
const miembrosDB = {
  // La exportación a Excel necesita fotos, por eso fotos=true por defecto aquí
  todas: async ({ fotos = true } = {}) => {
    const { rows } = await pool.query(
      `SELECT ${COLS_MIEMBRO}${fotos ? ', foto_base64' : ''} FROM miembros ORDER BY nombre ASC`
    );
    return rows.map(mapMiembro);
  },

  buscarPorId: async (id, { fotos = false } = {}) => {
    const { rows } = await pool.query(
      `SELECT ${COLS_MIEMBRO}${fotos ? ', foto_base64' : ''} FROM miembros WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return null;
    return mapMiembro(rows[0]);
  },

  // Acepta "1", "0001" o "V-0001": se comparan solo los dígitos, con y sin ceros a la izquierda
  buscarPorNumero: async (numero, { fotos = false } = {}) => {
    const digitos = String(numero || '').replace(/[^0-9]/g, '');
    if (!digitos) return null;

    const { rows } = await pool.query(
      `SELECT ${COLS_MIEMBRO}${fotos ? ', foto_base64' : ''}
       FROM miembros
       WHERE (numero = $1 OR numero = $2) AND activo = true
       LIMIT 1`,
      [digitos, digitos.padStart(4, '0')]
    );
    if (rows.length === 0) return null;
    return mapMiembro(rows[0]);
  },

  // Búsqueda sin distinguir mayúsculas ni acentos. Nunca trae fotos.
  buscarPorNombre: async (texto) => {
    const limpio = String(texto || '').trim().toLowerCase().replace(/[\\%_]/g, '\\$&');
    if (!limpio) return [];

    const { rows } = await pool.query(
      `SELECT id, numero, nombre, tipo
       FROM miembros
       WHERE translate(lower(nombre), 'áéíóúüñ', 'aeiouun') LIKE '%' || translate($1, 'áéíóúüñ', 'aeiouun') || '%'
         AND activo = true
       ORDER BY nombre ASC
       LIMIT 10`,
      [limpio]
    );
    return rows.map(mapMiembro);
  },

  crear: async (miembro) => {
    const { rows: maxRows } = await pool.query(
      "SELECT MAX(CAST(numero AS INTEGER)) as max FROM miembros WHERE numero ~ '^[0-9]+$'"
    );

    const siguienteNumero = (maxRows[0]?.max || 0) + 1;
    const numero = String(siguienteNumero).padStart(4, '0');
    const edad = calcularEdad(miembro.fechaNacimiento);

    // RETURNING sin la foto: no hace falta que la base nos devuelva lo que acabamos de enviarle
    const { rows } = await pool.query(
      `INSERT INTO miembros (
        numero, nombre, fecha_nacimiento, edad, telefono, telefono_emergencia, email, foto_base64, tipo, activo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      RETURNING ${COLS_MIEMBRO}`,
      [
        numero,
        miembro.nombre,
        miembro.fechaNacimiento || null,
        edad,
        miembro.telefono || null,
        miembro.telefonoEmergencia || null,
        miembro.email || null,
        miembro.fotoBase64 || null,
        miembro.tipo || 'miembro'
      ]
    );

    return mapMiembro(rows[0]);
  }
};

// Convierte una fila del JOIN asistencias + miembros al formato que usa el frontend
const mapAsistenciaJoin = (a) => ({
  id: String(a.id),
  miembroId: a.miembro_id ? String(a.miembro_id) : null,
  nombre: a.nombre,
  fotoBase64: a.foto !== undefined ? a.foto : undefined,
  fecha: a.fecha,
  hora: a.hora,
  tipo: a.tipo,
  miembro: a.miembro_id
    ? mapMiembro({
        id: a.miembro_id,
        numero: a.m_numero,
        nombre: a.m_nombre,
        fecha_nacimiento: a.m_fecha_nacimiento,
        telefono: a.m_telefono,
        telefono_emergencia: a.m_telefono_emergencia,
        email: a.m_email,
        tipo: a.m_tipo,
        activo: a.m_activo,
        fecha_registro: a.m_fecha_registro
      })
    : null
});

// Asistencias
const asistenciasDB = {
  // Una sola consulta (JOIN) en lugar de una por cada asistencia.
  // fotos=true solo para exportar a Excel; en pantalla no se muestran fotos.
  todas: async (filtros = {}) => {
    const incluirFotos = filtros.fotos === true;

    let query = `
      SELECT a.id, a.miembro_id, a.nombre, a.fecha, a.hora, a.tipo,
             m.numero AS m_numero, m.nombre AS m_nombre, m.fecha_nacimiento AS m_fecha_nacimiento,
             m.telefono AS m_telefono, m.telefono_emergencia AS m_telefono_emergencia,
             m.email AS m_email, m.tipo AS m_tipo, m.activo AS m_activo, m.fecha_registro AS m_fecha_registro
             ${incluirFotos ? ', COALESCE(a.foto_base64, m.foto_base64) AS foto' : ''}
      FROM asistencias a
      LEFT JOIN miembros m ON m.id = a.miembro_id`;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (filtros.fecha) {
      conditions.push(`a.fecha = $${idx++}`);
      values.push(filtros.fecha);
    } else {
      if (filtros.fechaInicio) {
        conditions.push(`a.fecha >= $${idx++}`);
        values.push(filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        conditions.push(`a.fecha <= $${idx++}`);
        values.push(filtros.fechaFin);
      }
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.hora DESC';

    const { rows } = await pool.query(query, values);
    return rows.map(mapAsistenciaJoin);
  },

  verificarAsistenciaHoy: async (miembroId) => {
    const { rows } = await pool.query(
      `SELECT id FROM asistencias WHERE miembro_id = $1 AND fecha = $2 LIMIT 1`,
      [miembroId, fechaCancun()]
    );
    return rows.length > 0;
  },

  // Ya no se copia la foto del miembro en cada asistencia: la foto vive solo en "miembros"
  crear: async (asistencia) => {
    const { rows } = await pool.query(
      `INSERT INTO asistencias (miembro_id, nombre, foto_base64, fecha, hora, tipo)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       RETURNING id, miembro_id, nombre, fecha, hora, tipo`,
      [
        asistencia.miembroId || null,
        asistencia.nombre || null,
        asistencia.foto || asistencia.fotoBase64 || null,
        fechaCancun(),
        asistencia.tipo || 'miembro'
      ]
    );

    const a = rows[0];
    let miembro = null;
    if (a.miembro_id) miembro = await miembrosDB.buscarPorId(a.miembro_id);

    return {
      id: String(a.id),
      miembroId: a.miembro_id ? String(a.miembro_id) : null,
      nombre: a.nombre,
      fecha: a.fecha,
      hora: a.hora,
      tipo: a.tipo,
      miembro
    };
  },

  actualizar: async (id, datos) => {
    const { rows } = await pool.query(
      `UPDATE asistencias SET
        miembro_id = COALESCE($2, miembro_id),
        nombre = COALESCE($3, nombre),
        tipo = COALESCE($4, tipo)
       WHERE id = $1
       RETURNING id, miembro_id, nombre, fecha, hora, tipo`,
      [id, datos.miembroId || null, datos.nombre || null, datos.tipo || null]
    );

    if (rows.length === 0) return null;

    const a = rows[0];
    let miembro = null;
    if (a.miembro_id) miembro = await miembrosDB.buscarPorId(a.miembro_id);

    return {
      id: String(a.id),
      miembroId: a.miembro_id ? String(a.miembro_id) : null,
      nombre: a.nombre,
      fecha: a.fecha,
      hora: a.hora,
      tipo: a.tipo,
      miembro
    };
  },

  eliminar: async (id) => {
    const { rowCount } = await pool.query('DELETE FROM asistencias WHERE id = $1', [id]);
    return rowCount > 0;
  }
};

inicializarDB();

module.exports = {
  pool,
  miembrosDB,
  asistenciasDB,
  calcularEdad,
  COLS_MIEMBRO
};
