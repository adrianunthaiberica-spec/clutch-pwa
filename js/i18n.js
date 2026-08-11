'use strict';

// UNTHA CLUTCH — traducciones (es/pt) y selección de idioma.
//
// La beta es España en castellano: el idioma por defecto queda FIJO a 'es' porque el
// backend todavía no devuelve el país del cliente (decisión explícita: no tocar el
// backend por esto ahora). establecerIdiomaPorPaisSiNoHayOverride ya queda lista para
// cuando el GET incluya "pais" — solo hay que llamarla con el país real; hoy nadie la
// invoca todavía.

const IDIOMA_POR_DEFECTO = 'es';
const CLAVE_ALMACENAMIENTO_IDIOMA = 'untha-clutch-idioma';

const TRADUCCIONES = {
  es: {
    comun: {
      cargando: 'Cargando…',
      error: 'Ha ocurrido un error. Inténtalo de nuevo.',
      reintentar: 'Reintentar',
    },
    inicio: {
      escanear: 'Escanea el código QR de la máquina para empezar.',
    },
  },
  pt: {
    comun: {
      cargando: 'A carregar…',
      error: 'Ocorreu um erro. Tenta novamente.',
      reintentar: 'Tentar novamente',
    },
    inicio: {
      escanear: 'Digitaliza o código QR da máquina para começar.',
    },
  },
};

// Países de habla portuguesa que, cuando el backend los devuelva, deben arrancar en
// 'pt'. No se usa todavía (toda la beta es "ES"), pero queda listo para no rehacerlo.
const PAISES_POR_IDIOMA = {
  pt: ['PT', 'BR'],
};

function inferirIdiomaPorPais_(pais) {
  if (!pais) return IDIOMA_POR_DEFECTO;
  const encontrado = Object.keys(PAISES_POR_IDIOMA).find(
    (idioma) => PAISES_POR_IDIOMA[idioma].indexOf(pais) !== -1
  );
  return encontrado || IDIOMA_POR_DEFECTO;
}

function obtenerIdiomaGuardado_() {
  try {
    return window.localStorage.getItem(CLAVE_ALMACENAMIENTO_IDIOMA);
  } catch (err) {
    return null; // localStorage puede fallar (modo privado, cuota, etc.): no bloquea la app.
  }
}

function guardarIdioma_(idioma) {
  try {
    window.localStorage.setItem(CLAVE_ALMACENAMIENTO_IDIOMA, idioma);
  } catch (err) {
    // Sin persistencia disponible: el idioma se pierde al recargar, pero la app sigue funcionando.
  }
}

let idiomaActual = obtenerIdiomaGuardado_() || IDIOMA_POR_DEFECTO;
document.documentElement.lang = idiomaActual;

function idiomaActivo() {
  return idiomaActual;
}

/**
 * Cambia el idioma activo y lo recuerda en el dispositivo. Es un override manual: una
 * vez elegido a mano, gana siempre sobre el idioma por defecto del país (ver
 * establecerIdiomaPorPaisSiNoHayOverride).
 */
function establecerIdioma(idioma) {
  if (!TRADUCCIONES[idioma] || idioma === idiomaActual) return;
  idiomaActual = idioma;
  guardarIdioma_(idioma);
  document.documentElement.lang = idioma;
  document.dispatchEvent(new CustomEvent('untha-clutch:idioma-cambiado', { detail: { idioma: idioma } }));
}

/**
 * Fija el idioma por defecto a partir del país del cliente, SOLO si el usuario no lo ha
 * cambiado ya a mano en este dispositivo (el override manual nunca se pisa). Sin país
 * (como en la beta, que arranca fija en 'es'), no hace nada. Nadie la llama todavía:
 * lista para cuando el GET incluya "pais".
 */
function establecerIdiomaPorPaisSiNoHayOverride(pais) {
  if (obtenerIdiomaGuardado_()) return;
  establecerIdioma(inferirIdiomaPorPais_(pais));
}

/** Traduce una clave con notación de puntos ("inicio.escanear"); 'es' como último recurso, la propia clave si falta en los dos. */
function t(ruta) {
  const resolverEn = (idioma) =>
    ruta
      .split('.')
      .reduce((nodo, parte) => (nodo && typeof nodo === 'object' ? nodo[parte] : undefined), TRADUCCIONES[idioma]);

  return resolverEn(idiomaActual) || resolverEn(IDIOMA_POR_DEFECTO) || ruta;
}

/** Pequeño selector ES/PT reutilizable: crea el elemento, lo deja listo para insertar donde haga falta. */
function crearSelectorIdioma() {
  const contenedor = document.createElement('div');
  contenedor.className = 'selector-idioma';

  Object.keys(TRADUCCIONES).forEach((idioma) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = idioma.toUpperCase();
    boton.className = 'selector-idioma__opcion';
    boton.setAttribute('aria-pressed', String(idioma === idiomaActual));
    boton.addEventListener('click', () => establecerIdioma(idioma));
    contenedor.appendChild(boton);
  });

  document.addEventListener('untha-clutch:idioma-cambiado', (evento) => {
    Array.from(contenedor.children).forEach((boton) => {
      boton.setAttribute('aria-pressed', String(boton.textContent.toLowerCase() === evento.detail.idioma));
    });
  });

  return contenedor;
}
