import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';
import logoLMTLSS from '../assets/logo-lmtlss.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        usuario,
        password
      });

      // Guardar usuario en localStorage
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      
      // Redirigir al dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src={logoLMTLSS} alt="LMTLSS" className="login-logo" />
          <h1>Panel de Supervisores</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoFocus
              placeholder="admin"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-login">
            Iniciar Sesión
          </button>
        </form>

        <div className="login-footer">
          <a href="/">← Volver al Kiosco</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
