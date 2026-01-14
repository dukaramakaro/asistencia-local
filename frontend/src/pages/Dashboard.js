import React, { useState, useEffect } from 'react';
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
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/admin/login');
      return;
    }
    setUsuario(JSON.parse(usuarioGuardado));
    
    cargarDatos();
  }, [navigate]);

  const ymdCancun = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cancun', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  const cargarDatos = async () => {
    try {
      const hoy = ymdCancun();
      
      const [resAsistencias, resMiembros] = await Promise.all([
        axios.get(`${API_URL}/asistencias?fecha=${hoy}`),
        axios.get(`${API_URL}/miembros`)
      ]);

      const asistencias = resAsistencias.data;
      const miembros = resMiembros.data;

      setAsistenciasHoy(asistencias);

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
  };

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
          <h2>Asistencias de Hoy</h2>
          
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
                  </tr>
                </thead>
                <tbody>
                  {asistenciasHoy.map((asistencia, index) => (
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
                      <td>{asistencia.miembro?.nombre || 'Desconocido'}</td>
                      <td>{new Date(asistencia.hora).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</td>
                      <td>
                        <span className={`badge ${asistencia.miembro?.tipo}`}>
                          {asistencia.miembro?.tipo || 'N/A'}
                        </span>
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
    </div>
  );
}

export default Dashboard;