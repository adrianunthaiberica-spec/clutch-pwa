'use strict';

// UNTHA CLUTCH — punto de entrada de la PWA: registra el service worker, monta la
// cabecera (logo + selector de idioma) y decide qué pintar en #contenido según el
// token de la URL y la pantalla activa. La Pantalla 3 (Medición) y la 4 (Resultado)
// se conectan en los próximos pasos; de momento el aviso de seguridad confirmado lleva
// a un marcador de posición.

let tokenActual = null;
let ultimoEstadoMaquina = null; // cache: cambiar de idioma no debe disparar un nuevo GET
let pantallaActual = 'maquina'; // 'maquina' | 'aviso-seguridad' | 'medicion-pendiente'

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
  // TODO: ir a la Pantalla 3 (Medición) cuando exista.
  pantallaActual = 'medicion-pendiente';
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

  if (pantallaActual === 'medicion-pendiente') {
    contenido.innerHTML = '<p class="mensaje">' + t('comun.proximamente') + '</p>';
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
