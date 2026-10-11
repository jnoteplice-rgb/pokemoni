// Jednoduchý service worker: appka funguje i offline (data ze Supabase/TCGdex se cachují v localStorage).
const C = 'pokemoni-v4.7';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin) {
    // network-first pro vlastní soubory (aby se aktualizace projevily), fallback cache
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
  } else if (u.hostname === 'assets.tcgdex.net' || u.hostname === 'images.pokemontcg.io' || u.hostname === 'tcgplayer-cdn.tcgplayer.com') {
    // obrázky karet: cache-first
    // ukládej jen úspěšné odpovědi; pokemontcg.io vrací při 404 obrázek rubu karty -> proměnit na chybu, aby zafungoval další fallback
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (!res.ok) return Response.error(); const cp = res.clone(); caches.open(C + '-img').then(c => c.put(e.request, cp)); return res; })));
  }
});
