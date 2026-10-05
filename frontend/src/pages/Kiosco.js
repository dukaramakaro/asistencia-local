import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { reducirImagen } from '../utils/imagen';
import './Kiosco.css';
import logoLMTLSS from '../assets/logo-lmtlss.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Kiosco() {
  const [modo, setModo] = useState('inicio');
  const [numeroMiembro, setNumeroMiembro] = useState('');
  const [nombreBusqueda, setNombreBusqueda] = useState('');
  const [nombreVisitante, setNombreVisitante] = useState('');
  const [fotoVisitante, setFotoVisitante] = useState(null);
  const [capturandoFoto, setCapturandoFoto] = useState(false);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [yaRegistrado, setYaRegistrado] = useState(false);
  
  const webcamRef = useRef(null);

  const resetearTodo = () => {
    setModo('inicio');
    setNumeroMiembro('');
    setNombreBusqueda('');
    setNombreVisitante('');
    setFotoVisitante(null);
    setCapturandoFoto(false);
    setMiembroSeleccionado(null);
    setResultadosBusqueda([]);
    setMensaje('');
    setYaRegistrado(false);
  };

  const buscarPorNumero = async (e) => {
    e.preventDefault();
    
    if (!numeroMiembro.trim()) {
      alert('Por favor ingresa tu número de miembro');
      return;
    }

    // Solo dígitos: acepta "1", "0001" o "V-0001"
    const numeroLimpio = numeroMiembro.replace(/[^0-9]/g, '');
    if (!numeroLimpio) {
      alert('Número de miembro no encontrado');
      setNumeroMiembro('');
      return;
    }

    try {
      // El servidor devuelve SOLO a esta persona (con su foto) y si ya registró hoy.
      // Antes se descargaba la lista completa de miembros con todas sus fotos.
      const res = await axios.get(`${API_URL}/kiosco/numero/${numeroLimpio}`);
      setMiembroSeleccionado(res.data);
      setYaRegistrado(res.data.yaRegistrado);
      setModo('confirmacion');
    } catch (error) {
      if (error.response?.status === 404) {
        alert('Número de miembro no encontrado');
        setNumeroMiembro('');
        return;
      }
      console.error('Error buscando miembro:', error);
      alert(error.response?.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'Error al buscar miembro');
    }
  };

  const buscarPorNombre = async (e) => {
    e.preventDefault();
    
    const texto = nombreBusqueda.trim();

    if (!texto) {
      alert('Por favor escribe un nombre');
      return;
    }

    if (texto.length < 3) {
      alert('Escribe al menos 3 letras de tu nombre');
      return;
    }

    try {
      // Lista corta (máx. 10) sin fotos; la foto se pide al elegir a la persona
      const res = await axios.get(`${API_URL}/kiosco/nombre`, { params: { q: texto } });
      const resultados = res.data;

      if (resultados.length === 0) {
        alert('No se encontraron miembros con ese nombre');
        return;
      }

      if (resultados.length === 1) {
        await seleccionarMiembro(resultados[0]);
      } else {
        setResultadosBusqueda(resultados);
      }
    } catch (error) {
      console.error('Error buscando por nombre:', error);
      alert(error.response?.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'Error al buscar por nombre');
    }
  };

  const seleccionarMiembro = async (miembro) => {
    try {
      // Trae a esa persona con su foto y si ya registró asistencia hoy
      const res = await axios.get(`${API_URL}/kiosco/miembro/${miembro.id}`);
      setMiembroSeleccionado(res.data);
      setYaRegistrado(res.data.yaRegistrado);
      setResultadosBusqueda([]);
      setModo('confirmacion');
    } catch (error) {
      console.error('Error al cargar miembro:', error);
      alert('Error al buscar miembro');
    }
  };

  const capturarFoto = async () => {
    // La foto se reduce en el navegador antes de guardarla (de ~MB a decenas de KB)
    const imagenSrc = await reducirImagen(webcamRef.current.getScreenshot());
    setFotoVisitante(imagenSrc);
    setCapturandoFoto(false);
  };

  const registrarVisitante = async (e) => {
    e.preventDefault();
    
    if (!nombreVisitante.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    try {
      await axios.post(`${API_URL}/asistencias/checkin`, {
        nombre: nombreVisitante,
        foto: fotoVisitante,
        tipo: 'visitante'
      });

      setMensaje('¡Bienvenido! Asistencia registrada');
      setModo('exito');
      
      setTimeout(() => {
        resetearTodo();
      }, 3000);
    } catch (error) {
      console.error('Error registrando visitante:', error);
      alert('Error al registrar visitante');
    }
  };

  const confirmarAsistencia = async () => {
    try {
      await axios.post(`${API_URL}/asistencias/checkin`, {
        miembroId: miembroSeleccionado.id
      });

      setMensaje('¡Asistencia registrada exitosamente!');
      setModo('exito');
      
      setTimeout(() => {
        resetearTodo();
      }, 3000);
    } catch (error) {
      console.error('Error confirmando asistencia:', error);
      // Si es error 409 (ya registrado), mostrar pantalla especial
      if (error.response?.status === 409) {
        setYaRegistrado(true);
        return;
      }
      alert('Error al registrar asistencia');
      resetearTodo();
    }
  };

  return (
    <div className="kiosco-container">
      <a href="/admin/login" className="btn-admin-acceso">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Admin
      </a>

      <div className="kiosco-content">
        <div className="kiosco-header">
          <img src={logoLMTLSS} alt="LMTLSS" className="kiosco-logo" />
        </div>

        {modo === 'inicio' && (
          <div className="kiosco-opciones">
            <h1>Bienvenido a LMTLSS</h1>
            <p className="subtitle">Selecciona una opción para registrar tu asistencia</p>

            <div className="opciones-grid">
              <button 
                className="opcion-card opcion-azul"
                onClick={() => setModo('numero')}
              >
                <div className="opcion-circulo">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h2>Ya estoy registrado</h2>
                <p>Tengo número de miembro</p>
              </button>

              <button 
                className="opcion-card opcion-verde"
                onClick={() => setModo('nombre')}
              >
                <div className="opcion-circulo">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2>Buscar por nombre</h2>
                <p>No recuerdo mi número</p>
              </button>

              <button 
                className="opcion-card opcion-amarillo"
                onClick={() => setModo('visitante')}
              >
                <div className="opcion-circulo">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                </div>
                <h2>Soy visitante</h2>
                <p>Primera vez aquí</p>
              </button>
            </div>
          </div>
        )}

        {modo === 'numero' && (
          <div className="kiosco-form">
            <div className="form-icono">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h1>Ingresa tu Número de Miembro</h1>
            
            <form onSubmit={buscarPorNumero}>
              <input
                type="text"
                value={numeroMiembro}
                onChange={(e) => setNumeroMiembro(e.target.value)}
                placeholder="Ej: 0001"
                className="input-kiosco"
                autoFocus
              />
              
              <div className="botones-kiosco">
                <button type="submit" className="btn-kiosco btn-primary">
                  Continuar →
                </button>
                <button 
                  type="button" 
                  className="btn-kiosco btn-volver"
                  onClick={resetearTodo}
                >
                  ← Volver
                </button>
              </div>
            </form>
          </div>
        )}

        {modo === 'nombre' && (
          <div className="kiosco-form">
            <div className="form-icono">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1>Busca tu Nombre</h1>
            
            <form onSubmit={buscarPorNombre}>
              <input
                type="text"
                value={nombreBusqueda}
                onChange={(e) => setNombreBusqueda(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="input-kiosco"
                autoFocus
              />
              
              {resultadosBusqueda.length > 0 && (
                <div className="resultados-lista">
                  <h3>Selecciona tu nombre:</h3>
                  {resultadosBusqueda.map(miembro => (
                    <button
                      key={miembro.id}
                      type="button"
                      className="resultado-item"
                      onClick={() => seleccionarMiembro(miembro)}
                    >
                      {miembro.fotoBase64 && (
                        <img 
                          src={miembro.fotoBase64} 
                          alt={miembro.nombre}
                          className="resultado-foto"
                        />
                      )}
                      <div className="resultado-info">
                        <strong>{miembro.nombre}</strong>
                        <span>{miembro.numeroFormateado}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="botones-kiosco">
                <button type="submit" className="btn-kiosco btn-primary">
                  Buscar →
                </button>
                <button 
                  type="button" 
                  className="btn-kiosco btn-volver"
                  onClick={resetearTodo}
                >
                  ← Volver
                </button>
              </div>
            </form>
          </div>
        )}

        {modo === 'visitante' && (
          <div className="kiosco-form">
            <div className="form-icono">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h1>¡Bienvenido Visitante!</h1>
            <p className="subtitle">Ingresa tu nombre y opcionalmente tu foto</p>
            
            <form onSubmit={registrarVisitante}>
              <input
                type="text"
                value={nombreVisitante}
                onChange={(e) => setNombreVisitante(e.target.value)}
                placeholder="Nombre completo..."
                className="input-kiosco"
                autoFocus={!capturandoFoto}
              />

              {/* OPCIONES DE FOTO */}
              {!fotoVisitante && !capturandoFoto && (
                <div className="foto-opciones">
                  <button 
                    type="button"
                    className="btn-kiosco btn-foto"
                    onClick={() => setCapturandoFoto(true)}
                  >
                    📷 Tomar Foto
                  </button>
                  <p className="texto-opcional">La foto es opcional</p>
                </div>
              )}

              {/* CÁMARA */}
              {capturandoFoto && (
                <div className="camara-container">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width="100%"
                    videoConstraints={{
                      facingMode: "user"
                    }}
                    className="webcam-kiosco"
                  />
                  <div className="botones-camara">
                    <button 
                      type="button"
                      className="btn-kiosco btn-primary"
                      onClick={capturarFoto}
                    >
                      📸 Capturar
                    </button>
                    <button 
                      type="button"
                      className="btn-kiosco btn-volver"
                      onClick={() => setCapturandoFoto(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIEW FOTO */}
              {fotoVisitante && !capturandoFoto && (
                <div className="foto-preview">
                  <img src={fotoVisitante} alt="Tu foto" className="preview-img" />
                  <button 
                    type="button"
                    className="btn-cambiar-foto"
                    onClick={() => setFotoVisitante(null)}
                  >
                    🔄 Cambiar foto
                  </button>
                </div>
              )}
              
              <div className="botones-kiosco">
                <button type="submit" className="btn-kiosco btn-primary">
                  Registrar →
                </button>
                <button 
                  type="button" 
                  className="btn-kiosco btn-volver"
                  onClick={resetearTodo}
                >
                  ← Volver
                </button>
              </div>
            </form>
          </div>
        )}

        {modo === 'confirmacion' && miembroSeleccionado && (
          <div className="kiosco-confirmacion">
            {miembroSeleccionado.fotoBase64 && (
              <div className="foto-grande-container">
                <img 
                  src={miembroSeleccionado.fotoBase64}
                  alt={miembroSeleccionado.nombre}
                  className="foto-grande"
                />
              </div>
            )}
            
            {yaRegistrado ? (
              <>
                <div className="aviso-ya-registrado">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <h1>¡Ya registraste tu asistencia hoy!</h1>
                  <h2 className="nombre-confirmacion">{miembroSeleccionado.nombre}</h2>
                  <p className="mensaje-ya-registrado">Tu asistencia ya fue registrada anteriormente el día de hoy. No es necesario volver a registrarte.</p>
                </div>
                
                <div className="botones-kiosco">
                  <button 
                    className="btn-kiosco btn-volver"
                    onClick={resetearTodo}
                  >
                    ← Volver al inicio
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1>¿Eres tú?</h1>
                <h2 className="nombre-confirmacion">{miembroSeleccionado.nombre}</h2>
                <p className="numero-confirmacion">{miembroSeleccionado.numeroFormateado}</p>
                
                <div className="botones-kiosco">
                  <button 
                    className="btn-kiosco btn-confirmar"
                    onClick={confirmarAsistencia}
                  >
                    ✓ Sí, registrar asistencia
                  </button>
                  <button 
                    className="btn-kiosco btn-volver"
                    onClick={resetearTodo}
                  >
                    ✗ No soy yo
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {modo === 'exito' && (
          <div className="kiosco-exito">
            <div className="icono-exito">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1>¡Listo!</h1>
            <p className="mensaje-exito">{mensaje}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Kiosco;
