'use strict';

// UNTHA CLUTCH — punto de entrada de la PWA. Por ahora solo registra el service worker
// y comprueba si hay un qr_token en la URL; las pantallas (Máquina, Aviso de seguridad,
// Medición, Resultado) y la capa de API se construyen en los siguientes pasos.

function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Instalable igualmente sin SW activo: el registro es best-effort.
    });
  }
}

function obtenerTokenDeUrl() {
  return new URLSearchParams(window.location.search).get('t');
}

function iniciar() {
  registrarServiceWorker();

  const token = obtenerTokenDeUrl();
  const app = document.getElementById('app');

  if (!token) {
    app.innerHTML = '<p class="mensaje">Escanea el código QR de la máquina para empezar.</p>';
    return;
  }

  app.innerHTML = '<p class="cargando">Cargando…</p>';
  // TODO: llamar a la API (GET) y pintar la Pantalla 1 con el resultado.
}

document.addEventListener('DOMContentLoaded', iniciar);
