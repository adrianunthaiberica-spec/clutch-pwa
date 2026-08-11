'use strict';

// UNTHA CLUTCH — Pantalla 2 · Aviso de seguridad. Hay que confirmar explícitamente que
// la máquina está parada y enclavada antes de poder medir: el botón "Continuar" nace
// deshabilitado y solo se activa al marcar la casilla. No es un trámite, es una puerta:
// no hay forma de saltársela.

function renderPantallaAvisoSeguridad(contenedor, alConfirmar, alCancelar) {
  contenedor.innerHTML = '';
  contenedor.className = 'pantalla-aviso';

  const titulo = document.createElement('h1');
  titulo.className = 'pantalla-aviso__titulo';
  titulo.textContent = t('avisoSeguridad.titulo');
  contenedor.appendChild(titulo);

  const mensaje = document.createElement('p');
  mensaje.className = 'pantalla-aviso__mensaje';
  mensaje.textContent = t('avisoSeguridad.mensaje');
  contenedor.appendChild(mensaje);

  const etiquetaConfirmacion = document.createElement('label');
  etiquetaConfirmacion.className = 'pantalla-aviso__confirmacion';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';

  const textoConfirmacion = document.createElement('span');
  textoConfirmacion.textContent = t('avisoSeguridad.confirmacion');

  etiquetaConfirmacion.appendChild(checkbox);
  etiquetaConfirmacion.appendChild(textoConfirmacion);
  contenedor.appendChild(etiquetaConfirmacion);

  const botonContinuar = document.createElement('button');
  botonContinuar.type = 'button';
  botonContinuar.className = 'boton-grande';
  botonContinuar.textContent = t('avisoSeguridad.continuar');
  botonContinuar.disabled = true;
  botonContinuar.addEventListener('click', alConfirmar);
  contenedor.appendChild(botonContinuar);

  checkbox.addEventListener('change', () => {
    botonContinuar.disabled = !checkbox.checked;
  });

  const botonCancelar = document.createElement('button');
  botonCancelar.type = 'button';
  botonCancelar.className = 'boton-secundario';
  botonCancelar.textContent = t('avisoSeguridad.cancelar');
  botonCancelar.addEventListener('click', alCancelar);
  contenedor.appendChild(botonCancelar);
}
