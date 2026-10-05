import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Kiosco from './pages/Kiosco';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Miembros from './pages/Miembros';
import Usuarios from './pages/Usuarios';
import { haySesion } from './api';
import './App.css';

// Sin sesión iniciada, cualquier pantalla de administración manda al login
const RutaProtegida = ({ children }) =>
  haySesion() ? children : <Navigate to="/admin/login" replace />;

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública - Kiosco de check-in */}
        <Route path="/kiosco" element={<Kiosco />} />
        <Route path="/registro" element={<Kiosco />} />
        
        {/* Rutas admin - Panel de supervisores */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
        <Route path="/admin/miembros" element={<RutaProtegida><Miembros /></RutaProtegida>} />
        <Route path="/admin/usuarios" element={<RutaProtegida><Usuarios /></RutaProtegida>} />
        
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/kiosco" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
