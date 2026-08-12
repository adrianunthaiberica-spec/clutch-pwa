# ESTADO.md — UNTHA CLUTCH PWA (clutch-pwa)

Documento de traspaso. Escrito para que alguien sin contexto previo pueda
continuar el trabajo leyendo solo esto (más el código). Última actualización:
2026-08-11, tras completar el Paso 9 (pruebas end-to-end) — los 9 pasos del
orden de construcción acordado están completos.

El redespliegue de `Api.gs` pendiente desde el Paso 6 ya se hizo: el usuario
confirmó desde el móvil que el backend real registra mediciones, valida y
regenera `10_ESTADO_ACTUAL` correctamente. `rango_medicion` ya llega en
producción — no queda ninguna acción manual pendiente sobre App-clutch en
este momento.

## 0. Qué es esto

Dos repos separados, dos responsabilidades distintas:

- **App-clutch** (privado): backend Google Apps Script + Google Sheets. API
  desplegada como Web App. UNTHA gestiona clientes/máquinas/ciclos/mediciones
  desde un panel de administración (Menu.gs).
- **clutch-pwa** (público, este repo): PWA de campo. Un operario escanea un QR
  pegado en la máquina, la PWA abre con `?t=<token>` en la URL, consulta el
  estado de la máquina y permite registrar una medición de desgaste de
  embrague. Sin login: el token del QR es la única credencial. Instalable
  (manifest + service worker), sin offline de datos todavía (solo shell
  cacheado).

Los dos repos se despliegan y viven de forma independiente. **clutch-pwa NO
debe contener nada de backend**: ni carpeta `apps-script/`, ni `test/`. Solo
frontend estático.

URL de la PWA en producción: `https://adrianunthaiberica-spec.github.io/clutch-pwa/`
(GitHub Pages, activo).

## 1. Pasos: completados y pendientes

Orden de construcción acordado con el usuario, verificado paso a paso (cada
paso probado antes de pasar al siguiente; los pasos 1-5 además confirmados
contra el backend real desde un móvil).

- [x] **Paso 1** — Scaffold: estructura de ficheros, manifest, iconos, service
  worker mínimo, GitHub Pages activo.
- [x] **Paso 2** — i18n: es/pt, idioma fijado a `es` por ahora.
- [x] **Paso 3** — Capa de API (`js/api.js`): `consultarMaquina`,
  `registrarMedicion`, `generarIdMedicion`, timeout, traducción de errores.
  Verificado el `Content-Type: text/plain;charset=utf-8` contra tráfico real.
- [x] **Paso 4** — Pantalla 1 · Máquina (`js/pantalla-maquina.js`): número de
  serie + dos tarjetas (IZQUIERDA/DERECHA) con semáforo. Probado contra el
  backend real desde el móvil (SH12512).
- [x] **Paso 5** — Pantalla 2 · Aviso de seguridad
  (`js/pantalla-aviso-seguridad.js`): checkbox obligatorio + botón
  "Continuar" que nace deshabilitado.
- [x] **Paso 6** — Pantalla 3 · Medición (`js/pantalla-medicion.js`). Ambas
  posiciones en una sola pantalla; la posición `SIN_REGISTRAR` se muestra
  bloqueada con su explicación y nunca pide un valor; las posiciones
  medibles se pueden medir u omitir con una casilla. Teclado
  `inputmode="decimal"` (acepta coma o punto). Tres validaciones antes de
  guardar: un solo decimal, rango plausible (`datosMaquina.rango_medicion`
  del GET, con reserva amplia si no llega — ver §4), y una pantalla de
  confirmación explícita que muestra el valor tecleado junto al anterior.
  Horómetro y nombre de operario obligatorios; el operario se recuerda en
  `localStorage` entre mediciones. Cada posición enviada se guarda con una
  llamada POST independiente (una petición por posición); si alguna falla,
  la pantalla se queda con un estado de error por posición y un botón
  "Reintentar" que reenvía con los mismos ids (idempotente, seguro incluso
  si alguna posición ya se había guardado). Verificado con Playwright/mock
  local: 17 aserciones en 3 escenarios (flujo normal con edición y reintento
  de validación, posición bloqueada, fallo parcial de una posición).
- [x] **Paso 7** — Pantalla 4 · Resultado (`js/pantalla-resultado.js`). Se
  pinta justo después de guardar en la Pantalla 3: una tarjeta por cada
  posición que se acaba de medir de verdad (nunca por las omitidas ni por
  las bloqueadas — ahí no ha pasado nada nuevo). Cada tarjeta muestra el
  valor guardado, "Has perdido X mm de los Y mm de vida útil." (con
  `desgaste`/`medicion_inicial` que ya devuelve el POST) y un mensaje de
  estado según el color. El color viene de un GET fresco que `app.js` pide
  justo tras guardar (nunca se recalcula en el cliente, igual que en la
  Pantalla 1); si ese GET fallara, se pinta igual con un mensaje neutro
  ("Medición guardada.") en vez de bloquear — la medición ya está guardada
  de todos modos. El mensaje en rojo es una constatación de estado
  ("Estado: desgaste crítico."), sin verbos de mandato ni llamada a la
  acción — verificado explícitamente con una aserción que comprueba que el
  texto NO contiene "contacta/avisa/debes" ni similares: "la app informa, no
  da órdenes ni insiste" es literal, toda comunicación proactiva es cosa de
  UNTHA. Botón único "Continuar" que vuelve a la Pantalla 1 (ya con los
  datos frescos en caché, sin otro GET). Sustituye el aviso-banner temporal
  del Paso 6. Verificado con Playwright/mock local: 25 aserciones en 4
  escenarios (los 3 del Paso 6 más uno nuevo para el caso ROJO).
- [x] **Paso 8** — Identidad visual: tipografía Barlow. Autoalojada en
  `fonts/` (pesos 400/600/700, solo subconjunto "latin" — cubre es/pt), no
  un CDN externo: mismo criterio de "sin servicios externos" ya aplicado al
  generador de QR, y necesario para que el offline futuro no dependa de un
  tercero disponible. `font-display: swap` en los tres `@font-face`
  (`css/styles.css`) para que el texto se pinte YA con la pila de respaldo
  del sistema (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  sans-serif`) y se sustituya por Barlow solo si (y cuando) termina de
  cargar — nunca bloquea el renderizado, verificado forzando que la petición
  a la fuente cuelgue para siempre y comprobando que la pantalla se pinta
  igual en ~100 ms. `fonts/OFL.txt` incluida (licencia SIL Open Font
  License, obligatoria al redistribuir la fuente). No se ha añadido Barlow
  Condensed: no había un uso concreto que lo pidiera, se puede añadir más
  adelante igual (mismo mecanismo) si hace falta para algún título. Barlow
  Condensed queda mencionada en la documentación previa de esta sección
  únicamente como posibilidad, no como pendiente.
- [x] **Paso 9** — Pruebas end-to-end. Dos partes:
  1. **Suite automática contra el mock local** (fuera de este repo, ver §7):
     23 aserciones cubriendo las 4 pantallas, los 3 rechazos del teclado (dos
     decimales, fuera de rango, sustitución no declarada), un GET sin token
     y con token inválido, un fallo de red real con recuperación, cambio de
     idioma a mitad de flujo, idempotencia real (fallo de red tras confirmar
     + reintento con el mismo id, comprobando que solo escribe una vez), la
     posición `SIN_REGISTRAR` a través de las 3 pantallas que la tocan, y el
     registro/cacheado del service worker. Al construir esta suite salió un
     hallazgo real y no trivial sobre cómo probar localmente (ver §7,
     "mismo origen vs. service worker") — queda documentado ahí porque
     afecta a cómo hay que montar cualquier prueba futura de reintento/red,
     no solo a esta.
  2. **`PRUEBAS_MANUALES.md`** (raíz de este repo): checklist para que el
     usuario la ejecute en su móvil contra producción — mismo alcance que la
     suite automática (los 3 rechazos, idempotencia real con modo avión,
     idioma, instalación, shell sin conexión) más qué revisar después en
     `04_MEDICIONES`, `10_ESTADO_ACTUAL`, `90_LOG` y `03_CICLOS`, y un aviso
     de que las mediciones de prueba guardadas de verdad se pueden anular
     después desde el panel de UNTHA para no dejar el Sheet con datos falsos.
     Pendiente de que el usuario la ejecute — no se ha corrido contra
     producción todavía.

Con los 9 pasos completos, el alcance acordado para esta beta está construido
y probado (queda pendiente solo la ejecución manual de `PRUEBAS_MANUALES.md`
por el usuario). Lo que sigue a partir de aquí es fuera del alcance actual:
offline de datos, notificaciones push (v1.10), auto-detección de idioma por
país cuando el backend lo exponga, etc. — nada de eso está empezado.

**Pendiente de aclarar con el usuario, no bloqueante:** qué relación tiene el
repo `untha-sat-pwa` con este proyecto (¿plantilla de referencia de otro
proyecto UNTHA, o tarea independiente?). Se preguntó una vez y no se respondió
todavía. No tocar ese repo hasta que se aclare.

## 2. Reglas fijas para todo el trabajo (no negociables salvo que el usuario las cambie)

- Trabajar directamente sobre `main` en ambos repos. Sin ramas, sin pull
  requests.
- clutch-pwa = solo frontend. Nunca añadir `apps-script/` ni `test/` aquí.
- Al final de cada entrega, listar explícitamente qué ficheros van a
  clutch-pwa y cuáles a App-clutch (son dos repos distintos, el usuario copia
  los ficheros a mano).
- Nunca probar contra el backend real/producción de forma automática:
  siempre servidores mock locales para verificación. Solo el usuario prueba
  contra el backend real desplegado (lo ha hecho desde su móvil con éxito).
- Verificar cada paso con ejecución real (Playwright/Chromium contra mocks
  locales) antes de avanzar al siguiente, no solo revisión visual/de código.
- Confirmar arquitectura con el usuario antes de piezas grandes.
- **Sin servicios externos**: nada de CDN, API de terceros ni assets
  servidos fuera del propio dominio (aplicado ya al generador de QR y a la
  tipografía Barlow, §4). Necesario tanto por criterio del proyecto como
  para que el offline futuro no dependa de que un tercero esté disponible.

## 3. Contrato de la API — verificado contra `apps-script/Api.gs` (App-clutch), no de memoria

Backend Apps Script Web App. Detalle crítico: **siempre devuelve HTTP 200**;
éxito/fallo se distingue por el campo `ok` del JSON, nunca por el código HTTP.

### GET — estado de la máquina

```
GET {CLUTCH_API_BASE_URL}?t=<token>
```

- `t` (query param) = `qr_token` de la máquina escaneada.
- Si el token es inválido o la máquina no está activa: `{ ok:false, error:'ACCESO_DENEGADO', mensaje:'Token invalido o maquina no disponible.' }`.
- Éxito:
  ```json
  {
    "ok": true,
    "datos": {
      "num_serie": "SH12512",
      "posiciones": {
        "IZQUIERDA": {
          "estado_semaforo": "VERDE | AMBAR | ROJO | SIN_REGISTRAR",
          "ultima_medicion": 5.8,
          "fecha_ultima_medicion": "2026-01-15T10:30:00.000Z"
        },
        "DERECHA": { "...": "..." }
      },
      "rango_medicion": { "min": 1.0, "max": 6.5 }
    }
  }
  ```
  Si una posición no tiene ciclo activo: `estado_semaforo:'SIN_REGISTRAR'`,
  `ultima_medicion:''`, `fecha_ultima_medicion:''`.

  `rango_medicion` (añadido en el Paso 6, `construirEstadoMaquina_` en
  Api.gs): `{ min, max }` leídos de `MIN_MEDICION`/`MAX_MEDICION` en
  00_PARAMETROS vía `leerParametros()` (Parametros.gs) — el mismo mecanismo
  que ya usaba `validarCuerpoMedicion_` en el servidor. Existe para que la
  Pantalla 3 valide el rango plausible sin duplicar esos umbrales a mano en
  el cliente. Ya está en producción (redespliegue confirmado tras el Paso 6).

### POST — registrar medición

**CRÍTICO**: header `Content-Type: text/plain;charset=utf-8`, **NUNCA**
`application/json`. Apps Script no responde al preflight OPTIONS que dispara
`application/json` — con ese Content-Type la petición no llega nunca. El
servidor parsea el cuerpo como JSON independientemente del Content-Type
declarado, así que esto no le cambia nada a él; es puramente para esquivar el
preflight desde el navegador.

Cuerpo (JSON, mandado como texto plano):
```json
{
  "t": "<qr_token>",
  "id": "<uuid generado en el cliente>",
  "posicion": "IZQUIERDA | DERECHA",
  "valor": 5.7,
  "horometro": 1234,
  "operario": "Nombre",
  "medido_en": "2026-08-11T09:15:00.000Z"
}
```

Campos exactos que el servidor lee del body (`manejarRegistroMedicion_` en
Api.gs): `t`, `id`, `posicion`, `valor`, `horometro`, `operario`, `medido_en`.
Ojo: es `t`, no `qr_token`, para el POST también (igual que en el GET).

Validación del servidor (`validarCuerpoMedicion_`):
- `id`: string obligatorio.
- `posicion`: debe ser `IZQUIERDA` o `DERECHA`.
- `valor`: número, dentro de `MIN_MEDICION`–`MAX_MEDICION` (ver §5, no
  expuesto por la API), con un solo decimal.
- `horometro`: número ≥ 0.
- `operario`: string no vacío.
- `medido_en`: fecha válida.

Respuestas posibles:
- Token inválido/máquina inactiva → `{ ok:false, error:'ACCESO_DENEGADO', mensaje:'Token invalido o maquina no disponible.' }`
- Cuerpo no es JSON válido o falta → `{ ok:false, error:'CUERPO_INVALIDO', mensaje:'...' }`
- Falla alguna validación de campo → `{ ok:false, error:'DATOS_INVALIDOS', mensaje:'...' }`
- La posición no tiene ciclo activo → `{ ok:false, error:'POSICION_SIN_REGISTRAR', mensaje:'Esta posicion no tiene ningun embrague registrado. Contacta con UNTHA.' }`
- Medición rechazada por regla de negocio (p.ej. valor superior al anterior
  sin declarar sustitución) → `{ ok:false, error:'SUSTITUCION_NO_DECLARADA', mensaje:'Esta medicion es superior a la anterior. Si se ha sustituido el embrague, contacta con UNTHA para registrarlo.' }`
- Éxito:
  ```json
  {
    "ok": true,
    "datos": {
      "guardada": true,
      "motivo": "NUEVA",
      "medicion_inicial": 6.0,
      "desgaste": 0.3
    }
  }
  ```
  `motivo` puede ser `'NUEVA'`, `'YA_SINCRONIZADA'` (reenvío idempotente del
  mismo `id`, ver más abajo) u otro motivo de aceptación que devuelva
  `registrarMedicion` en el backend. `medicion_inicial` y `desgaste` son los
  que la Pantalla 4 (`js/pantalla-resultado.js`, Paso 7) muestra tal cual —
  nunca se recalculan en el cliente. El color (`estado_semaforo`) para esa
  misma pantalla NO viene de esta respuesta: sale de un GET fresco que pide
  `app.js` justo después de guardar (ver §4).
- Error interno inesperado (catch en `doGet`/`doPost`) → `{ ok:false, error:'ERROR_INTERNO', mensaje:'Error interno, intentalo de nuevo.' }`.

### Idempotencia por `id`

El `id` de una medición lo genera el cliente con `generarIdMedicion()`
(`js/api.js`), **una sola vez por intento de medición**, fuera de la función
`registrarMedicion()` (no en cada llamada). Si hay que reintentar tras un
fallo de red, hay que reenviar el **mismo** `id`: el servidor lo usa para
deduplicar y reconocer el reintento como el mismo intento, no como una
medición nueva. Cuando llegue el encolado offline (fuera de alcance de esta
versión), este mismo `id` es la pieza que lo hace seguro.

### `medido_en`

Se genera en el cliente (`new Date().toISOString()`), justo antes de enviar,
dentro de `registrarMedicion()` en `js/api.js`. Representa el instante de la
medición, no el de sincronización — la diferencia solo importará cuando haya
encolado offline (medir ahora, enviar más tarde), pero el campo ya se rellena
correctamente desde ahora para no tener que tocarlo entonces.

## 4. Decisiones de diseño y su motivo

- **Sin router de pantallas**: `js/app.js` usa una variable de estado simple
  (`pantallaActual`: `'maquina' | 'aviso-seguridad' | 'medicion-pendiente'`,
  se ampliará en los próximos pasos) y una función `pintarPantalla()` que
  decide qué renderizar. No hay librería de routing porque son 4 pantallas
  lineales, sin URLs propias que necesiten ser navegables/compartibles.
- **`ultimoEstadoMaquina` cacheado en memoria**: cambiar de idioma
  (`untha-clutch:idioma-cambiado`) repinta la pantalla actual sin disparar un
  nuevo GET a la API — el estado de la máquina no cambia por cambiar de
  idioma.
- **El semáforo nunca se recalcula en el cliente**: siempre se pinta lo que
  ya devuelve el backend (`estado_semaforo`, `desgaste`). Es la vista
  derivada `10_ESTADO_ACTUAL` en Sheets la que tiene la autoridad; duplicar
  la lógica de cálculo en la PWA sería una fuente de bugs de desincronización.
- **Colores de semáforo estándar, no teñidos de corporativo**: verde/ámbar/
  rojo/gris elegidos para reconocerse de un vistazo con mala luz y sin
  esfuerzo (contexto: planta industrial, guantes, iluminación pobre), no para
  combinar con la marca UNTHA. El teal/amarillo corporativos se usan para
  chrome de UI (cabecera, botones), nunca para el semáforo.
- **Botones grandes (`min-height: 64px`) y casilla de confirmación de toda la
  fila clicable**: pensado para tocarse con guantes, sin apuntar con
  precisión.
- **Aviso de seguridad como puerta real, no trámite**: el botón "Continuar"
  nace `disabled` y solo se habilita al marcar la casilla — no hay forma de
  saltárselo por accidente.
- **Botón "Nueva medición" deshabilitado solo si AMBAS posiciones están
  `SIN_REGISTRAR`** (`hayAlgunaPosicionMedible_` en
  `js/pantalla-maquina.js`): si al menos una posición es medible, se permite
  avanzar (la Pantalla 3 dará la opción de omitir la que no aplica).
  Confirmado con el usuario: no bloquear todo el flujo por una sola posición
  sin ciclo activo.
- **Idioma fijado a `'es'`** (`IDIOMA_POR_DEFECTO` en `js/i18n.js`): el beta
  es solo España. El backend no expone país todavía, así que la
  auto-detección por país (`establecerIdiomaPorPaisSiNoHayOverride`) está
  implementada pero sin usar — lista para cuando el GET añada ese campo. El
  selector manual ES/PT ya funciona y persiste en `localStorage`
  (`untha-clutch-idioma`).
- **`Content-Type: text/plain;charset=utf-8` en el POST**: ver §3, es la
  única forma de evitar el preflight OPTIONS que Apps Script no puede
  responder. Verificado contra tráfico real, no solo revisado en código.
- **Timeout de 20s en las peticiones** (`TIMEOUT_PETICION_MS` en
  `js/api.js`) vía `AbortController`: la PWA se usa en planta, con
  conectividad potencialmente mala; sin timeout, un fetch colgado deja al
  operario mirando un spinner indefinidamente.
- **`api.js` nunca deja escapar una excepción ni un código HTTP**: toda
  función pública devuelve siempre `{ ok:true, datos }` o
  `{ ok:false, error, mensaje }`, tanto si respondió el servidor como si
  falló la red (`ERROR_RED`). El resto de la PWA nunca necesita mirar el
  código HTTP (Apps Script siempre devuelve 200) ni distinguir "el servidor
  dijo que no" de "la petición no llegó".
- **Service worker cachea solo el shell estático**, nunca las llamadas a la
  API (mismo origen vs. cross-origin: el `fetch` handler deja pasar sin
  interceptar cualquier request a otro origen). No hay offline de datos en
  esta versión; el fichero es el punto de enganche para cuando se añada.
- **Iconos con fondo gris claro `#F2F2F2`** (no teal): el teal-sobre-teal
  tenía poco contraste; confirmado visualmente tras el cambio.
- **Barlow autoalojada (`fonts/`), no CDN de Google Fonts** (decisión
  explícita del usuario, Paso 8): mismo criterio "sin servicios externos" ya
  aplicado al generador de QR (§2), y necesario para que el offline futuro no
  dependa de que fonts.gstatic.com esté disponible. Coste asumido: ~84 KB de
  binarios (`.woff2`) versionados en el repo, más `fonts/OFL.txt` (SIL Open
  Font License — obligatoria al redistribuir la fuente). Los `.woff2` se
  obtuvieron pidiendo `https://fonts.googleapis.com/css2?family=Barlow:...`
  con un User-Agent moderno (para que el CSS que Google devuelve apunte a
  `.woff2`, no a `.ttf`) y descargando las URLs `fonts.gstatic.com` que trae
  ese CSS — es un paso único hecho a mano para obtener los ficheros; en
  tiempo de ejecución la PWA no contacta con Google en absoluto.
- **Solo el subconjunto "latin" de Barlow** (no "latin-ext" ni
  "vietnamese"): el rango `U+0000-00FF` (Latin-1 Supplement) ya cubre todos
  los caracteres de español y portugués (ñ, ã, ç, á, é, í, ó, ú, ü, etc.);
  pedir subconjuntos que nunca se van a pintar solo engordaría el repo sin
  motivo.
- **`font-display: swap`** en los tres `@font-face` (`css/styles.css`,
  pesos 400/600/700): el texto se pinta de inmediato con la pila de
  respaldo del sistema y se sustituye por Barlow solo si (y cuando) termina
  de cargar — nunca hay bloqueo de renderizado ni pantalla en blanco
  esperando la fuente, ni siquiera si la petición a `fonts/*.woff2` no
  responde nunca (verificado forzando exactamente ese caso con Playwright:
  la pantalla se pinta en ~100 ms igual). Ojo con una trampa relacionada:
  el `<link rel="preload">` del peso regular en `index.html` SÍ cuenta como
  recurso de la página para el evento `load` del navegador — si esa petición
  cuelga, `load` no llega nunca, pero eso no afecta ni al pintado ni a la
  interactividad (ver `DOMContentLoaded` vs `load` en las notas de prueba,
  §7); no usar `waitUntil: 'load'` de Playwright para probar este
  comportamiento por esa razón.
- **`rango_medicion` viene del servidor, nunca hardcodeado en el cliente**
  (decisión explícita del usuario para el Paso 6): MIN_MEDICION/MAX_MEDICION
  viven en 00_PARAMETROS precisamente para poder ajustarse sin tocar código;
  duplicarlos en la PWA habría creado el riesgo de que Sheet y app dijeran
  cosas distintas. Si el campo no llega (p. ej. backend todavía no
  redesplegado), la Pantalla 3 usa `RANGO_MEDICION_SEGURIDAD_` (0–50 mm) en
  `js/pantalla-medicion.js` y sigue funcionando sin bloquear: es un rango de
  reserva amplio, no una validación estricta — el servidor vuelve a validar
  el rango real de todos modos en `validarCuerpoMedicion_`.
- **Pantalla 3 llama a la API directamente** (a diferencia de Pantalla 1/2,
  que solo reciben datos ya cargados por `app.js`): mantener todo el flujo de
  validar → confirmar → guardar → reintentar autocontenido en un único
  fichero es más simple que repartirlo entre la pantalla y `app.js`. Recibe
  el `token` como parámetro para eso.
- **Una llamada POST por posición, no un endpoint de "guardar ambas"**: el
  contrato de Api.gs ya es por posición (§3), así que Pantalla 3 llama a
  `registrarMedicion` una vez por cada posición medida, secuencialmente.
  Los ids de medición se generan una vez al entrar en la pantalla de
  confirmación y se mantienen estables durante los reintentos (mismo
  "intento de medición"); si el operario vuelve a "editar", eso cuenta como
  un intento nuevo y se regeneran. Si guardar falla para alguna posición,
  reintentar reenvía TODAS las posiciones de ese intento con los mismos
  ids — las que ya se habían guardado vuelven con `motivo:'YA_SINCRONIZADA'`
  (idempotente, sin duplicar), así que no hace falta rastrear cuáles ya se
  guardaron.
- **Nombre de operario en `localStorage`** (`untha-clutch-operario`,
  gestionado directamente por `js/pantalla-medicion.js`, mismo patrón que
  `js/i18n.js` con el idioma): se recuerda entre mediciones en el mismo
  dispositivo para no reescribirlo cada vez, pero es solo una comodidad de
  UI — no se usa como identidad ni afecta a ninguna validación.
- **Tras guardar con éxito, la Pantalla 4 pide un GET fresco antes de
  pintarse** (`alGuardadoCompleto_` en `js/app.js`): el color mostrado tiene
  que ser el real de `10_ESTADO_ACTUAL`, no uno inferido en el cliente, así
  que hace falta un GET nuevo después del POST (la caché en memoria quedó
  desactualizada con el guardado). Ese mismo GET fresco se guarda como
  `ultimoEstadoMaquina`, así que al pulsar "Continuar" la Pantalla 1 no
  necesita pedir los datos otra vez. Si ese GET de refresco fallara, no se
  bloquea ni se reintenta ahí — la medición ya está guardada de verdad
  (confirmado por el POST); simplemente se pinta la Pantalla 4 sin el color
  exacto (mensaje neutro "Medición guardada.").
- **Pantalla 4 solo muestra las posiciones medidas en ESE registro**, nunca
  las que se omitieron o estaban bloqueadas: es el resultado de lo que
  acaba de pasar, no un resumen del estado completo de la máquina (eso ya
  lo hace la Pantalla 1, a la que se vuelve con "Continuar").
- **El texto de desgaste usa la redacción que ya dejó anotada `Api.gs`**
  ("Has perdido X mm de los Y mm de vida útil.", ver el comentario de
  `manejarRegistroMedicion_`): es la frase que el propio backend anticipó
  para esta pantalla al añadir `medicion_inicial`/`desgaste` a la respuesta
  del POST.
- **El mensaje en ROJO informa, no ordena ni insiste** (instrucción
  explícita del usuario para el Paso 7): "Estado: desgaste crítico." y
  nada más — sin "contacta con UNTHA", sin urgencia, sin llamada a la
  acción. Cualquier aviso proactivo (contactar, programar sustitución,
  notificaciones push) es responsabilidad de UNTHA, no de esta pantalla;
  verificado con una aserción automática que comprueba que el texto no
  contiene verbos de mandato.

## 5. Gaps abiertos

- **`untha-sat-pwa`**: relación con este proyecto sin aclarar (ver §1). Único
  gap abierto en este momento.

Resueltos (se dejan anotados por si hace falta el porqué más adelante):
- `MIN_MEDICION`/`MAX_MEDICION` ahora viajan en el GET como `rango_medicion`
  (Paso 6) y el backend real ya está redesplegado con ese cambio (confirmado
  por el usuario antes del Paso 7) — ver §3 y §4.
  `MIN_INICIAL_NUEVO`/`MAX_INICIAL_NUEVO` (5.5–6.2 mm) siguen sin exponerse,
  pero esos solo se usan al dar de alta un ciclo nuevo (panel de UNTHA), no
  en la PWA de campo — no hace falta exponerlos aquí.

## 6. Ficheros que componen la PWA (clutch-pwa, íntegro)

```
.nojekyll                          — necesario para que GitHub Pages sirva ficheros/carpetas con "_" sin tratarlos como Jekyll
config.js                          — CLUTCH_API_BASE_URL (única fuente de verdad de la URL del backend desplegado)
css/styles.css                     — estilos, @font-face de Barlow, variables de color (marca + semáforo), componentes de las pantallas 1-4
fonts/Barlow-Regular.woff2         — peso 400, autoalojada, solo subconjunto "latin"
fonts/Barlow-SemiBold.woff2        — peso 600, ídem
fonts/Barlow-Bold.woff2            — peso 700, ídem
fonts/OFL.txt                      — SIL Open Font License de Barlow (obligatoria al redistribuirla)
icons/apple-touch-icon.png
icons/icon-192.png
icons/icon-512.png
img/logo-untha.png                 — logo en la cabecera
index.html                         — shell HTML, preload del peso regular de Barlow, carga los scripts en orden de dependencia
js/api.js                          — capa de API: consultarMaquina, registrarMedicion, generarIdMedicion, timeout, traducción de errores
js/app.js                          — orquestación: registra el SW, monta cabecera, máquina de estados de pantallas, enrutado por token de la URL
js/i18n.js                         — diccionario es/pt, t(ruta), selector de idioma, override en localStorage
js/pantalla-aviso-seguridad.js     — Pantalla 2
js/pantalla-maquina.js             — Pantalla 1
js/pantalla-medicion.js            — Pantalla 3: formulario + validación + confirmación + guardado + reintento
js/pantalla-resultado.js           — Pantalla 4: desgaste, color y mensaje de estado por posición medida
manifest.json                      — Web App Manifest (nombre, iconos, colores, standalone)
scripts/generar_iconos.py          — script Pillow (uso puntual, no se ejecuta en producción) para regenerar los iconos desde el logo
sw.js                              — service worker: cachea shell estático + fuentes (untha-clutch-shell-v8), deja pasar llamadas cross-origin (API) sin interceptar
```

`index.html` carga los scripts en este orden estricto (cada uno depende de
los anteriores en tiempo de carga, no hay bundler):
`config.js` → `js/i18n.js` → `js/api.js` → `js/pantalla-maquina.js` →
`js/pantalla-aviso-seguridad.js` → `js/pantalla-medicion.js` →
`js/pantalla-resultado.js` → `js/app.js`. Tanto `js/pantalla-medicion.js`
como `js/pantalla-resultado.js` reutilizan funciones globales de
`js/pantalla-maquina.js` (`claveTituloPosicion_`, `formatearValorMedicion_`,
`formatearFecha_`, `CLASE_CSS_POR_SEMAFORO_`), por eso van después de ese
fichero. Con las 4 pantallas construidas y el Paso 9 completo, no se prevén
más ficheros de pantalla nuevos dentro del alcance actual; si se añadiera
alguno (o cualquier otro fichero del shell), recuerda añadirlo también a
`ARCHIVOS_APP_SHELL` en `sw.js` y subir el número de `CACHE_NAME` (v7→v8 al
añadir las fuentes en el Paso 8).

`PRUEBAS_MANUALES.md` (raíz del repo, junto a este fichero) no es parte de
la PWA — es la checklist de pruebas manuales del Paso 9 para ejecutar en el
móvil contra producción (ver §1 y §7). No se sirve ni se referencia desde
`index.html`.

## 7. Cómo probar sin tocar producción

Servidor mock local (Python, `http.server`) que sirve los ficheros estáticos
de `clutch-pwa` Y responde `GET/POST /exec` imitando el contrato de §3
(incluido `rango_medicion`); Playwright (Chromium) navegando contra
`http://127.0.0.1:<puerto>/index.html?t=...`.

**Sin tocar `config.js` del repo**: en vez de editar el fichero real y
revertirlo luego (frágil, fácil de olvidar), se intercepta la petición a
`config.js` con `page.route('**/config.js', route => route.fulfill({...}))`
y se le sirve un `CLUTCH_API_BASE_URL` apuntando al mock, solo dentro de esa
`page` de Playwright. El fichero del repo nunca se toca durante la prueba —
usado así en el Paso 6, mejor que el enfoque anterior de editar y revertir.

Notas del entorno de pruebas de esta sesión (confirmadas también en los
Pasos 6 y 7): usar `waitUntil: 'domcontentloaded'` o `'load'` en vez de
`'networkidle'`, lanzar un `browser` nuevo por escenario en vez de reutilizar
una página para varias navegaciones, y envolver la ejecución con `timeout`
de shell — `networkidle` combinado con navegaciones múltiples en la misma
página podía colgar el sandbox de este entorno de forma intermitente (no es
un bug de la aplicación). Playwright está disponible como paquete global de
Node (`NODE_PATH=/opt/node22/lib/node_modules node script.js`), no como
dependencia del repo. El mock en Python a veces deja el puerto ocupado tras
un `pkill` (el proceso ya no aparece en `ps` pero el socket tarda en
liberarse); si el arranque falla con "Address already in use", más simple
lanzar el mock en otro puerto que pelear con el anterior.

**Probar que una fuente no bloquea el renderizado** (Paso 8): usar
`page.route('**/fonts/*.woff2', () => new Promise(() => {}))` para que la
petición a la fuente cuelgue para siempre, y comprobar que el contenido
real sigue apareciendo enseguida. Importante: para esa prueba usar
`waitUntil: 'domcontentloaded'` en `page.goto`, NUNCA `'load'` — el
`<link rel="preload">` de la fuente cuenta como recurso de la página para
el evento `load` del navegador, así que si esa petición nunca responde,
`load` tampoco llega nunca (aunque la página esté perfectamente pintada e
interactiva). Es un comportamiento real del navegador, no un fallo de la
prueba ni de la app. Para confirmar que NO se llama a ningún CDN externo,
escuchar `page.on('request', ...)` y comprobar que todas las peticiones son
al propio origen del mock.

**Mismo origen vs. service worker — hallazgo del Paso 9, importante para
cualquier prueba futura de red/reintentos**: si el mock sirve los ficheros
estáticos Y la API en el MISMO puerto/origen, `sw.js` los trata como
"mismo origen" y los intercepta él mismo con su `fetch` cache-first —
DENTRO del contexto de ejecución del service worker, no de la página. Un
`page.route()` de Playwright no ve esas peticiones: se pierden antes de
llegar a la página. Así fallaba en silencio (sin que la ruta interceptada
saltara nunca) la primera versión de la prueba de idempotencia de este
paso. La condición real en `sw.js` es `url.origin !== self.location.origin`
(dejar pasar solo lo cross-origin); en producción esto nunca pasa porque la
API vive en `script.google.com` y la PWA en GitHub Pages — orígenes ya
distintos de por sí. Para que el mock lo reproduzca fielmente, hay que
servir la API en un puerto DISTINTO al de los ficheros estáticos (dos
procesos del mismo `mock_server.py`, cada uno con su propio puerto) y
apuntar `CLUTCH_API_BASE_URL` al de la API. Cualquier prueba que intercepte
o corte peticiones de red (fallos, reintentos, idempotencia) necesita este
montaje de dos orígenes; las que solo leen (Pantallas 1/2 sin guardar)
funcionan igual con uno solo.

Otra nota del Paso 9: evitar un segundo `page.goto()` sobre la MISMA `page`
para "reiniciar" un escenario a mitad de camino — es más fiable inspeccionar
la Pantalla 1 nada más cargar y luego seguir interactuando sobre la misma
carga (clicks) que navegar dos veces seguidas en una sola `page` (inestable
en este sandbox, coherente con la nota ya existente sobre `networkidle`).

El usuario ha probado el backend real desplegado desde su móvil hasta el
Paso 6 inclusive (medición registrada, validaciones, `10_ESTADO_ACTUAL`
regenerado solo) y la tipografía Barlow del Paso 8 ("se ve correctamente").
La Pantalla 4 (Paso 7) todavía no se ha confirmado específicamente contra
producción desde el teléfono — queda cubierta por `PRUEBAS_MANUALES.md`
(§1, Paso 9), pendiente de que el usuario la ejecute.
