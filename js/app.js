'use strict';

// UNTHA CLUTCH — punto de entrada de la PWA: registra el service worker, monta la
// cabecera (logo + selector de idioma) y decide qué pintar en #contenido según el
// token de la URL y la pantalla activa.

let tokenActual = null;
let ultimoEstadoMaquina = null; // cache: cambiar de idioma no debe disparar un nuevo GET
let pantallaActual = 'maquina'; // 'maquina' | 'aviso-seguridad' | 'medicion' | 'resultado'
let ultimosResultadosGuardados_ = null; // { IZQUIERDA?: {...}, DERECHA?: {...} } para la Pantalla 4

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

function irAPantallaMaquina_() {
  pantallaActual = 'maquina';
  pintarPantalla();
}

function irAPantallaAvisoSeguridad_() {
  pantallaActual = 'aviso-seguridad';
  pintarPantalla();
}

function alConfirmarAvisoSeguridad_() {
  pantallaActual = 'medicion';
  pintarPantalla();
}

/**
 * Se llama cuando la Pantalla 3 ha guardado con éxito TODAS las posiciones enviadas.
 * Antes de pintar la Pantalla 4 se pide un GET fresco (no se reutiliza la caché en
 * memoria): el semáforo ya ha cambiado en el servidor y la Pantalla 4 necesita el color
 * real, nunca recalculado en el cliente (§2.4). Si ese GET fallara, la medición ya está
 * guardada de todos modos (no se bloquea ni se reintenta aquí): se pinta igual, sin
 * color exacto (ver renderPantallaResultado, `guardadoSinEstado`).
 */
async function alGuardadoCompleto_(resultadosGuardados) {
  ultimosResultadosGuardados_ = resultadosGuardados;
  pantallaActual = 'resultado';

  const contenido = document.getElementById('contenido');
  if (contenido) contenido.innerHTML = '<p class="cargando">' + t('comun.cargando') + '</p>';

  const resultado = await consultarMaquina(tokenActual);
  if (resultado.ok) {
    ultimoEstadoMaquina = resultado.datos; // así la Pantalla 1, al volver, ya no necesita otro GET
  }

  pintarPantalla();
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
  renderPantallaMaquina(contenido, ultimoEstadoMaquina, irAPantallaAvisoSeguridad_);
}

function pintarPantalla() {
  const contenido = document.getElementById('contenido');
  if (!contenido) return;

  if (!tokenActual) {
    contenido.innerHTML = '<p class="mensaje">' + t('inicio.escanear') + '</p>';
    return;
  }

  if (pantallaActual === 'aviso-seguridad') {
    renderPantallaAvisoSeguridad(contenido, alConfirmarAvisoSeguridad_, irAPantallaMaquina_);
    return;
  }

  if (pantallaActual === 'medicion') {
    renderPantallaMedicion(contenido, tokenActual, ultimoEstadoMaquina, alGuardadoCompleto_, irAPantallaMaquina_);
    return;
  }

  if (pantallaActual === 'resultado') {
    renderPantallaResultado(contenido, ultimoEstadoMaquina, ultimosResultadosGuardados_, irAPantallaMaquina_);
    return;
  }

  if (ultimoEstadoMaquina) {
    renderPantallaMaquina(contenido, ultimoEstadoMaquina, irAPantallaAvisoSeguridad_);
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
