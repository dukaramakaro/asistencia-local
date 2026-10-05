import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Caché en memoria: id -> foto (data URL). Vive mientras la pestaña esté abierta,
// así volver a la pantalla no vuelve a descargar las mismas fotos.
const cache = new Map();

// Pide la foto de UN miembro (o la devuelve de la caché)
export function obtenerFoto(id) {
  if (cache.has(id)) return Promise.resolve(cache.get(id));

  return axios.get(`${API_URL}/miembros/${id}/foto`).then((res) => {
    const foto = res.data.fotoBase64 || null;
    cache.set(id, foto);
    return foto;
  });
}

// Debe llamarse después de cambiar la foto de alguien, para no mostrar la anterior
export function olvidarFoto(id) {
  cache.delete(id);
}

// Muestra la foto de un miembro, descargándola SOLO cuando la tarjeta
// aparece en pantalla (antes se descargaban las fotos de todos al abrir la lista).
function FotoMiembro({ id, nombre, className }) {
  const marcador = useRef(null);
  const [src, setSrc] = useState(cache.get(id) || null);

  useEffect(() => {
    if (cache.has(id)) {
      setSrc(cache.get(id));
      return undefined;
    }

    let cancelado = false;
    const cargar = () => {
      obtenerFoto(id)
        .then((foto) => {
          if (!cancelado) setSrc(foto);
        })
        .catch(() => {});
    };

    // Navegadores sin IntersectionObserver: se carga directamente
    if (typeof IntersectionObserver === 'undefined' || !marcador.current) {
      cargar();
      return () => {
        cancelado = true;
      };
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) {
          observador.disconnect();
          cargar();
        }
      },
      { rootMargin: '200px' }
    );
    observador.observe(marcador.current);

    return () => {
      cancelado = true;
      observador.disconnect();
    };
  }, [id]);

  if (src) return <img src={src} alt={nombre} className={className} />;

  // Mientras llega la foto se reserva el mismo espacio (círculo gris) para que no salte el diseño
  return (
    <span
      ref={marcador}
      className={className}
      style={{ display: 'inline-block', background: '#e5e7eb' }}
      aria-hidden="true"
    />
  );
}

export default FotoMiembro;
