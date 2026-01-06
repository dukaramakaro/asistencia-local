import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import './Admin.css';
import logoLMTLSS from '../assets/logo-lmtlss.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Miembros() {
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(true);
  
  // Form states
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [foto, setFoto] = useState(null);
  const [capturandoFoto, setCapturandoFoto] = useState(false);
  const [tipo, setTipo] = useState('miembro');
  
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/admin/login');
      return;
    }
    setUsuario(JSON.parse(usuarioGuardado));
    
    cargarMiembros();
  }, [navigate]);

  const cargarMiembros = async () => {
    try {
      const res = await axios.get(`${API_URL}/miembros`);
      setMiembros(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar miembros:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/admin/login');
  };

  const capturarFoto = () => {
    const imagenSrc = webcamRef.current.getScreenshot();
    setFoto(imagenSrc);
    setCapturandoFoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const nuevoMiembro = {
        nombre,
        fechaNacimiento,
        telefono,
        telefonoEmergencia,
        observaciones,
        foto,
        tipo
      };

      await axios.post(`${API_URL}/miembros`, nuevoMiembro);
      
      setNombre('');
      setFechaNacimiento('');
      setTelefono('');
      setTelefonoEmergencia('');
      setObservaciones('');
      setFoto(null);
      setTipo('miembro');
      setMostrarForm(false);
      
      cargarMiembros();
      alert('Miembro registrado exitosamente');
    } catch (error) {
      console.error('Error al crear miembro:', error);
      alert('Error al registrar miembro');
    }
  };

  const toggleActivo = async (miembro) => {
    try {
      await axios.put(`${API_URL}/miembros/${miembro.id}`, {
        activo: !miembro.activo
      });
      cargarMiembros();
    } catch (error) {
      alert('Error al actualizar miembro');
    }
  };

  const eliminarMiembro = async (miembro) => {
    const confirmar = window.confirm(
      `¿Estás seguro de desactivar a ${miembro.nombre}?\n\n` +
      `El miembro quedará inactivo y no aparecerá en el kiosco.\n` +
      `Puedes reactivarlo después si es necesario.`
    );

    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/miembros/${miembro.id}`);
      alert('Miembro desactivado correctamente');
      cargarMiembros();
    } catch (error) {
      alert('Error al desactivar miembro');
      console.error(error);
    }
  };

  const borrarPermanentemente = async (miembro) => {
    const confirmar1 = window.confirm(
      `⚠️ BORRADO PERMANENTE ⚠️\n\n` +
      `¿Estás COMPLETAMENTE SEGURO de borrar a ${miembro.nombre}?\n\n` +
      `Esto eliminará:\n` +
      `- Todos sus datos personales\n` +
      `- Todo su historial de asistencias\n` +
      `- Su foto\n\n` +
      `ESTA ACCIÓN NO SE PUEDE DESHACER.`
    );

    if (!confirmar1) return;

    const confirmar2 = window.confirm(
      `ÚLTIMA CONFIRMACIÓN:\n\n` +
      `Escribe mentalmente "ELIMINAR" y presiona OK para confirmar.\n\n` +
      `¿Borrar permanentemente a ${miembro.nombre}?`
    );

    if (!confirmar2) return;

    try {
      await axios.delete(`${API_URL}/miembros/${miembro.id}/permanente`);
      alert('✅ Miembro eliminado permanentemente');
      cargarMiembros();
    } catch (error) {
      alert('Error al eliminar miembro permanentemente');
      console.error(error);
    }
  };

  const exportarMiembros = () => {
    window.open(`${API_URL}/exportar/miembros`, '_blank');
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  const miembrosFiltrados = miembros.filter(m => {
    if (mostrarInactivos) return true;
    return m.activo !== false;
  });

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <div className="nav-brand">
          <img src={logoLMTLSS} alt="LMTLSS" className="nav-logo" />
          <span>LMTLSS Admin</span>
        </div>
        
        <div className="nav-info">
          <span>Hola, {usuario?.nombre || 'Administrador'}</span>
        </div>

        <div className="nav-links">
          <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/admin/miembros" className="nav-link active">Miembros</Link>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </nav>

      <div className="admin-content">
        <div className="section-header">
          <h1>Gestión de Miembros</h1>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={exportarMiembros}
            >
              📊 Exportar a Excel
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setMostrarForm(!mostrarForm)}
            >
              ➕ Nuevo Miembro
            </button>
          </div>
        </div>

        {mostrarForm && (
          <div className="form-container">
            <h2>Registrar Nuevo Miembro</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="form-group">
                <label>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="998-123-4567"
                  />
                </div>

                <div className="form-group">
                  <label>Tel. Emergencia *</label>
                  <input
                    type="tel"
                    value={telefonoEmergencia}
                    onChange={(e) => setTelefonoEmergencia(e.target.value)}
                    placeholder="999-234-5678"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas, restricciones, comentarios..."
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="miembro">Miembro</option>
                  <option value="visitante">Visitante</option>
                </select>
              </div>

              <div className="form-group">
                <label>Foto</label>
                
                {!foto && !capturandoFoto && (
                  <div className="botones">
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCapturandoFoto(true)}
                    >
                      Capturar Foto
                    </button>
                    
                    <label className="btn btn-primary" style={{cursor: 'pointer', margin: 0}}>
                      Subir Foto
                      <input 
                        type="file"
                        accept="image/*"
                        style={{display: 'none'}}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFoto(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {capturandoFoto && (
                  <div className="camara-form">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width="100%"
                    />
                    <div className="botones">
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={capturarFoto}
                      >
                        Tomar Foto
                      </button>
                      <button 
                        type="button"
                        className="btn btn-secondary" 
                        onClick={() => setCapturandoFoto(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {foto && !capturandoFoto && (
                  <div className="preview-form">
                    <img src={foto} alt="Preview" style={{maxWidth: '200px'}} />
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      onClick={() => setFoto(null)}
                    >
                      Cambiar Foto
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  ✓ Guardar Miembro
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setMostrarForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="section">
          <div className="section-header">
            <h2>Lista de Miembros ({miembrosFiltrados.length})</h2>
            
            <label className="toggle-inactivos">
              <input 
                type="checkbox" 
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
              />
              <span>Mostrar inactivos</span>
            </label>
          </div>
          
          {miembrosFiltrados.length === 0 ? (
            <p className="no-data">No hay miembros {mostrarInactivos ? 'registrados' : 'activos'}</p>
          ) : (
            <div className="miembros-grid">
              {miembrosFiltrados.map((miembro) => (
                <div 
                  key={miembro.id} 
                  className={`miembro-card ${miembro.activo === false ? 'inactivo' : ''}`}
                >
                  {miembro.fotoBase64 && (
                    <img 
                      src={miembro.fotoBase64} 
                      alt={miembro.nombre}
                      className="miembro-foto"
                    />
                  )}
                  
                  <div className="miembro-info">
                    <h3>{miembro.nombre}</h3>
                    <div className="miembro-numero">{miembro.numeroFormateado}</div>
                    
                    {miembro.fechaNacimiento && (
                      <div className="miembro-detalle">
                        <span className="detalle-label">Nacimiento:</span>
                        {new Date(miembro.fechaNacimiento).toLocaleDateString('es-MX')}
                        {miembro.edad && ` · ${miembro.edad} años`}
                      </div>
                    )}
                    
                    {miembro.telefono && (
                      <div className="miembro-detalle">
                        <span className="detalle-label">Tel:</span> {miembro.telefono}
                      </div>
                    )}
                    
                    {miembro.telefonoEmergencia && (
                      <div className="miembro-detalle">
                        <span className="detalle-label">Emergencia:</span> {miembro.telefonoEmergencia}
                      </div>
                    )}
                    
                    {(miembro.observaciones || miembro.email) && (
                      <div className="miembro-detalle">
                        <span className="detalle-label">Observaciones:</span> {miembro.observaciones || miembro.email}
                      </div>
                    )}
                    
                    <div className="miembro-badges">
                      <span className={`badge ${miembro.tipo}`}>
                        {miembro.tipo}
                      </span>
                      <span className={`badge ${miembro.activo !== false ? 'activo' : 'inactivo'}`}>
                        {miembro.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="miembro-acciones">
                    <button 
                      className="btn-icon btn-icon-success"
                      onClick={() => toggleActivo(miembro)}
                      title={miembro.activo !== false ? 'Desactivar' : 'Activar'}
                    >
                      {miembro.activo !== false ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      )}
                    </button>

                    {miembro.activo !== false ? (
                      <button 
                        className="btn-icon btn-icon-warning"
                        onClick={() => eliminarMiembro(miembro)}
                        title="Desactivar miembro"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M4.93 4.93l14.14 14.14"/>
                        </svg>
                      </button>
                    ) : (
                      <button 
                        className="btn-icon btn-icon-danger"
                        onClick={() => borrarPermanentemente(miembro)}
                        title="BORRAR PERMANENTEMENTE"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Miembros;