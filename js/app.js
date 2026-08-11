'use strict';

// UNTHA CLUTCH — punto de entrada de la PWA: registra el service worker, monta la
// cabecera (logo + selector de idioma) y decide qué pintar en #contenido según el
// token de la URL y la pantalla activa. La Pantalla 4 (Resultado) se conecta en el
// próximo paso; de momento, tras guardar, se vuelve a la Pantalla 1 con los datos
// recién actualizados y un aviso de que se ha guardado.

let tokenActual = null;
let ultimoEstadoMaquina = null; // cache: cambiar de idioma no debe disparar un nuevo GET
let pantallaActual = 'maquina'; // 'maquina' | 'aviso-seguridad' | 'medicion'
let mensajeGuardadoPendiente_ = false; // se muestra una vez, la próxima vez que se pinte la Pantalla 1

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
 * Se vuelve a la Pantalla 1 pero forzando un GET nuevo (no se reutiliza la caché en
 * memoria): el semáforo y la última medición ya han cambiado en el servidor.
 */
function alGuardadoCompleto_() {
  pantallaActual = 'maquina';
  mensajeGuardadoPendiente_ = true;
  cargarMaquina();
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
  mostrarAvisoGuardadoSiPendiente_(contenido);
}

function mostrarAvisoGuardadoSiPendiente_(contenido) {
  if (!mensajeGuardadoPendiente_) return;
  mensajeGuardadoPendiente_ = false;

  const aviso = document.createElement('p');
  aviso.className = 'aviso-guardado';
  aviso.textContent = t('maquina.guardadoOk');
  contenido.insertBefore(aviso, contenido.firstChild);
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
