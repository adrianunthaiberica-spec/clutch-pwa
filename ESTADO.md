# ESTADO.md — UNTHA CLUTCH PWA (clutch-pwa)

Documento de traspaso. Escrito para que alguien sin contexto previo pueda
continuar el trabajo leyendo solo esto (más el código). Última actualización:
2026-08-11, tras completar el Paso 6 (Pantalla 3 · Medición).

**IMPORTANTE — pendiente de acción manual del usuario:** este paso modificó
`apps-script/Api.gs` en **App-clutch** (añade `rango_medicion` al GET). Hay
que recopiar `Api.gs` al editor de Apps Script y **redesplegar la Web App**
para que el cambio esté en producción. Hasta que eso ocurra, el backend real
sigue respondiendo sin `rango_medicion` — la PWA lo tolera (ver §4, rango de
seguridad de reserva), pero la Pantalla 3 no podrá validar contra los límites
reales de 00_PARAMETROS hasta el redespliegue.

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
- [ ] **Paso 7** — Pantalla 4 · Resultado. Muestra el desgaste calculado y el
  color resultante por posición, usando `medicion_inicial` y `desgaste` que ya
  devuelve el POST (ver §3). Si el resultado es rojo, mensaje de estado claro
  pero no alarmista — "la app informa, no da órdenes" (spec).
- [ ] **Paso 8** — Identidad visual definitiva: cargar Barlow / Barlow
  Condensed (ahora mismo `--fuente-base` en `css/styles.css` es sans-serif del
  sistema, placeholder deliberado para no depender de red hasta este paso).
- [ ] **Paso 9** — Pruebas end-to-end.

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
  el cliente. **Requiere redesplegar la Web App** (ver aviso al principio de
  este documento) — hasta entonces el backend real no lo devuelve todavía.

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
  `motivo` puede ser `'NUEVA'` u otro motivo de aceptación que devuelva
  `registrarMedicion` en el backend (p.ej. reenvío idempotente del mismo
  `id`). `medicion_inicial` y `desgaste` son los que la Pantalla 4 (Paso 7)
  debe mostrar — no recalcular nada en el cliente.
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
- **Tipografía Barlow diferida al Paso 8**: de momento sans-serif del
  sistema, para no depender de red (Google Fonts u otro CDN) hasta que se
  aborde la identidad visual definitiva de forma explícita.
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
- **Tras guardar con éxito, vuelve a la Pantalla 1 con un aviso, no a una
  Pantalla de Resultado**: la Pantalla 4 (Resultado, con colores y desgaste
  calculado) es el Paso 7, todavía no construida. De momento, `app.js`
  fuerza un GET nuevo (no reutiliza la caché en memoria, que ya está
  desactualizada) y muestra un aviso de "Medición guardada correctamente."
  una sola vez sobre la Pantalla 1 ya actualizada. Es un cierre de bucle
  mínimo y honesto (no inventa una pantalla de resultado a medias) que
  Paso 7 sustituirá.

## 5. Gaps abiertos

- **`untha-sat-pwa`**: relación con este proyecto sin aclarar (ver §1).
- **Redespliegue pendiente de Api.gs** (ver aviso al principio del
  documento): hasta que el usuario recopie `Api.gs` en el editor de Apps
  Script y redespliegue la Web App, el backend real no devuelve
  `rango_medicion`. La PWA ya tolera su ausencia (rango de reserva, §4), así
  que no bloquea el uso — pero la validación de rango en producción seguirá
  siendo la de reserva (0–50 mm) hasta entonces, no la real (1.0–6.5 mm).
- Resuelto en el Paso 6 (ya no es un gap): `MIN_MEDICION`/`MAX_MEDICION`
  ahora viajan en el GET como `rango_medicion` — ver §3 y §4.
  `MIN_INICIAL_NUEVO`/`MAX_INICIAL_NUEVO` (5.5–6.2 mm) siguen sin exponerse,
  pero esos solo se usan al dar de alta un ciclo nuevo (panel de UNTHA), no
  en la PWA de campo — no hace falta exponerlos aquí.

## 6. Ficheros que componen la PWA (clutch-pwa, íntegro)

```
.nojekyll                          — necesario para que GitHub Pages sirva ficheros/carpetas con "_" sin tratarlos como Jekyll
config.js                          — CLUTCH_API_BASE_URL (única fuente de verdad de la URL del backend desplegado)
css/styles.css                     — estilos, variables de color (marca + semáforo), componentes de las pantallas 1-3
icons/apple-touch-icon.png
icons/icon-192.png
icons/icon-512.png
img/logo-untha.png                 — logo en la cabecera
index.html                         — shell HTML, carga los scripts en orden de dependencia
js/api.js                          — capa de API: consultarMaquina, registrarMedicion, generarIdMedicion, timeout, traducción de errores
js/app.js                          — orquestación: registra el SW, monta cabecera, máquina de estados de pantallas, enrutado por token de la URL
js/i18n.js                         — diccionario es/pt, t(ruta), selector de idioma, override en localStorage
js/pantalla-aviso-seguridad.js     — Pantalla 2
js/pantalla-maquina.js             — Pantalla 1
js/pantalla-medicion.js            — Pantalla 3: formulario + validación + confirmación + guardado + reintento
manifest.json                      — Web App Manifest (nombre, iconos, colores, standalone)
scripts/generar_iconos.py          — script Pillow (uso puntual, no se ejecuta en producción) para regenerar los iconos desde el logo
sw.js                              — service worker: cachea shell estático (untha-clutch-shell-v6), deja pasar llamadas cross-origin (API) sin interceptar
```

`index.html` carga los scripts en este orden estricto (cada uno depende de
los anteriores en tiempo de carga, no hay bundler):
`config.js` → `js/i18n.js` → `js/api.js` → `js/pantalla-maquina.js` →
`js/pantalla-aviso-seguridad.js` → `js/pantalla-medicion.js` → `js/app.js`.
`js/pantalla-medicion.js` reutiliza funciones globales de
`js/pantalla-maquina.js` (`claveTituloPosicion_`, `formatearValorMedicion_`,
`formatearFecha_`), por eso va después de ese fichero. Al añadir
`js/pantalla-resultado.js` (Paso 7), insertarlo en `index.html` antes de
`js/app.js` y añadirlo también a `ARCHIVOS_APP_SHELL` en `sw.js` (si no,
queda sin cachear para el modo instalado; recuerda subir el número de
`CACHE_NAME` cuando cambie la lista, igual que se hizo v5→v6 en este paso).

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

Notas del entorno de pruebas de esta sesión (confirmadas también en el Paso
6): usar `waitUntil: 'domcontentloaded'` o `'load'` en vez de `'networkidle'`,
lanzar un `browser` nuevo por escenario en vez de reutilizar una página para
varias navegaciones, y envolver la ejecución con `timeout` de shell —
`networkidle` combinado con navegaciones múltiples en la misma página podía
colgar el sandbox de este entorno de forma intermitente (no es un bug de la
aplicación). Playwright está disponible como paquete global de Node
(`NODE_PATH=/opt/node22/lib/node_modules node script.js`), no como
dependencia del repo.

Solo el usuario prueba contra el backend real desplegado (ya lo ha hecho con
éxito desde su móvil, con la máquina SH12512, hasta el Paso 5).
