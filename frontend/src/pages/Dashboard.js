import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';
import logoLMTLSS from '../assets/logo-lmtlss.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [editandoAsistencia, setEditandoAsistencia] = useState(null);
  const [miembrosDisponibles, setMiembrosDisponibles] = useState([]);
  const [mostrarRegistroManual, setMostrarRegistroManual] = useState(false);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState('');
  const [yaRegistradoHoy, setYaRegistradoHoy] = useState(false);
  const [forzarRegistro, setForzarRegistro] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [ordenarAsistencias, setOrdenarAsistencias] = useState('hora'); // 'hora', 'nombre', 'numero'
  const navigate = useNavigate();

  const ymdCancun = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cancun', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  const cargarDatos = useCallback(async () => {
    try {
      const hoy = ymdCancun();
      
      const [resAsistencias, resMiembros] = await Promise.all([
        axios.get(`${API_URL}/asistencias?fecha=${hoy}`),
        axios.get(`${API_URL}/miembros`)
      ]);

      const asistencias = resAsistencias.data;
      const miembros = resMiembros.data;

      setAsistenciasHoy(asistencias);
      setMiembrosDisponibles(miembros.filter(m => m.activo !== false));

      const statsCalculadas = {
        asistenciaHoy: asistencias.length,
        totalMiembros: miembros.filter(m => m.activo !== false).length,
        promedioSemanal: Math.round(asistencias.length * 0.9),
        visitantesEsteMes: miembros.filter(m => 
          m.tipo === 'visitante' && 
          new Date(m.fechaRegistro).getMonth() === new Date().getMonth()
        ).length
      };

      setStats(statsCalculadas);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/admin/login');
      return;
    }
    setUsuario(JSON.parse(usuarioGuardado));
    
    cargarDatos();
  }, [navigate, cargarDatos]);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/admin/login');
  };

  const exportarAsistenciasHoy = () => {
    const hoy = ymdCancun();
    window.open(`${API_URL}/exportar/asistencias?fecha=${hoy}`, '_blank');
  };

  const exportarMiembros = () => {
    window.open(`${API_URL}/exportar/miembros`, '_blank');
  };

  const eliminarAsistencia = async (asistencia) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar la asistencia de ${asistencia.miembro?.nombre || asistencia.nombre}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/asistencias/${asistencia.id}`);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar asistencia:', error);
      alert('Error al eliminar la asistencia');
    }
  };

  const guardarEdicionAsistencia = async () => {
    if (!editandoAsistencia) return;

    try {
      await axios.put(`${API_URL}/asistencias/${editandoAsistencia.id}`, {
        miembroId: editandoAsistencia.miembroId,
        nombre: editandoAsistencia.nombre,
        tipo: editandoAsistencia.tipo
      });
      setEditandoAsistencia(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar asistencia:', error);
      alert('Error al actualizar la asistencia');
    }
  };

  const handleMiembroChange = (miembroId) => {
    const miembro = miembrosDisponibles.find(m => m.id === miembroId);
    if (miembro) {
      setEditandoAsistencia({
        ...editandoAsistencia,
        miembroId: miembro.id,
        nombre: miembro.nombre,
        tipo: miembro.tipo
      });
    }
  };

  // Funciones para registro manual
  const abrirRegistroManual = () => {
    setMostrarRegistroManual(true);
    setMiembroSeleccionado('');
    setYaRegistradoHoy(false);
    setForzarRegistro(false);
  };

  const cerrarRegistroManual = () => {
    setMostrarRegistroManual(false);
    setMiembroSeleccionado('');
    setYaRegistradoHoy(false);
    setForzarRegistro(false);
  };

  const verificarMiembroSeleccionado = async (miembroId) => {
    setMiembroSeleccionado(miembroId);
    setForzarRegistro(false);
    
    if (!miembroId) {
      setYaRegistradoHoy(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/asistencias/verificar/${miembroId}`);
      setYaRegistradoHoy(res.data.yaRegistrado);
    } catch (error) {
      console.error('Error al verificar:', error);
      setYaRegistradoHoy(false);
    }
  };

  const registrarAsistenciaManual = async () => {
    if (!miembroSeleccionado) {
      alert('Selecciona un miembro');
      return;
    }

    if (yaRegistradoHoy && !forzarRegistro) {
      alert('Este miembro ya tiene asistencia hoy. Marca la casilla para forzar el registro.');
      return;
    }

    setRegistrando(true);

    try {
      await axios.post(`${API_URL}/asistencias/checkin`, {
        miembroId: miembroSeleccionado,
        forzar: forzarRegistro
      });

      cerrarRegistroManual();
      cargarDatos();
      alert('✅ Asistencia registrada correctamente');
    } catch (error) {
      console.error('Error al registrar:', error);
      alert('Error al registrar la asistencia');
    } finally {
      setRegistrando(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

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
          <Link to="/admin/dashboard" className="nav-link active">Dashboard</Link>
          <Link to="/admin/miembros" className="nav-link">Miembros</Link>
          <Link to="/admin/usuarios" className="nav-link">Usuarios</Link>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </nav>

      <div className="admin-content">
        <h1>Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.asistenciaHoy || 0}</div>
              <div className="stat-label">Asistencia Hoy</div>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.totalMiembros || 0}</div>
              <div className="stat-label">Miembros Totales</div>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.promedioSemanal || 0}</div>
              <div className="stat-label">Promedio Semanal</div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.visitantesEsteMes || 0}</div>
              <div className="stat-label">Visitantes Este Mes</div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Asistencias de Hoy</h2>
            
            <div className="ordenar-por">
              <span>Ordenar por:</span>
              <button 
                className={`btn-ordenar ${ordenarAsistencias === 'hora' ? 'activo' : ''}`}
                onClick={() => setOrdenarAsistencias('hora')}
              >
                Hora
              </button>
              <button 
                className={`btn-ordenar ${ordenarAsistencias === 'nombre' ? 'activo' : ''}`}
                onClick={() => setOrdenarAsistencias('nombre')}
              >
                Nombre
              </button>
              <button 
                className={`btn-ordenar ${ordenarAsistencias === 'numero' ? 'activo' : ''}`}
                onClick={() => setOrdenarAsistencias('numero')}
              >
                Número
              </button>
            </div>
          </div>
          
          {asistenciasHoy.length === 0 ? (
            <p className="no-data">No hay asistencias registradas aún</p>
          ) : (
            <div className="tabla-container">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...asistenciasHoy]
                    .sort((a, b) => {
                      if (ordenarAsistencias === 'hora') {
                        return new Date(b.hora) - new Date(a.hora);
                      } else if (ordenarAsistencias === 'nombre') {
                        const nombreA = a.miembro?.nombre || a.nombre || '';
                        const nombreB = b.miembro?.nombre || b.nombre || '';
                        return nombreA.localeCompare(nombreB);
                      } else {
                        const numA = parseInt(a.miembro?.numero || 0);
                        const numB = parseInt(b.miembro?.numero || 0);
                        return numA - numB;
                      }
                    })
                    .map((asistencia, index) => (
                    <tr key={index}>
                      <td>
                        {asistencia.miembro?.fotoUrl && (
                          <img 
                            src={`${(API_URL.replace(/\/api\/?$/, ''))}${asistencia.miembro.fotoUrl}`}
                            alt={asistencia.miembro.nombre}
                            className="tabla-foto"
                          />
                        )}
                      </td>
                      <td>{asistencia.miembro?.numero || 'N/A'}</td>
                      <td>{asistencia.miembro?.nombre || asistencia.nombre || 'Desconocido'}</td>
                      <td>{new Date(asistencia.hora).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit', timeZone: 'America/Cancun'})}</td>
                      <td>
                        <span className={`badge ${asistencia.miembro?.tipo || asistencia.tipo}`}>
                          {asistencia.miembro?.tipo || asistencia.tipo || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="acciones-tabla">
                          <button 
                            className="btn-icon btn-icon-primary"
                            onClick={() => setEditandoAsistencia(asistencia)}
                            title="Editar asistencia"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="btn-icon btn-icon-danger"
                            onClick={() => eliminarAsistencia(asistencia)}
                            title="Eliminar asistencia"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="section">
          <h2>Acciones Rápidas</h2>
          <div className="acciones-grid">
            <button 
              className="accion-card accion-destacada"
              onClick={abrirRegistroManual}
            >
              <div className="accion-icon">📝</div>
              <div className="accion-label">Registrar Asistencia Manual</div>
            </button>

            <button 
              className="accion-card"
              onClick={() => navigate('/admin/miembros')}
            >
              <div className="accion-icon">➕</div>
              <div className="accion-label">Nuevo Miembro</div>
            </button>

            <button 
              className="accion-card"
              onClick={cargarDatos}
            >
              <div className="accion-icon">🔄</div>
              <div className="accion-label">Actualizar Datos</div>
            </button>

            <button 
              className="accion-card"
              onClick={exportarAsistenciasHoy}
            >
              <div className="accion-icon">📥</div>
              <div className="accion-label">Exportar Asistencias Hoy</div>
            </button>

            <button 
              className="accion-card"
              onClick={exportarMiembros}
            >
              <div className="accion-icon">📊</div>
              <div className="accion-label">Exportar Lista Miembros</div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de edición de asistencia */}
      {editandoAsistencia && (
        <div className="modal-overlay" onClick={() => setEditandoAsistencia(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Asistencia</h2>
              <button className="btn-close" onClick={() => setEditandoAsistencia(null)}>×</button>
            </div>
            
            <div className="form-group">
              <label>Cambiar Miembro</label>
              <select 
                value={editandoAsistencia.miembroId || ''}
                onChange={(e) => handleMiembroChange(e.target.value)}
                className="form-select"
              >
                <option value="">-- Seleccionar miembro --</option>
                {miembrosDisponibles.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.numeroFormateado}) - {m.tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nombre actual</label>
              <input 
                type="text" 
                value={editandoAsistencia.nombre || editandoAsistencia.miembro?.nombre || ''} 
                readOnly
                className="form-input-readonly"
              />
            </div>

            <div className="form-group">
              <label>Tipo</label>
              <select 
                value={editandoAsistencia.tipo || editandoAsistencia.miembro?.tipo || 'miembro'}
                onChange={(e) => setEditandoAsistencia({...editandoAsistencia, tipo: e.target.value})}
              >
                <option value="miembro">Miembro</option>
                <option value="visitante">Visitante</option>
              </select>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={guardarEdicionAsistencia}>
                ✓ Guardar Cambios
              </button>
              <button className="btn btn-secondary" onClick={() => setEditandoAsistencia(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro manual */}
      {mostrarRegistroManual && (
        <div className="modal-overlay" onClick={cerrarRegistroManual}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Registrar Asistencia Manual</h2>
              <button className="btn-close" onClick={cerrarRegistroManual}>×</button>
            </div>
            
            <p className="modal-descripcion">
              Usa esta opción para registrar la asistencia de un miembro manualmente. 
              Útil cuando alguien no pudo usar el kiosco.
            </p>

            <div className="form-group">
              <label>Seleccionar Miembro *</label>
              <select 
                value={miembroSeleccionado}
                onChange={(e) => verificarMiembroSeleccionado(e.target.value)}
                className="form-select"
              >
                <option value="">-- Selecciona un miembro --</option>
                {miembrosDisponibles.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.numeroFormateado}) - {m.tipo}
                  </option>
                ))}
              </select>
            </div>

            {yaRegistradoHoy && (
              <div className="aviso-duplicado">
                <div className="aviso-icono">⚠️</div>
                <div className="aviso-texto">
                  <strong>Este miembro ya tiene asistencia registrada hoy.</strong>
                  <p>Si deseas registrar otra asistencia de todos modos, marca la casilla de abajo.</p>
                </div>
              </div>
            )}

            {yaRegistradoHoy && (
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={forzarRegistro}
                    onChange={(e) => setForzarRegistro(e.target.checked)}
                  />
                  <span>Forzar registro (registrar aunque ya tenga asistencia hoy)</span>
                </label>
              </div>
            )}

            <div className="form-actions">
              <button 
                className="btn btn-primary" 
                onClick={registrarAsistenciaManual}
                disabled={registrando || !miembroSeleccionado || (yaRegistradoHoy && !forzarRegistro)}
              >
                {registrando ? '⏳ Registrando...' : '✓ Registrar Asistencia'}
              </button>
              <button className="btn btn-secondary" onClick={cerrarRegistroManual}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;