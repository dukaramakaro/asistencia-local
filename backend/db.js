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

    const { rows } = await pool.query('SELECT id FROM usuarios WHERE usuario = $1 LIMIT 1', ['admin']);
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO usuarios (usuario, password, nombre, rol, activo) VALUES ($1, $2, $3, $4, true)',
        ['admin', 'admin123', 'Administrador', 'admin']
      );
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

// Miembros
const miembrosDB = {
  todas: async () => {
    const { rows } = await pool.query('SELECT * FROM miembros ORDER BY nombre ASC');
    return rows.map((m) => ({
      id: String(m.id),
      numero: m.numero,
      numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
      nombre: m.nombre,
      fechaNacimiento: m.fecha_nacimiento,
      edad: calcularEdad(m.fecha_nacimiento),
      telefono: m.telefono,
      telefonoEmergencia: m.telefono_emergencia,
      email: m.email,
      fotoBase64: m.foto_base64,
      tipo: m.tipo,
      activo: m.activo,
      fechaRegistro: m.fecha_registro
    }));
  },

  buscarPorId: async (id) => {
    const { rows } = await pool.query('SELECT * FROM miembros WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    const m = rows[0];
    return {
      id: String(m.id),
      numero: m.numero,
      numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
      nombre: m.nombre,
      fechaNacimiento: m.fecha_nacimiento,
      edad: calcularEdad(m.fecha_nacimiento),
      telefono: m.telefono,
      telefonoEmergencia: m.telefono_emergencia,
      email: m.email,
      fotoBase64: m.foto_base64,
      tipo: m.tipo,
      activo: m.activo,
      fechaRegistro: m.fecha_registro
    };
  },

  buscarPorNumero: async (numero) => {
    const { rows } = await pool.query(
      'SELECT * FROM miembros WHERE numero = $1 AND activo = true LIMIT 1',
      [numero]
    );
    if (rows.length === 0) return null;
    const m = rows[0];
    return {
      id: String(m.id),
      numero: m.numero,
      numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
      nombre: m.nombre,
      fechaNacimiento: m.fecha_nacimiento,
      edad: calcularEdad(m.fecha_nacimiento),
      telefono: m.telefono,
      telefonoEmergencia: m.telefono_emergencia,
      email: m.email,
      fotoBase64: m.foto_base64,
      tipo: m.tipo,
      activo: m.activo
    };
  },

  buscarPorNombre: async (nombre) => {
    const { rows } = await pool.query(
      'SELECT * FROM miembros WHERE LOWER(nombre) LIKE $1 AND activo = true LIMIT 10',
      [`%${String(nombre || '').toLowerCase()}%`]
    );
    return rows.map((m) => ({
      id: String(m.id),
      numero: m.numero,
      numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
      nombre: m.nombre,
      fotoBase64: m.foto_base64,
      tipo: m.tipo
    }));
  },

  crear: async (miembro) => {
    const { rows: maxRows } = await pool.query(
      "SELECT MAX(CAST(numero AS INTEGER)) as max FROM miembros WHERE numero ~ '^[0-9]+$'"
    );

    const siguienteNumero = (maxRows[0]?.max || 0) + 1;
    const numero = String(siguienteNumero).padStart(4, '0');
    const edad = calcularEdad(miembro.fechaNacimiento);

    const { rows } = await pool.query(
      `INSERT INTO miembros (
        numero, nombre, fecha_nacimiento, edad, telefono, telefono_emergencia, email, foto_base64, tipo, activo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      RETURNING *`,
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

    const m = rows[0];
    return {
      id: String(m.id),
      numero: m.numero,
      numeroFormateado: m.tipo === 'visitante' ? `V-${m.numero}` : m.numero,
      nombre: m.nombre,
      fechaNacimiento: m.fecha_nacimiento,
      edad: m.edad,
      telefono: m.telefono,
      telefonoEmergencia: m.telefono_emergencia,
      email: m.email,
      fotoBase64: m.foto_base64,
      tipo: m.tipo,
      activo: m.activo,
      fechaRegistro: m.fecha_registro
    };
  }
};

// Asistencias
const asistenciasDB = {
  todas: async (filtros = {}) => {
    let query = 'SELECT * FROM asistencias';
    const conditions = [];
    const values = [];
    let idx = 1;

    if (filtros.fecha) {
      conditions.push(`fecha = $${idx++}`);
      values.push(filtros.fecha);
    } else if (filtros.fechaInicio && filtros.fechaFin) {
      conditions.push(`fecha >= $${idx++} AND fecha <= $${idx++}`);
      values.push(filtros.fechaInicio, filtros.fechaFin);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY hora DESC';

    const { rows } = await pool.query(query, values);

    const asistencias = await Promise.all(
      rows.map(async (a) => {
        let miembro = null;
        if (a.miembro_id) miembro = await miembrosDB.buscarPorId(a.miembro_id);

        return {
          id: String(a.id),
          miembroId: a.miembro_id ? String(a.miembro_id) : null,
          nombre: a.nombre,
          fotoBase64: a.foto_base64,
          fecha: a.fecha,
          hora: a.hora,
          tipo: a.tipo,
          miembro
        };
      })
    );

    return asistencias;
  },

  verificarAsistenciaHoy: async (miembroId) => {
    const { rows } = await pool.query(
      `SELECT id FROM asistencias WHERE miembro_id = $1 AND fecha = $2 LIMIT 1`,
      [miembroId, fechaCancun()]
    );
    return rows.length > 0;
  },

  crear: async (asistencia) => {
    const { rows } = await pool.query(
      `INSERT INTO asistencias (miembro_id, nombre, foto_base64, fecha, hora, tipo)
       VALUES ($1, $2, $3, $4, timezone('America/Cancun', now()), $5)
       RETURNING *`,
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
      fotoBase64: a.foto_base64,
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
       RETURNING *`,
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
      fotoBase64: a.foto_base64,
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
  asistenciasDB
};
