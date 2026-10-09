// Service worker: carga instantánea y uso sin datos después de la primera visita.
// Sube el número de versión solo si cambias archivos de /vendor o /fonts.
const V = 'checklist-v1';
const CORE = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  './fonts/barlow-700.woff2', './fonts/barlow-condensed-800.woff2',
  './vendor/html2canvas.min.js', './vendor/jspdf.umd.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// Responde desde el caché al instante y actualiza en segundo plano (se ve en la siguiente apertura).
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Sin conexión', { status: 503 });
  }));
});
