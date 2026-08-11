'use strict';

// UNTHA CLUTCH — punto de entrada de la PWA: registra el service worker, monta la
// cabecera (logo + selector de idioma) y decide qué pintar en #contenido según haya o
// no token en la URL. Las pantallas siguientes (Aviso de seguridad, Medición,
// Resultado) se conectan en los próximos pasos.

let tokenActual = null;
let ultimoEstadoMaquina = null; // cache: cambiar de idioma no debe disparar un nuevo GET

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

function montarCabecera() {
  const barra = document.getElementById('barra-superior');
  if (!barra) return;
  barra.appendChild(crearSelectorIdioma());
}

function mostrarError_(contenedor, mensaje) {
  contenedor.innerHTML = '';
  contenedor.className = 'pantalla-error';

  const texto = document.createElement('p');
  texto.className = 'mensaje';
  texto.textContent = mensaje;
  contenedor.appendChild(texto);

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton-grande';
  boton.textContent = t('comun.reintentar');
  boton.addEventListener('click', cargarMaquina);
  contenedor.appendChild(boton);
}

function alPulsarNuevaMedicion_() {
  // TODO: navegar a la Pantalla 2 (aviso de seguridad) cuando exista.
}

async function cargarMaquina() {
  const contenido = document.getElementById('contenido');
  if (!contenido || !tokenActual) return;

  contenido.innerHTML = '<p class="cargando">' + t('comun.cargando') + '</p>';

  const resultado = await consultarMaquina(tokenActual);

  if (!resultado.ok) {
    ultimoEstadoMaquina = null;
    mostrarError_(contenido, resultado.mensaje);
    return;
  }

  ultimoEstadoMaquina = resultado.datos;
  renderPantallaMaquina(contenido, ultimoEstadoMaquina, alPulsarNuevaMedicion_);
}

function pintarPantalla() {
  const contenido = document.getElementById('contenido');
  if (!contenido) return;

  if (!tokenActual) {
    contenido.innerHTML = '<p class="mensaje">' + t('inicio.escanear') + '</p>';
    return;
  }

  if (ultimoEstadoMaquina) {
    renderPantallaMaquina(contenido, ultimoEstadoMaquina, alPulsarNuevaMedicion_);
    return;
  }

  cargarMaquina();
}

function iniciar() {
  registrarServiceWorker();
  montarCabecera();

  tokenActual = obtenerTokenDeUrl();
  pintarPantalla();

  document.addEventListener('untha-clutch:idioma-cambiado', pintarPantalla);
}

document.addEventListener('DOMContentLoaded', iniciar);
