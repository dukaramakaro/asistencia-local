import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { obtenerFoto, olvidarFoto } from './FotoMiembro';
import { reducirImagen, leerArchivoReducido } from '../utils/imagen';
import '../pages/Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function EditarMiembro({ miembro, onClose, onActualizar }) {
  const [nombre, setNombre] = useState(miembro.nombre || '');
  const [fechaNacimiento, setFechaNacimiento] = useState(miembro.fechaNacimiento || '');
  const [telefono, setTelefono] = useState(miembro.telefono || '');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState(miembro.telefonoEmergencia || '');
  const [observaciones, setObservaciones] = useState(miembro.observaciones || miembro.email || '');
  const [foto, setFoto] = useState(miembro.fotoBase64 || null);
  const [capturandoFoto, setCapturandoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const webcamRef = useRef(null);

  // La lista ya no trae las fotos; se pide la de este miembro al abrir la edición.
  // Si mientras tanto el usuario eligió otra foto, se respeta la nueva.
  useEffect(() => {
    if (!miembro.fotoBase64 && miembro.tieneFoto) {
      obtenerFoto(miembro.id)
        .then((fotoActual) => {
          if (fotoActual) setFoto((actual) => actual || fotoActual);
        })
        .catch(() => {});
    }
  }, [miembro.id, miembro.fotoBase64, miembro.tieneFoto]);

  const capturarFoto = async () => {
    const imagenSrc = await reducirImagen(webcamRef.current.getScreenshot());
    setFoto(imagenSrc);
    setCapturandoFoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const datosActualizados = {
        nombre,
        fechaNacimiento,
        telefono,
        telefonoEmergencia,
        observaciones,
        fotoBase64: foto
      };

      await axios.put(`${API_URL}/miembros/${miembro.id}`, datosActualizados);
      olvidarFoto(miembro.id); // para que la lista no muestre la foto anterior
      
      alert('Miembro actualizado exitosamente');
      onActualizar();
      onClose();
    } catch (error) {
      console.error('Error al actualizar miembro:', error);
      alert('Error al actualizar miembro');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Editar Miembro</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

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

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="9981234567"
            />
          </div>

          <div className="form-group">
            <label>Teléfono de Emergencia</label>
            <input
              type="tel"
              value={telefonoEmergencia}
              onChange={(e) => setTelefonoEmergencia(e.target.value)}
              placeholder="9987654321"
            />
          </div>

          <div className="form-group">
            <label>Observaciones / Email</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Información adicional"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Foto</label>
            
            {!capturandoFoto && (
              <div className="botones">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCapturandoFoto(true)}
                >
                  {foto ? 'Cambiar Foto (Webcam)' : 'Capturar Foto'}
                </button>
                
                <label className="btn btn-primary" style={{cursor: 'pointer', margin: 0}}>
                  {foto ? 'Cambiar Foto (Archivo)' : 'Subir Foto'}
                  <input 
                    type="file"
                    accept="image/*"
                    style={{display: 'none'}}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        leerArchivoReducido(file).then(setFoto);
                      }
                    }}
                  />
                </label>

                {foto && (
                  <button 
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setFoto(null)}
                  >
                    Eliminar Foto
                  </button>
                )}
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
                <img src={foto} alt="Preview" style={{maxWidth: '200px', borderRadius: '8px'}} />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={guardando}
            >
              {guardando ? '⏳ Guardando...' : '✓ Guardar Cambios'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarMiembro;
