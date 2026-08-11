# ESTADO.md — UNTHA CLUTCH PWA (clutch-pwa)

Documento de traspaso. Escrito para que alguien sin contexto previo pueda
continuar el trabajo leyendo solo esto (más el código). Última actualización:
2026-08-11, tras completar el Paso 5 (Pantalla 2 · Aviso de seguridad).

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
- [ ] **Paso 6** — Pantalla 3 · Medición. Ambas posiciones en una sola
  pantalla, opción de omitir una posición, teclado numérico decimal nativo
  (`inputmode="decimal"`), tres validaciones (un decimal, rango plausible,
  diálogo de confirmación mostrando valor tecleado vs. anterior), horómetro
  obligatorio, nombre de operario recordado en el dispositivo entre
  mediciones. **Ver §5 "Gaps abiertos" — rango plausible sin fuente
  autoritativa expuesta por la API.**
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
      }
    }
  }
  ```
  Si una posición no tiene ciclo activo: `estado_semaforo:'SIN_REGISTRAR'`,
  `ultima_medicion:''`, `fecha_ultima_medicion:''`.

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

## 5. Gaps abiertos (a resolver antes o durante el Paso 6)

- **`MIN_MEDICION`/`MAX_MEDICION` (1.0–6.5 mm) y
  `MIN_INICIAL_NUEVO`/`MAX_INICIAL_NUEVO` (5.5–6.2 mm) viven en
  `00_PARAMETROS` (backend, `apps-script/Setup.gs`) pero NO están expuestos
  por ningún endpoint de la API.** La Pantalla 3 necesita algún rango
  plausible para su validación "rango plausible" (una de las tres
  validaciones del paso), y ahora mismo no hay forma de obtenerlo
  dinámicamente del backend. Opciones a decidir con el usuario: (a)
  hardcodear los valores en el cliente (riesgo: desincronización si cambian
  en Sheets sin tocar la PWA), o (b) añadir estos parámetros a la respuesta
  del GET en Api.gs (requiere tocar App-clutch y redesplegar). Preguntarlo
  antes de construir la validación de rango del Paso 6.
- **`untha-sat-pwa`**: relación con este proyecto sin aclarar (ver §1).

## 6. Ficheros que componen la PWA (clutch-pwa, íntegro)

```
.nojekyll                          — necesario para que GitHub Pages sirva ficheros/carpetas con "_" sin tratarlos como Jekyll
config.js                          — CLUTCH_API_BASE_URL (única fuente de verdad de la URL del backend desplegado)
css/styles.css                     — estilos, variables de color (marca + semáforo), componentes de las pantallas 1 y 2
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
manifest.json                      — Web App Manifest (nombre, iconos, colores, standalone)
scripts/generar_iconos.py          — script Pillow (uso puntual, no se ejecuta en producción) para regenerar los iconos desde el logo
sw.js                              — service worker: cachea shell estático (untha-clutch-shell-v5), deja pasar llamadas cross-origin (API) sin interceptar
```

`index.html` carga los scripts en este orden estricto (cada uno depende de
los anteriores en tiempo de carga, no hay bundler):
`config.js` → `js/i18n.js` → `js/api.js` → `js/pantalla-maquina.js` →
`js/pantalla-aviso-seguridad.js` → `js/app.js`. Al añadir
`js/pantalla-medicion.js` (Paso 6) y `js/pantalla-resultado.js` (Paso 7),
insertarlos en `index.html` antes de `js/app.js` y añadirlos también a
`ARCHIVOS_APP_SHELL` en `sw.js` (si no, quedan sin cachear para el modo
instalado).

## 7. Cómo probar sin tocar producción

Servidor mock local en Python/Node que responda `GET ?t=...` y
`POST` imitando el contrato de §3, servido en un puerto local; Playwright
(Chromium) navegando contra `http://localhost:<puerto>/index.html` con
`config.js` apuntando al mock en vez de a `CLUTCH_API_BASE_URL` real durante
la prueba (revertir antes de commitear). Notas del entorno de pruebas de esta
sesión: usar `waitUntil: 'domcontentloaded'` o `'load'` en vez de
`'networkidle'`, lanzar un `browser` nuevo por escenario en vez de reutilizar
una página para varias navegaciones, y envolver la ejecución con `timeout`
de shell — `networkidle` combinado con navegaciones múltiples en la misma
página colgaba el sandbox de este entorno de forma intermitente (no es un
bug de la aplicación).

Solo el usuario prueba contra el backend real desplegado (ya lo ha hecho con
éxito desde su móvil, con la máquina SH12512).
