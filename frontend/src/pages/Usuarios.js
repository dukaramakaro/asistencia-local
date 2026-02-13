import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';
import logoLMTLSS from '../assets/logo-lmtlss.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [mostrarFormPassword, setMostrarFormPassword] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  
  // Form nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRol, setNuevoRol] = useState('admin');
  
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/admin/login');
      return;
    }
    setUsuario(JSON.parse(usuarioGuardado));
    
    cargarUsuarios();
  }, [navigate]);

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get(`${API_URL}/usuarios`);
      setUsuarios(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/admin/login');
  };

  const cambiarPassword = async (usuarioId) => {
    if (!nuevaPassword || nuevaPassword.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    try {
      await axios.patch(`${API_URL}/usuarios/${usuarioId}/cambiar-password`, {
        nuevaPassword
      });
      
      alert('✅ Contraseña actualizada exitosamente');
      setMostrarFormPassword(null);
      setNuevaPassword('');
      cargarUsuarios();
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      alert('Error al cambiar contraseña');
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/usuarios`, {
        usuario: nuevoUsuario,
        password: nuevoPassword,
        nombre: nuevoNombre,
        rol: nuevoRol
      });

      alert('✅ Usuario creado exitosamente');
      setMostrarFormNuevo(false);
      setNuevoUsuario('');
      setNuevoPassword('');
      setNuevoNombre('');
      setNuevoRol('admin');
      cargarUsuarios();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const toggleActivo = async (usuarioId) => {
    try {
      await axios.patch(`${API_URL}/usuarios/${usuarioId}/toggle-activo`);
      cargarUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado del usuario');
    }
  };

  const eliminarUsuario = async (usr) => {
    const confirmar = window.confirm(
      `⚠️ ELIMINAR USUARIO PERMANENTEMENTE ⚠️\n\n` +
      `¿Estás seguro de eliminar a ${usr.nombre} (${usr.usuario})?\n\n` +
      `Esta acción NO se puede deshacer.\n` +
      `El usuario será eliminado completamente del sistema.`
    );

    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/usuarios/${usr.id}`);
      alert('✅ Usuario eliminado correctamente');
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert(error.response?.data?.error || 'Error al eliminar usuario');
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
          <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/admin/miembros" className="nav-link">Miembros</Link>
          <Link to="/admin/usuarios" className="nav-link active">Usuarios</Link>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </nav>

      <div className="admin-content">
        <div className="section-header">
          <h1>👥 Gestión de Usuarios</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setMostrarFormNuevo(!mostrarFormNuevo)}
          >
            ➕ Nuevo Usuario
          </button>
        </div>

        {mostrarFormNuevo && (
          <div className="form-container">
            <h2>Crear Nuevo Usuario</h2>
            <form onSubmit={crearUsuario}>
              <div className="form-group">
                <label>Usuario (Login) *</label>
                <input
                  type="text"
                  value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value)}
                  required
                  placeholder="usuario123"
                />
              </div>

              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  required
                  placeholder="Mínimo 4 caracteres"
                  minLength="4"
                />
              </div>

              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  required
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)}>
                  <option value="admin">Administrador</option>
                  <option value="usuario">Usuario</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  ✓ Crear Usuario
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setMostrarFormNuevo(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="section">
          <h2>Lista de Usuarios ({usuarios.length})</h2>
          
          {usuarios.length === 0 ? (
            <p className="no-data">No hay usuarios registrados</p>
          ) : (
            <div className="usuarios-grid">
              {usuarios.map((usr) => (
                <div 
                  key={usr.id} 
                  className={`usuario-card ${usr.activo ? '' : 'inactivo'}`}
                >
                  <div className="usuario-info">
                    <h3>{usr.nombre}</h3>
                    <div className="usuario-detalle">
                      <span className="detalle-label">Usuario:</span> {usr.usuario}
                    </div>
                    <div className="usuario-detalle">
                      <span className="detalle-label">Rol:</span> {usr.rol}
                    </div>
                    
                    <div className="usuario-badges">
                      <span className={`badge ${usr.activo ? 'activo' : 'inactivo'}`}>
                        {usr.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="usuario-acciones">
                    {mostrarFormPassword === usr.id ? (
                      <div className="password-form">
                        <input
                          type="password"
                          value={nuevaPassword}
                          onChange={(e) => setNuevaPassword(e.target.value)}
                          placeholder="Nueva contraseña"
                          className="password-input"
                          minLength="4"
                        />
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => cambiarPassword(usr.id)}
                        >
                          ✓ Guardar
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setMostrarFormPassword(null);
                            setNuevaPassword('');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => setMostrarFormPassword(usr.id)}
                          title="Cambiar contraseña"
                        >
                          🔑 Cambiar Contraseña
                        </button>

                        <button 
                          className={`btn btn-sm ${usr.activo ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleActivo(usr.id)}
                          title={usr.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {usr.activo ? '🚫 Desactivar' : '✓ Activar'}
                        </button>

                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminarUsuario(usr)}
                          title="Eliminar usuario permanentemente"
                          style={{backgroundColor: '#D32F2F'}}
                        >
                          🗑️ Eliminar
                        </button>
                      </>
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

export default Usuarios;
