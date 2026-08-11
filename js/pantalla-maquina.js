'use strict';

// UNTHA CLUTCH — Pantalla 1 · Máquina: número de serie y dos tarjetas (izquierda y
// derecha) con su semáforo, última medición y fecha. Los datos ya vienen calculados
// del backend (consultarMaquina, js/api.js): aquí no se recalcula desgaste ni color,
// solo se pintan (§2.4 — el semáforo se calcula, nunca se recalcula por duplicado).

const POSICIONES_MAQUINA_ = ['IZQUIERDA', 'DERECHA'];

// Verde/ámbar/rojo estándar e inequívocos (no teñidos de corporativo): que se
// reconozcan de un vistazo con mala luz y sin esfuerzo, no que combinen con la marca.
const CLASE_CSS_POR_SEMAFORO_ = {
  VERDE: 'verde',
  AMBAR: 'ambar',
  ROJO: 'rojo',
  SIN_REGISTRAR: 'gris',
};

function localeActivo_() {
  return idiomaActivo() === 'pt' ? 'pt-PT' : 'es-ES';
}

function formatearValorMedicion_(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  return new Intl.NumberFormat(localeActivo_(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor) + ' mm';
}

function formatearFecha_(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat(localeActivo_(), { day: '2-digit', month: '2-digit', year: 'numeric' }).format(fecha);
}

function claveTituloPosicion_(posicion) {
  return posicion === 'IZQUIERDA' ? 'maquina.posicionIzquierda' : 'maquina.posicionDerecha';
}

function crearTarjetaPosicion_(posicion, datosPosicion) {
  const claseColor = CLASE_CSS_POR_SEMAFORO_[datosPosicion.estado_semaforo] || 'gris';

  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta-posicion tarjeta-posicion--' + claseColor;

  const titulo = document.createElement('h2');
  titulo.className = 'tarjeta-posicion__titulo';
  titulo.textContent = t(claveTituloPosicion_(posicion));
  tarjeta.appendChild(titulo);

  if (datosPosicion.estado_semaforo === 'SIN_REGISTRAR') {
    const aviso = document.createElement('p');
    aviso.className = 'tarjeta-posicion__aviso';
    aviso.textContent = t('maquina.sinRegistrar');
    tarjeta.appendChild(aviso);
    return tarjeta;
  }

  const valor = document.createElement('p');
  valor.className = 'tarjeta-posicion__valor';
  valor.textContent = formatearValorMedicion_(datosPosicion.ultima_medicion);
  tarjeta.appendChild(valor);

  const fecha = document.createElement('p');
  fecha.className = 'tarjeta-posicion__fecha';
  fecha.textContent = formatearFecha_(datosPosicion.fecha_ultima_medicion);
  tarjeta.appendChild(fecha);

  return tarjeta;
}

function hayAlgunaPosicionMedible_(datos) {
  return POSICIONES_MAQUINA_.some((posicion) => datos.posiciones[posicion].estado_semaforo !== 'SIN_REGISTRAR');
}

/**
 * Pinta la Pantalla 1 dentro de `contenedor`. `alPulsarNuevaMedicion` se invoca al
 * tocar el botón grande, solo si hay al menos una posición medible (si las dos están
 * SIN_REGISTRAR, el botón se deshabilita: no hay nada que medir todavía).
 */
function renderPantallaMaquina(contenedor, datos, alPulsarNuevaMedicion) {
  contenedor.innerHTML = '';
  contenedor.className = 'pantalla-maquina';

  const numSerie = document.createElement('p');
  numSerie.className = 'pantalla-maquina__num-serie';
  numSerie.textContent = t('maquina.numeroSerie') + ': ' + datos.num_serie;
  contenedor.appendChild(numSerie);

  const tarjetas = document.createElement('div');
  tarjetas.className = 'pantalla-maquina__tarjetas';
  POSICIONES_MAQUINA_.forEach((posicion) => {
    tarjetas.appendChild(crearTarjetaPosicion_(posicion, datos.posiciones[posicion]));
  });
  contenedor.appendChild(tarjetas);

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton-grande';
  boton.textContent = t('maquina.botonNuevaMedicion');

  const medible = hayAlgunaPosicionMedible_(datos);
  boton.disabled = !medible;
  if (medible) {
    boton.addEventListener('click', alPulsarNuevaMedicion);
  }
  contenedor.appendChild(boton);
}
