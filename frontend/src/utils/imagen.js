// Reduce una foto antes de enviarla al servidor.
// Una foto de celular puede pesar varios MB; con 480 px y calidad 0.7 queda en
// unas decenas de KB, que es de sobra para reconocer a una persona en pantalla.
export function reducirImagen(dataUrl, maxLado = 480, calidad = 0.7) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();

    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * escala));
      canvas.height = Math.max(1, Math.round(img.height * escala));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', calidad));
    };

    // Si el navegador no puede procesarla, se conserva la original
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Lee un archivo de imagen elegido por el usuario y lo devuelve ya reducido
export function leerArchivoReducido(archivo) {
  return new Promise((resolve) => {
    const lector = new FileReader();
    lector.onloadend = () => resolve(reducirImagen(lector.result));
    lector.readAsDataURL(archivo);
  });
}
