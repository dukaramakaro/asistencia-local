const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Clave para firmar los tokens de sesión.
// - Si defines AUTH_SECRET en las variables de entorno, se usa esa.
// - Si no, se deriva de DATABASE_URL (que ya es secreta y estable), así los
//   tokens sobreviven a los reinicios de Render sin configurar nada.
// - Si no existe ninguna de las dos, se genera una al azar (los tokens
//   dejarán de valer al reiniciar, pero nunca habrá una clave adivinable).
// ---------------------------------------------------------------------------
const SECRET =
  process.env.AUTH_SECRET ||
  (process.env.DATABASE_URL
    ? crypto.createHash('sha256').update('lmtlss-auth|' + process.env.DATABASE_URL).digest('hex')
    : crypto.randomBytes(32).toString('hex'));

const DURACION_TOKEN_MS = 12 * 60 * 60 * 1000; // 12 horas

const firmar = (texto) => crypto.createHmac('sha256', SECRET).update(texto).digest('base64url');

function crearToken(usuario) {
  const payload = Buffer.from(
    JSON.stringify({
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
      exp: Date.now() + DURACION_TOKEN_MS
    })
  ).toString('base64url');

  return `${payload}.${firmar(payload)}`;
}

function leerToken(token) {
  if (typeof token !== 'string') return null;

  const partes = token.split('.');
  if (partes.length !== 2) return null;

  const [payload, firma] = partes;
  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);

  // Comparación en tiempo constante para no filtrar información por tiempos de respuesta
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) return null;

  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!datos.exp || datos.exp < Date.now()) return null;
    return datos;
  } catch (e) {
    return null;
  }
}

const tokenDe = (req) => {
  const cabecera = req.headers.authorization || '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
};

// Exige sesión válida
function requireAuth(req, res, next) {
  const datos = leerToken(tokenDe(req));
  if (!datos) return res.status(401).json({ error: 'Sesión no válida o expirada' });
  req.user = datos;
  next();
}

// Lee la sesión si existe, pero no la exige (rutas públicas del kiosco)
function optionalAuth(req, res, next) {
  req.user = leerToken(tokenDe(req));
  next();
}

// Exige rol administrador (usar después de requireAuth)
function requireAdmin(req, res, next) {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Esta acción requiere rol de administrador' });
  }
  next();
}

// ---------------------------------------------------------------------------
// Límite de peticiones por IP (en memoria). Frena el scraping del kiosco
// público y los intentos de adivinar contraseñas.
// contarSoloErrores: las respuestas exitosas no cuentan (útil para el login).
// ---------------------------------------------------------------------------
function limitar({ max, ventanaMs, mensaje, contarSoloErrores = false }) {
  const registro = new Map();

  setInterval(() => {
    const ahora = Date.now();
    for (const [ip, e] of registro) if (e.reinicia <= ahora) registro.delete(ip);
  }, 60 * 1000).unref();

  return (req, res, next) => {
    const ahora = Date.now();
    let e = registro.get(req.ip);
    if (!e || e.reinicia <= ahora) {
      e = { n: 0, reinicia: ahora + ventanaMs };
      registro.set(req.ip, e);
    }

    e.n++;

    if (e.n > max) {
      res.set('Retry-After', String(Math.ceil((e.reinicia - ahora) / 1000)));
      return res.status(429).json({ error: mensaje || 'Demasiadas solicitudes, intenta de nuevo en un momento' });
    }

    if (contarSoloErrores) {
      res.on('finish', () => {
        if (res.statusCode < 400) e.n = Math.max(0, e.n - 1);
      });
    }

    next();
  };
}

module.exports = { crearToken, leerToken, requireAuth, optionalAuth, requireAdmin, limitar };
