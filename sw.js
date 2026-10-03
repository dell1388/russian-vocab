// Offline cache: stale-while-revalidate for same-origin assets.
const CACHE = 'transsib-v1';
const CORE = ['./', 'index.html', 'css/style.css', 'data/words.json', 'data/sentences.json', 'manifest.webmanifest', 'icons/icon.svg',
  'js/main.js', 'js/game.js', 'js/combat.js', 'js/run.js', 'js/map.js', 'js/data.js', 'js/text.js', 'js/srs.js', 'js/rng.js',
  'js/save.js', 'js/progress.js', 'js/questions.js', 'js/minigames.js', 'js/audio.js', 'js/art.js', 'js/ui.js', 'js/kbd.js',
  'js/content/route.js', 'js/content/enemies.js', 'js/content/characters.js', 'js/content/relics.js', 'js/content/consumables.js',
  'js/content/events.js', 'js/content/upgrades.js', 'js/content/achievements.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(req);
    const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
