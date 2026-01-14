import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Kiosco from './pages/Kiosco';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Miembros from './pages/Miembros';
import Usuarios from './pages/Usuarios';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública - Kiosco de check-in */}
        <Route path="/kiosco" element={<Kiosco />} />
        <Route path="/registro" element={<Kiosco />} />
        
        {/* Rutas admin - Panel de supervisores */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/miembros" element={<Miembros />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/kiosco" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
