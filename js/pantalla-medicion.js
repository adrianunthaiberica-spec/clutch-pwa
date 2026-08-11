'use strict';

// UNTHA CLUTCH — Pantalla 3 · Medición. Ambas posiciones en una sola pantalla: la
// posición sin ciclo activo (SIN_REGISTRAR) se muestra bloqueada con su explicación y
// nunca pide un valor; las posiciones medibles se pueden medir u omitir. Solo se envían
// al servidor las posiciones que el operario mide de verdad (§2.4 — el servidor decide
// el ciclo por posición, el cliente nunca manda ciclo_id).
//
// Tres validaciones antes de guardar (spec): un solo decimal, rango plausible, y una
// confirmación explícita que muestra el valor tecleado junto al anterior. El rango
// plausible llega en `datosMaquina.rango_medicion` (Api.gs, GET) para no duplicar
// MIN_MEDICION/MAX_MEDICION del Sheet en el cliente; si por lo que sea no llega, se usa
// un rango de seguridad amplio y la medición sigue funcionando (nunca se bloquea por
// esto — el servidor vuelve a validar el rango real de todos modos).

const POSICIONES_MEDICION_ = ['IZQUIERDA', 'DERECHA'];
const CLAVE_ALMACENAMIENTO_OPERARIO_ = 'untha-clutch-operario';
const RANGO_MEDICION_SEGURIDAD_ = { min: 0, max: 50 };

function obtenerOperarioGuardado_() {
  try {
    return window.localStorage.getItem(CLAVE_ALMACENAMIENTO_OPERARIO_) || '';
  } catch (err) {
    return ''; // localStorage puede fallar (modo privado, cuota, etc.): no bloquea la app.
  }
}

function guardarOperario_(nombre) {
  try {
    window.localStorage.setItem(CLAVE_ALMACENAMIENTO_OPERARIO_, nombre);
  } catch (err) {
    // Sin persistencia disponible: hay que reescribir el nombre la próxima vez, nada más.
  }
}

function obtenerRangoMedicion_(datosMaquina) {
  const rango = datosMaquina && datosMaquina.rango_medicion;
  if (rango && typeof rango.min === 'number' && typeof rango.max === 'number') return rango;
  return RANGO_MEDICION_SEGURIDAD_;
}

/** Acepta coma o punto como separador decimal (teclado español vs. punto de "decimal" en iOS/Android). */
function parseNumeroDecimal_(texto) {
  if (typeof texto !== 'string') return NaN;
  const normalizado = texto.trim().replace(',', '.');
  if (normalizado === '') return NaN;
  return Number(normalizado);
}

function esUnSoloDecimal_(valor) {
  const decimas = valor * 10;
  return Math.abs(decimas - Math.round(decimas)) < 1e-6;
}

/**
 * Pinta la Pantalla 3 dentro de `contenedor`. `token` hace falta aquí (no solo en
 * app.js) porque esta pantalla llama a la API directamente para guardar: mantener todo
 * el flujo de validación + confirmación + guardado + reintento autocontenido en un solo
 * sitio es más simple que repartirlo entre esta pantalla y app.js.
 *
 * `alGuardadoCompleto` se invoca solo cuando TODAS las posiciones enviadas se han
 * guardado con éxito. `alCancelar` vuelve a la Pantalla 1 sin guardar nada.
 */
function renderPantallaMedicion(contenedor, token, datosMaquina, alGuardadoCompleto, alCancelar) {
  const posicionesMedibles = POSICIONES_MEDICION_.filter(
    (posicion) => datosMaquina.posiciones[posicion].estado_semaforo !== 'SIN_REGISTRAR'
  );
  const rango = obtenerRangoMedicion_(datosMaquina);

  // Ids estables mientras dure un intento de guardado (incluidos sus reintentos tras un
  // fallo de red): se regeneran solo si el operario vuelve a editar los valores, porque
  // eso es un intento nuevo de verdad (ver js/api.js, generarIdMedicion).
  let idsPorPosicion = null;

  function pintarFormulario_(valoresPrevios) {
    idsPorPosicion = null;
    contenedor.innerHTML = '';
    contenedor.className = 'pantalla-medicion';

    const titulo = document.createElement('h1');
    titulo.className = 'pantalla-medicion__titulo';
    titulo.textContent = t('medicion.titulo');
    contenedor.appendChild(titulo);

    const errorGeneral = document.createElement('p');
    errorGeneral.className = 'campo__error';
    errorGeneral.hidden = true;
    contenedor.appendChild(errorGeneral);

    const camposPosicion = {}; // posicion -> { checkbox, input, error }

    POSICIONES_MEDICION_.forEach((posicion) => {
      const datosPosicion = datosMaquina.posiciones[posicion];

      if (datosPosicion.estado_semaforo === 'SIN_REGISTRAR') {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-posicion tarjeta-posicion--gris';

        const tituloPosicion = document.createElement('h2');
        tituloPosicion.className = 'tarjeta-posicion__titulo';
        tituloPosicion.textContent = t(claveTituloPosicion_(posicion));
        tarjeta.appendChild(tituloPosicion);

        const aviso = document.createElement('p');
        aviso.className = 'tarjeta-posicion__aviso';
        aviso.textContent = t('medicion.posicionBloqueada');
        tarjeta.appendChild(aviso);

        contenedor.appendChild(tarjeta);
        return;
      }

      const previo = (valoresPrevios && valoresPrevios[posicion]) || {};

      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-posicion tarjeta-posicion--gris';

      const tituloPosicion = document.createElement('h2');
      tituloPosicion.className = 'tarjeta-posicion__titulo';
      tituloPosicion.textContent = t(claveTituloPosicion_(posicion));
      tarjeta.appendChild(tituloPosicion);

      const anterior = document.createElement('p');
      anterior.className = 'tarjeta-posicion__anterior';
      anterior.textContent =
        t('medicion.anterior') +
        ': ' +
        (datosPosicion.ultima_medicion !== ''
          ? formatearValorMedicion_(datosPosicion.ultima_medicion) + ' (' + formatearFecha_(datosPosicion.fecha_ultima_medicion) + ')'
          : t('medicion.sinMedicionAnterior'));
      tarjeta.appendChild(anterior);

      const campo = document.createElement('div');
      campo.className = 'campo';

      const etiqueta = document.createElement('label');
      etiqueta.className = 'campo__etiqueta';
      etiqueta.textContent = t('medicion.valorEtiqueta');
      campo.appendChild(etiqueta);

      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.placeholder = t('medicion.valorPlaceholder');
      input.className = 'campo__input';
      input.value = previo.valorTexto || '';
      campo.appendChild(input);

      const error = document.createElement('p');
      error.className = 'campo__error';
      error.hidden = true;
      campo.appendChild(error);

      tarjeta.appendChild(campo);

      const etiquetaOmitir = document.createElement('label');
      etiquetaOmitir.className = 'tarjeta-posicion__omitir';

      const checkboxOmitir = document.createElement('input');
      checkboxOmitir.type = 'checkbox';
      checkboxOmitir.checked = Boolean(previo.omitido);

      const textoOmitir = document.createElement('span');
      textoOmitir.textContent = t('medicion.omitir');

      etiquetaOmitir.appendChild(checkboxOmitir);
      etiquetaOmitir.appendChild(textoOmitir);
      tarjeta.appendChild(etiquetaOmitir);

      const actualizarDisabled = () => {
        input.disabled = checkboxOmitir.checked;
        if (checkboxOmitir.checked) {
          error.hidden = true;
        }
      };
      checkboxOmitir.addEventListener('change', actualizarDisabled);
      actualizarDisabled();

      contenedor.appendChild(tarjeta);
      camposPosicion[posicion] = { checkbox: checkboxOmitir, input: input, error: error };
    });

    const campoHorometro = crearCampoTexto_(
      t('medicion.horometroEtiqueta'),
      t('medicion.horometroPlaceholder'),
      (valoresPrevios && valoresPrevios.horometroTexto) || ''
    );
    contenedor.appendChild(campoHorometro.contenedor);

    const campoOperario = crearCampoTexto_(
      t('medicion.operarioEtiqueta'),
      t('medicion.operarioPlaceholder'),
      (valoresPrevios && valoresPrevios.operario) || obtenerOperarioGuardado_()
    );
    campoOperario.input.inputMode = 'text';
    contenedor.appendChild(campoOperario.contenedor);

    const botonGuardar = document.createElement('button');
    botonGuardar.type = 'button';
    botonGuardar.className = 'boton-grande';
    botonGuardar.textContent = t('medicion.guardar');
    botonGuardar.addEventListener('click', () => {
      const resultado = validarFormulario_(camposPosicion, campoHorometro.input, campoOperario.input, errorGeneral);
      if (resultado) {
        guardarOperario_(resultado.operario);
        pintarConfirmacion_(resultado);
      }
    });
    contenedor.appendChild(botonGuardar);

    const botonVolver = document.createElement('button');
    botonVolver.type = 'button';
    botonVolver.className = 'boton-secundario';
    botonVolver.textContent = t('medicion.volver');
    botonVolver.addEventListener('click', alCancelar);
    contenedor.appendChild(botonVolver);
  }

  /**
   * Valida las tres reglas del teclado (posicion medida: un decimal + rango plausible;
   * siempre: horómetro y operario) y devuelve los datos ya limpios, o null si algo falla
   * (con los mensajes de error ya pintados junto a cada campo).
   */
  function validarFormulario_(camposPosicion, inputHorometro, inputOperario, errorGeneral) {
    let huboError = false;
    const entradas = {};
    const valoresParaConservar = { horometroTexto: inputHorometro.value, operario: inputOperario.value };

    posicionesMedibles.forEach((posicion) => {
      const campos = camposPosicion[posicion];
      campos.error.hidden = true;
      valoresParaConservar[posicion] = { valorTexto: campos.input.value, omitido: campos.checkbox.checked };

      if (campos.checkbox.checked) return;

      const texto = campos.input.value.trim();
      if (texto === '') {
        campos.error.textContent = t('medicion.errorValorRequerido');
        campos.error.hidden = false;
        huboError = true;
        return;
      }

      const valor = parseNumeroDecimal_(texto);
      if (isNaN(valor)) {
        campos.error.textContent = t('medicion.errorDecimal');
        campos.error.hidden = false;
        huboError = true;
        return;
      }
      if (!esUnSoloDecimal_(valor)) {
        campos.error.textContent = t('medicion.errorDecimal');
        campos.error.hidden = false;
        huboError = true;
        return;
      }
      if (valor < rango.min || valor > rango.max) {
        campos.error.textContent =
          t('medicion.errorRangoPrefijo') + ' ' + formatearValorMedicion_(rango.min) + ' ' + t('medicion.errorRangoY') + ' ' + formatearValorMedicion_(rango.max) + '.';
        campos.error.hidden = false;
        huboError = true;
        return;
      }

      entradas[posicion] = { valor: valor };
    });

    errorGeneral.hidden = true;
    if (!huboError && Object.keys(entradas).length === 0) {
      errorGeneral.textContent = t('medicion.errorNingunaPosicion');
      errorGeneral.hidden = false;
      huboError = true;
    }

    const horometro = parseNumeroDecimal_(inputHorometro.value.trim());
    if (isNaN(horometro) || horometro < 0) {
      mostrarErrorCampo_(inputHorometro, t('medicion.errorHorometro'));
      huboError = true;
    }

    const operario = inputOperario.value.trim();
    if (!operario) {
      mostrarErrorCampo_(inputOperario, t('medicion.errorOperario'));
      huboError = true;
    }

    if (huboError) return null;

    Object.keys(entradas).forEach((posicion) => {
      entradas[posicion].horometro = horometro;
      entradas[posicion].operario = operario;
    });

    return { entradas: entradas, operario: operario, valoresParaConservar: valoresParaConservar };
  }

  function mostrarErrorCampo_(input, mensaje) {
    const error = input.parentElement.querySelector('.campo__error');
    if (error) {
      error.textContent = mensaje;
      error.hidden = false;
    }
  }

  function pintarConfirmacion_(resultado) {
    if (!idsPorPosicion) {
      idsPorPosicion = {};
      Object.keys(resultado.entradas).forEach((posicion) => {
        idsPorPosicion[posicion] = generarIdMedicion();
      });
    }

    contenedor.innerHTML = '';
    contenedor.className = 'pantalla-medicion';

    const titulo = document.createElement('h1');
    titulo.className = 'pantalla-medicion__titulo';
    titulo.textContent = t('medicion.confirmacionTitulo');
    contenedor.appendChild(titulo);

    POSICIONES_MEDICION_.forEach((posicion) => {
      const datosPosicion = datosMaquina.posiciones[posicion];
      const entrada = resultado.entradas[posicion];
      const item = document.createElement('div');
      item.className = 'pantalla-medicion__resumen-item';

      const tituloPosicion = document.createElement('p');
      tituloPosicion.className = 'pantalla-medicion__resumen-titulo';
      tituloPosicion.textContent = t(claveTituloPosicion_(posicion));
      item.appendChild(tituloPosicion);

      if (!entrada) {
        const linea = document.createElement('p');
        linea.textContent =
          datosPosicion.estado_semaforo === 'SIN_REGISTRAR' ? t('medicion.posicionBloqueada') : t('medicion.confirmacionOmitida');
        item.appendChild(linea);
        contenedor.appendChild(item);
        return;
      }

      const lineaAnterior = document.createElement('p');
      lineaAnterior.textContent =
        t('medicion.anterior') +
        ': ' +
        (datosPosicion.ultima_medicion !== '' ? formatearValorMedicion_(datosPosicion.ultima_medicion) : t('medicion.sinMedicionAnterior'));
      item.appendChild(lineaAnterior);

      const lineaNueva = document.createElement('p');
      lineaNueva.className = 'pantalla-medicion__resumen-nuevo';
      lineaNueva.textContent = t('medicion.confirmacionNuevo') + ': ' + formatearValorMedicion_(entrada.valor);
      item.appendChild(lineaNueva);

      contenedor.appendChild(item);
    });

    const resumenComun = document.createElement('p');
    resumenComun.textContent =
      t('medicion.confirmacionHorometro') + ': ' + resultado.valoresParaConservar.horometroTexto + ' · ' + t('medicion.confirmacionOperario') + ': ' + resultado.operario;
    contenedor.appendChild(resumenComun);

    const errorGuardado = document.createElement('div');
    errorGuardado.className = 'pantalla-medicion__error-guardado';
    errorGuardado.hidden = true;
    contenedor.appendChild(errorGuardado);

    const botonConfirmar = document.createElement('button');
    botonConfirmar.type = 'button';
    botonConfirmar.className = 'boton-grande';
    botonConfirmar.textContent = t('medicion.confirmar');
    contenedor.appendChild(botonConfirmar);

    const botonEditar = document.createElement('button');
    botonEditar.type = 'button';
    botonEditar.className = 'boton-secundario';
    botonEditar.textContent = t('medicion.volverEditar');
    botonEditar.addEventListener('click', () => pintarFormulario_(resultado.valoresParaConservar));
    contenedor.appendChild(botonEditar);

    botonConfirmar.addEventListener('click', () => {
      botonConfirmar.disabled = true;
      botonEditar.disabled = true;
      botonConfirmar.textContent = t('medicion.guardando');
      errorGuardado.hidden = true;
      errorGuardado.innerHTML = '';

      intentarGuardar_(resultado.entradas, resultado.operario)
        .then((resultados) => {
          const fallidas = Object.keys(resultados).filter((posicion) => !resultados[posicion].ok);
          if (fallidas.length === 0) {
            alGuardadoCompleto();
            return;
          }

          botonConfirmar.disabled = false;
          botonEditar.disabled = false;
          botonConfirmar.textContent = t('medicion.reintentar');
          pintarErrorGuardado_(errorGuardado, fallidas, resultados);
        });
    });
  }

  function pintarErrorGuardado_(contenedorError, fallidas, resultados) {
    contenedorError.hidden = false;
    contenedorError.innerHTML = '';

    const titulo = document.createElement('p');
    titulo.className = 'campo__error';
    titulo.textContent = t('medicion.errorGuardarTitulo');
    contenedorError.appendChild(titulo);

    fallidas.forEach((posicion) => {
      const linea = document.createElement('p');
      linea.className = 'campo__error';
      linea.textContent = t(claveTituloPosicion_(posicion)) + ': ' + resultados[posicion].mensaje;
      contenedorError.appendChild(linea);
    });
  }

  async function intentarGuardar_(entradas, operario) {
    const resultados = {};
    for (const posicion of Object.keys(entradas)) {
      const datosEnvio = entradas[posicion];
      resultados[posicion] = await registrarMedicion({
        token: token,
        id: idsPorPosicion[posicion],
        posicion: posicion,
        valor: datosEnvio.valor,
        horometro: datosEnvio.horometro,
        operario: operario,
      });
    }
    return resultados;
  }

  pintarFormulario_(null);
}

function crearCampoTexto_(etiquetaTexto, placeholder, valorInicial) {
  const contenedor = document.createElement('div');
  contenedor.className = 'campo';

  const etiqueta = document.createElement('label');
  etiqueta.className = 'campo__etiqueta';
  etiqueta.textContent = etiquetaTexto;
  contenedor.appendChild(etiqueta);

  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.autocomplete = 'off';
  input.placeholder = placeholder;
  input.className = 'campo__input';
  input.value = valorInicial || '';
  contenedor.appendChild(input);

  const error = document.createElement('p');
  error.className = 'campo__error';
  error.hidden = true;
  contenedor.appendChild(error);

  return { contenedor: contenedor, input: input };
}
