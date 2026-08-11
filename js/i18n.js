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
      proximamente: 'Próximamente…',
    },
    inicio: {
      escanear: 'Escanea el código QR de la máquina para empezar.',
    },
    maquina: {
      numeroSerie: 'Nº de serie',
      posicionIzquierda: 'Izquierda',
      posicionDerecha: 'Derecha',
      sinRegistrar: 'Embragues sin registrar — contacta con UNTHA',
      botonNuevaMedicion: 'Nueva medición',
    },
    avisoSeguridad: {
      titulo: 'Aviso de seguridad',
      mensaje: 'Antes de medir, comprueba que la máquina está parada y enclavada.',
      confirmacion: 'Confirmo que la máquina está parada y enclavada.',
      continuar: 'Continuar',
      cancelar: 'Cancelar',
    },
    medicion: {
      titulo: 'Medición',
      posicionBloqueada: 'Este embrague no está registrado todavía. Contacta con UNTHA.',
      anterior: 'Anterior',
      sinMedicionAnterior: 'Sin medición previa',
      omitir: 'Omitir esta posición',
      valorEtiqueta: 'Valor medido (mm)',
      valorPlaceholder: 'Ej. 5,7',
      horometroEtiqueta: 'Horómetro (h)',
      horometroPlaceholder: 'Ej. 1234',
      operarioEtiqueta: 'Tu nombre',
      operarioPlaceholder: 'Nombre y apellidos',
      guardar: 'Guardar medición',
      volver: 'Volver',
      errorNingunaPosicion: 'Mide u omite al menos una posición.',
      errorValorRequerido: 'Escribe el valor medido o marca "Omitir esta posición".',
      errorDecimal: 'El valor solo admite un decimal (ej. 5,7).',
      errorRangoPrefijo: 'El valor debe estar entre',
      errorRangoY: 'y',
      errorHorometro: 'Escribe el horómetro (un número igual o mayor que 0).',
      errorOperario: 'Escribe tu nombre.',
      confirmacionTitulo: 'Confirma antes de guardar',
      confirmacionNuevo: 'Nuevo',
      confirmacionOmitida: 'Omitida',
      confirmacionHorometro: 'Horómetro',
      confirmacionOperario: 'Operario',
      confirmar: 'Confirmar y guardar',
      volverEditar: 'Volver a editar',
      guardando: 'Guardando…',
      errorGuardarTitulo: 'No se ha podido guardar alguna posición',
      reintentar: 'Reintentar',
    },
    resultado: {
      titulo: 'Resultado',
      perdidoPrefijo: 'Has perdido',
      perdidoDe: 'de los',
      perdidoSufijo: 'de vida útil.',
      estadoVerde: 'Estado: correcto.',
      estadoAmbar: 'Estado: desgaste a vigilar.',
      estadoRojo: 'Estado: desgaste crítico.',
      guardadoSinEstado: 'Medición guardada.',
      continuar: 'Continuar',
    },
    // Traducciones de los codigos de error que devuelve el backend (Api.gs). El
    // servidor siempre manda su `mensaje` en castellano (no esta preparado para
    // idiomas); aqui se traducen los codigos que un operario puede llegar a ver de
    // verdad. Los que faltan (p. ej. DATOS_INVALIDOS, con numeros concretos de rango
    // incrustados en el texto) se quedan con el mensaje del servidor tal cual: mejor
    // eso que nada, y en la practica casi no deberian verse porque la propia pantalla
    // de medicion ya valida antes de enviar.
    errores: {
      ACCESO_DENEGADO: 'No se ha podido acceder a esta máquina. Comprueba el código QR o contacta con UNTHA.',
      POSICION_SIN_REGISTRAR: 'Este embrague no está registrado todavía. Contacta con UNTHA.',
      SUSTITUCION_NO_DECLARADA:
        'Esta medición es mayor que la anterior. Si se ha sustituido el embrague, contacta con UNTHA para registrarlo.',
      CICLO_NO_ACTIVO: 'Este embrague no está registrado todavía. Contacta con UNTHA.',
      ERROR_INTERNO: 'Ha ocurrido un error en el servidor. Inténtalo de nuevo en unos minutos.',
      ERROR_RED: 'No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
    },
  },
  pt: {
    comun: {
      cargando: 'A carregar…',
      error: 'Ocorreu um erro. Tenta novamente.',
      reintentar: 'Tentar novamente',
      proximamente: 'Brevemente…',
    },
    inicio: {
      escanear: 'Digitaliza o código QR da máquina para começar.',
    },
    maquina: {
      numeroSerie: 'Nº de série',
      posicionIzquierda: 'Esquerda',
      posicionDerecha: 'Direita',
      sinRegistrar: 'Embraiagens não registadas — contacta a UNTHA',
      botonNuevaMedicion: 'Nova medição',
    },
    avisoSeguridad: {
      titulo: 'Aviso de segurança',
      mensaje: 'Antes de medir, confirma que a máquina está parada e bloqueada.',
      confirmacion: 'Confirmo que a máquina está parada e bloqueada.',
      continuar: 'Continuar',
      cancelar: 'Cancelar',
    },
    medicion: {
      titulo: 'Medição',
      posicionBloqueada: 'Esta embraiagem ainda não está registada. Contacta a UNTHA.',
      anterior: 'Anterior',
      sinMedicionAnterior: 'Sem medição anterior',
      omitir: 'Omitir esta posição',
      valorEtiqueta: 'Valor medido (mm)',
      valorPlaceholder: 'Ex. 5,7',
      horometroEtiqueta: 'Horómetro (h)',
      horometroPlaceholder: 'Ex. 1234',
      operarioEtiqueta: 'O teu nome',
      operarioPlaceholder: 'Nome e apelido',
      guardar: 'Guardar medição',
      volver: 'Voltar',
      errorNingunaPosicion: 'Mede ou omite pelo menos uma posição.',
      errorValorRequerido: 'Escreve o valor medido ou marca "Omitir esta posição".',
      errorDecimal: 'O valor só admite uma casa decimal (ex. 5,7).',
      errorRangoPrefijo: 'O valor deve estar entre',
      errorRangoY: 'e',
      errorHorometro: 'Escreve o horómetro (um número igual ou maior que 0).',
      errorOperario: 'Escreve o teu nome.',
      confirmacionTitulo: 'Confirma antes de guardar',
      confirmacionNuevo: 'Novo',
      confirmacionOmitida: 'Omitida',
      confirmacionHorometro: 'Horómetro',
      confirmacionOperario: 'Operário',
      confirmar: 'Confirmar e guardar',
      volverEditar: 'Voltar a editar',
      guardando: 'A guardar…',
      errorGuardarTitulo: 'Não foi possível guardar alguma posição',
      reintentar: 'Tentar novamente',
    },
    resultado: {
      titulo: 'Resultado',
      perdidoPrefijo: 'Perdeste',
      perdidoDe: 'dos',
      perdidoSufijo: 'de vida útil.',
      estadoVerde: 'Estado: correto.',
      estadoAmbar: 'Estado: desgaste a vigiar.',
      estadoRojo: 'Estado: desgaste crítico.',
      guardadoSinEstado: 'Medição guardada.',
      continuar: 'Continuar',
    },
    errores: {
      ACCESO_DENEGADO: 'Não foi possível aceder a esta máquina. Verifica o código QR ou contacta a UNTHA.',
      POSICION_SIN_REGISTRAR: 'Esta embraiagem ainda não está registada. Contacta a UNTHA.',
      SUSTITUCION_NO_DECLARADA:
        'Esta medição é maior do que a anterior. Se a embraiagem foi substituída, contacta a UNTHA para a registar.',
      CICLO_NO_ACTIVO: 'Esta embraiagem ainda não está registada. Contacta a UNTHA.',
      ERROR_INTERNO: 'Ocorreu um erro no servidor. Tenta novamente dentro de uns minutos.',
      ERROR_RED: 'Não foi possível ligar. Verifica a tua ligação e tenta novamente.',
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
