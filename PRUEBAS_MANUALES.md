# PRUEBAS_MANUALES.md — Lista de comprobación en el móvil, contra producción

Para el Paso 9 (pruebas end-to-end). Esto es la parte que solo puedes hacer tú: contra
el backend real desplegado, desde tu móvil. Las pruebas automáticas (Playwright contra
un mock local) ya están hechas y viven fuera de este repo (nunca tocan producción); esta
lista es el complemento manual, con los tres rechazos y qué mirar en el Sheet después.

**Aviso importante antes de empezar**: guardar una medición de verdad escribe una fila
real en `04_MEDICIONES` y actualiza `10_ESTADO_ACTUAL`. Usa una máquina de prueba que no
importe, o si usas una máquina real, anula después las mediciones de prueba desde el
panel de UNTHA (Menú → Mediciones → Anular medición, con motivo "prueba") para no dejar
el Sheet con datos falsos. El aviso del final de esta lista te recuerda ese paso.

## Antes de empezar

- [ ] Elige una máquina de prueba (QR/token) y anota en el propio Sheet, en
      `10_ESTADO_ACTUAL`, el estado actual de sus dos posiciones (color, última medición,
      fecha) — lo necesitas para comparar "antes/después" en los pasos siguientes.
- [ ] Ten a mano el panel de UNTHA (Menú personalizado en el Sheet) por si hace falta
      anular alguna medición de prueba al terminar.
- [ ] Si quieres probar también el modo instalado (pasos 10-11), ten el móvil a mano con
      la PWA abierta en el navegador.

## 1 · Pantalla 1 — casos de acceso

- [ ] **Sin token**: abre la URL de la PWA sin `?t=...` al final (solo el dominio).
      **Deberías ver**: "Escanea el código QR de la máquina para empezar." — nada de
      pantalla en blanco ni error técnico.
- [ ] **Token inválido**: añade a mano `?t=` seguido de algo inventado (que no exista).
      **Deberías ver**: un mensaje de que no se ha podido acceder a la máquina, con un
      botón "Reintentar".
- [ ] **Token real**: escanea el QR de tu máquina de prueba.
      **Deberías ver**: el número de serie correcto y dos tarjetas (Izquierda/Derecha)
      con el color y valor que anotaste antes de empezar — deben coincidir.

## 2 · Pantalla 2 — aviso de seguridad

- [ ] Pulsa "Nueva medición". **Deberías ver**: el aviso de seguridad, con el botón
      "Continuar" deshabilitado (gris, no se puede pulsar).
- [ ] Marca la casilla de confirmación. **Deberías ver**: "Continuar" pasa a estar
      habilitado.
- [ ] Pulsa "Cancelar" (en vez de Continuar). **Deberías ver**: vuelves a la Pantalla 1
      sin que se haya guardado nada.
- [ ] Repite: "Nueva medición" → marcar casilla → "Continuar", esta vez hasta el final,
      para llegar a la Pantalla 3.

## 3 · Pantalla 3 — los tres rechazos (pruébalos SIN guardar todavía)

- [ ] **Rechazo 1 — dos decimales**: escribe un valor con dos decimales, p. ej. `5,75`, y
      pulsa "Guardar medición". **Deberías ver**: un error pidiendo un solo decimal, sin
      avanzar de pantalla.
- [ ] **Rechazo 2 — fuera de rango**: corrige el valor a algo claramente fuera de rango
      (p. ej. `9,9`, o `0,5`) y pulsa "Guardar medición" otra vez. **Deberías ver**: un
      error de rango citando los límites reales (1,0 y 6,5 mm).
- [ ] **Campos obligatorios**: deja el horómetro o tu nombre en blanco y pulsa "Guardar
      medición". **Deberías ver**: el error correspondiente junto a ese campo.

## 4 · Rechazo 3 — sustitución no declarada (este SÍ llega a intentar guardar)

- [ ] Escribe un valor MAYOR que el que aparece como "Anterior" en esa posición (sin que
      hayas sustituido de verdad el embrague), completa horómetro y nombre, pulsa
      "Guardar medición" y luego "Confirmar y guardar".
      **Deberías ver**: tras un instante, un error diciendo que la medición es mayor que
      la anterior y que si se ha sustituido el embrague hay que contactar con UNTHA — la
      pantalla de medición se queda abierta, con el botón ahora diciendo "Reintentar".
- [ ] Pulsa "Volver a editar" y corrige el valor a uno igual o menor que el anterior, para
      continuar con la prueba en el punto 5.

## 5 · Guardar de verdad

- [ ] Con un valor válido (igual o menor que el anterior, un decimal, dentro de rango),
      horómetro y tu nombre, pulsa "Guardar medición".
      **Deberías ver**: la pantalla de confirmación, mostrando el valor que acabas de
      escribir JUNTO AL anterior (no solo uno de los dos).
- [ ] Pulsa "Volver a editar" una vez, solo para comprobar que lo que habías escrito
      sigue ahí (no se pierde). Vuelve a pulsar "Guardar medición".
- [ ] Pulsa "Confirmar y guardar".
      **Deberías ver**: la Pantalla 4 (Resultado), con una tarjeta para la posición que
      acabas de medir: el valor guardado, la frase "Has perdido X mm de los Y mm de vida
      útil." y un mensaje de estado corto (verde: "correcto", ámbar: "a vigilar", rojo:
      "crítico"). Si te sale en rojo, comprueba que el mensaje es solo informativo — no
      debe decirte que llames a nadie ni darte ninguna instrucción; eso es intencionado.
- [ ] Pulsa "Continuar". **Deberías ver**: vuelves a la Pantalla 1 y la tarjeta ya
      muestra el valor y color nuevos, sin que hayas tenido que refrescar nada a mano.

## 6 · (Opcional pero recomendable) Reintento real tras perder cobertura

Esta prueba comprueba la idempotencia de verdad, no solo en el simulador:

- [ ] Repite una medición (Pantalla 3 → confirmar valores). Justo DESPUÉS de pulsar
      "Confirmar y guardar", activa el modo avión un instante.
      **Deberías ver**: un error de guardado con el botón "Reintentar".
- [ ] Desactiva el modo avión y pulsa "Reintentar".
      **Deberías ver**: esta vez se guarda correctamente y llegas a la Pantalla 4.
- [ ] Revisa `04_MEDICIONES` en el Sheet: para esta medición debe haber **una sola fila
      nueva**, no dos — el reintento no debe haber duplicado nada.

## 7 · Idioma

- [ ] Cambia el selector ES/PT de la cabecera. **Deberías ver**: el texto de la pantalla
      actual cambia de idioma al momento.
- [ ] Cierra la pestaña (o la app instalada) y vuelve a abrirla. **Deberías ver**: se
      mantiene el idioma que elegiste la última vez, no vuelve a español por defecto.

## 8 · Instalación y modo sin conexión (shell)

- [ ] Si no la tienes instalada: menú del navegador → "Añadir a pantalla de inicio" (o
      equivalente). Abre la app instalada. **Deberías ver**: carga con su propio icono,
      sin la barra de direcciones del navegador.
- [ ] Con la app instalada, activa el modo avión y ábrela de nuevo (o recárgala).
      **Deberías ver**: la cabecera, el logo, los estilos y la tipografía cargan
      igualmente (el "shell" está cacheado) — lo que SÍ fallará, como es esperado, es
      cargar los datos de una máquina, con el mensaje de "no se ha podido conectar" y
      "Reintentar". Eso es correcto: no hay offline de datos todavía, solo del shell.

## Qué revisar en el Sheet al terminar

- [ ] **04_MEDICIONES**: una fila nueva por cada medición que llegó a guardarse de
      verdad (pasos 5 y 6) — con el id, valor, horómetro, tu nombre y la fecha
      correctos. Los rechazos de los pasos 3 y 4 (decimales, rango, sustitución) **no**
      deben haber creado ninguna fila aquí.
- [ ] **10_ESTADO_ACTUAL**: la posición que mediste refleja ya el nuevo valor, color y
      fecha, sin que hayas tocado nada a mano — se regenera sola tras cada escritura.
- [ ] **90_LOG**: debería tener una entrada nueva por la prueba del token inválido
      (paso 1), pero **no** por los rechazos de rango/decimal/sustitución de los pasos 3
      y 4 — esos no quedan registrados ahí, solo los intentos de acceso denegado.
- [ ] **03_CICLOS**: `medicion_inicial` de la posición probada no debe haber cambiado —
      ni los rechazos ni una medición válida normal tocan la línea base.

## Al terminar: limpieza

- [ ] Si has guardado mediciones de prueba que no quieres que cuenten como reales, ve al
      panel de UNTHA (Menú → Mediciones → Anular medición) y anúlalas con motivo
      "prueba", para dejar el histórico de esa máquina limpio.
