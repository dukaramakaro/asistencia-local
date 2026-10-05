import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// --- Sesión ---------------------------------------------------------------
export const guardarSesion = ({ token, usuario }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
};

export const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

export const haySesion = () => Boolean(localStorage.getItem('token'));

// --- Axios: adjunta el token a TODAS las peticiones hacia nuestra API -------
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && typeof config.url === 'string' && config.url.startsWith(API_URL)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el servidor dice que la sesión ya no vale (venció a las 12 h, por ejemplo),
// se limpia y se manda al login. El propio login (contraseña mala) no cuenta.
axios.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url = error.config?.url || '';
    const sesionInvalida =
      error.response?.status === 401 &&
      url.startsWith(API_URL) &&
      !url.includes('/auth/login') &&
      haySesion();

    if (sesionInvalida) {
      cerrarSesion();
      window.location.assign('/admin/login');
    }
    return Promise.reject(error);
  }
);

// --- Descargas autenticadas (Excel) ----------------------------------------
// window.open() no puede enviar el token, así que se descarga con axios y se
// entrega el archivo al navegador.
export async function descargarExcel(ruta, params, nombreArchivo) {
  const respuesta = await axios.get(`${API_URL}${ruta}`, { params, responseType: 'blob' });

  const url = window.URL.createObjectURL(respuesta.data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}
