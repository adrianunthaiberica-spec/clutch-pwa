'use strict';

// UNTHA CLUTCH — capa de API: única puerta de entrada al backend (Apps Script Web
// App). Toda función devuelve siempre la misma forma, la haya resuelto el servidor o
// haya fallado la conexión: { ok:true, datos } o { ok:false, error, mensaje }. Así el
// resto de la PWA nunca necesita mirar el código HTTP (Apps Script siempre devuelve
// 200) ni distinguir "el servidor dijo que no" de "la petición no llegó": las dos
// llegan por el mismo camino, con el mismo aspecto, a quien las use.

const TIMEOUT_PETICION_MS = 20000;

/**
 * GET ?t=<token>: estado de la máquina para la Pantalla 1.
 */
async function consultarMaquina(token) {
  const url = CLUTCH_API_BASE_URL + '?t=' + encodeURIComponent(token);
  return peticionConTimeout_(url, { method: 'GET' });
}

/**
 * Registra una medición. `datos`: { token, id, posicion, valor, horometro, operario }.
 * `id` lo genera el llamante con generarIdMedicion() UNA vez por intento de medición
 * (no aquí dentro): si hay que reintentar tras un fallo de red, debe reenviarse el
 * MISMO id para que la idempotencia del servidor lo reconozca como el mismo intento,
 * no como una medición nueva.
 *
 * `medido_en` se genera aquí, justo antes de enviar: es la hora de la medición, no la
 * de haberla tecleado ni la de sincronizarla — la diferencia solo importa cuando haya
 * offline (encolar y reintentar más tarde), pero el campo ya se rellena bien desde
 * ahora para no tener que tocarlo entonces (ver ESPECIFICACION.md §3 "Zona horaria").
 *
 * CRÍTICO: `Content-Type: text/plain;charset=utf-8`, NUNCA `application/json`. Apps
 * Script no responde al preflight OPTIONS que dispara `application/json` — con ese
 * Content-Type la petición no llega nunca. El servidor parsea el cuerpo como JSON
 * independientemente del Content-Type declarado, así que esto no le cambia nada a él.
 */
async function registrarMedicion(datos) {
  const cuerpo = {
    t: datos.token,
    id: datos.id,
    posicion: datos.posicion,
    valor: datos.valor,
    horometro: datos.horometro,
    operario: datos.operario,
    medido_en: new Date().toISOString(),
  };

  return peticionConTimeout_(CLUTCH_API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(cuerpo),
  });
}

/**
 * Id opaco generado en el móvil (§5, idempotencia): si el mismo intento de medición se
 * reenvía varias veces, el servidor descarta los repetidos por este id.
 */
function generarIdMedicion() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  // Respaldo para navegadores sin crypto.randomUUID (Safari < 15.4, WebViews viejos):
  // no es un UUID valido, pero es igual de unico y de opaco para este uso.
  return 'med-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

async function peticionConTimeout_(url, opciones) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_PETICION_MS);

  try {
    const respuesta = await fetch(url, Object.assign({}, opciones, { signal: controlador.signal }));
    const cuerpo = await respuesta.json();
    return traducirMensajeError_(cuerpo);
  } catch (err) {
    return traducirMensajeError_({ ok: false, error: 'ERROR_RED' });
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Sustituye `mensaje` por la traducción conocida de `error` (i18n.js, "errores.*") si
 * existe. El servidor siempre manda su mensaje en castellano; si no hay traducción para
 * ese código, se deja el mensaje del servidor tal cual (mejor eso que nada).
 */
function traducirMensajeError_(respuesta) {
  if (respuesta.ok) return respuesta;
  const clave = 'errores.' + respuesta.error;
  const traducido = t(clave);
  return Object.assign({}, respuesta, { mensaje: traducido !== clave ? traducido : respuesta.mensaje });
}
