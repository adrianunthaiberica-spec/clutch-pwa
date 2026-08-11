'use strict';

// UNTHA CLUTCH — punto de entrada de la PWA. Por ahora solo registra el service worker,
// monta el selector de idioma y comprueba si hay un qr_token en la URL; las pantallas
// (Máquina, Aviso de seguridad, Medición, Resultado) y la capa de API se construyen en
// los siguientes pasos.

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

function montarSelectorIdioma() {
  const contenedor = document.getElementById('barra-superior');
  if (!contenedor) return;
  contenedor.appendChild(crearSelectorIdioma());
}

function pintarPantalla() {
  const token = obtenerTokenDeUrl();
  const contenido = document.getElementById('contenido');
  if (!contenido) return;

  if (!token) {
    contenido.innerHTML = '<p class="mensaje">' + t('inicio.escanear') + '</p>';
    return;
  }

  contenido.innerHTML = '<p class="cargando">' + t('comun.cargando') + '</p>';
  // TODO: llamar a la API (GET) y pintar la Pantalla 1 con el resultado.
}

function iniciar() {
  registrarServiceWorker();
  montarSelectorIdioma();
  pintarPantalla();

  document.addEventListener('untha-clutch:idioma-cambiado', pintarPantalla);
}

document.addEventListener('DOMContentLoaded', iniciar);
