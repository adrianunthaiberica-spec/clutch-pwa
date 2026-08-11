'use strict';

// UNTHA CLUTCH — service worker mínimo: solo cachea el shell estático de la app
// (HTML/CSS/JS/manifest), para que cargue rápido y sea instalable. Los datos de la
// máquina (fetch a la API) van SIEMPRE a red, nunca a caché — no hay offline de datos
// todavía. Este fichero es el punto de enganche para cuando se añada.

const CACHE_NAME = 'untha-clutch-shell-v3';
const ARCHIVOS_APP_SHELL = [
  './',
  './index.html',
  './config.js',
  './js/i18n.js',
  './js/api.js',
  './js/app.js',
  './css/styles.css',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // deja pasar las llamadas a la API del backend

  event.respondWith(caches.match(event.request).then((respuestaCache) => respuestaCache || fetch(event.request)));
});
