'use strict';

// UNTHA CLUTCH — Pantalla 4 · Resultado. Se pinta justo después de guardar en la
// Pantalla 3: una tarjeta por cada posición que se acaba de medir (nunca por las que se
// omitieron o estaban bloqueadas — aquí no ha pasado nada nuevo con ellas), con el
// desgaste calculado por el servidor y el color ya recalculado en 10_ESTADO_ACTUAL.
//
// Nunca se recalcula el semáforo ni el desgaste aquí (§2.4, igual que la Pantalla 1):
// el color sale de un GET fresco hecho justo tras guardar (app.js), el desgaste y
// medicion_inicial salen de la respuesta del propio POST (Api.gs).
//
// Si sale rojo, el mensaje es una constatación de estado, no una orden ni una
// insistencia: "la app informa, no da órdenes" — cualquier aviso proactivo (contactar
// con UNTHA, programar sustitución, etc.) es cosa de UNTHA, no de esta pantalla.

const MENSAJE_ESTADO_POR_SEMAFORO_ = {
  VERDE: 'resultado.estadoVerde',
  AMBAR: 'resultado.estadoAmbar',
  ROJO: 'resultado.estadoRojo',
};

/**
 * `datosMaquina` es el resultado del GET fresco (puede ser null si ese GET falló justo
 * tras guardar: la medición ya está guardada de todos modos, así que aquí no se bloquea
 * ni se reintenta, solo se pinta sin el color exacto — ver `guardadoSinEstado`).
 * `resultadosGuardados`: { IZQUIERDA?: {valor, medicion_inicial, desgaste}, DERECHA?: {...} }.
 */
function renderPantallaResultado(contenedor, datosMaquina, resultadosGuardados, alContinuar) {
  contenedor.innerHTML = '';
  contenedor.className = 'pantalla-medicion';

  const titulo = document.createElement('h1');
  titulo.className = 'pantalla-medicion__titulo';
  titulo.textContent = t('resultado.titulo');
  contenedor.appendChild(titulo);

  const posicionesConDatos = datosMaquina && datosMaquina.posiciones ? datosMaquina.posiciones : {};

  ['IZQUIERDA', 'DERECHA'].forEach((posicion) => {
    const entrada = resultadosGuardados[posicion];
    if (!entrada) return; // no se midió esta posición en este registro: no hay nada nuevo que mostrar de ella

    const datosPosicion = posicionesConDatos[posicion];
    const semaforo = datosPosicion && datosPosicion.estado_semaforo;
    const claseColor = (semaforo && CLASE_CSS_POR_SEMAFORO_[semaforo]) || 'gris';

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-posicion tarjeta-posicion--' + claseColor;

    const tituloPosicion = document.createElement('h2');
    tituloPosicion.className = 'tarjeta-posicion__titulo';
    tituloPosicion.textContent = t(claveTituloPosicion_(posicion));
    tarjeta.appendChild(tituloPosicion);

    const valor = document.createElement('p');
    valor.className = 'tarjeta-posicion__valor';
    valor.textContent = formatearValorMedicion_(entrada.valor);
    tarjeta.appendChild(valor);

    if (typeof entrada.desgaste === 'number' && typeof entrada.medicion_inicial === 'number') {
      const perdido = document.createElement('p');
      perdido.className = 'tarjeta-posicion__perdido';
      perdido.textContent =
        t('resultado.perdidoPrefijo') +
        ' ' +
        formatearValorMedicion_(entrada.desgaste) +
        ' ' +
        t('resultado.perdidoDe') +
        ' ' +
        formatearValorMedicion_(entrada.medicion_inicial) +
        ' ' +
        t('resultado.perdidoSufijo');
      tarjeta.appendChild(perdido);
    }

    const estado = document.createElement('p');
    estado.className = 'tarjeta-posicion__estado';
    estado.textContent = MENSAJE_ESTADO_POR_SEMAFORO_[semaforo] ? t(MENSAJE_ESTADO_POR_SEMAFORO_[semaforo]) : t('resultado.guardadoSinEstado');
    tarjeta.appendChild(estado);

    contenedor.appendChild(tarjeta);
  });

  const botonContinuar = document.createElement('button');
  botonContinuar.type = 'button';
  botonContinuar.className = 'boton-grande';
  botonContinuar.textContent = t('resultado.continuar');
  botonContinuar.addEventListener('click', alContinuar);
  contenedor.appendChild(botonContinuar);
}
