const CACHE_NAME = 'kamera-tercumani-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

// Kurulum: temel varlıkları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Etkinleştirme: eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Getirme: önbellek öncelikli, ağ yedekli
self.addEventListener('fetch', (event) => {
  // Çeviri API isteklerini önbelleğe alma
  const url = event.request.url;
  if (
    url.includes('api.mymemory.translated.net') ||
    url.includes('/api/v1/') // Lingva uç noktaları
  ) {
    return; // doğrudan ağa bırak
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Sadece başarılı GET yanıtlarını önbelleğe al
          if (event.request.method === 'GET' && response.status === 200) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          }
          return response;
        })
      );
    }).catch(() => {
      // Çevrimdışı ve önbellekte yoksa
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return new Response('Çevrimdışısınız, bu kaynak mevcut değil.', {
        status: 503
      });
    })
  );
});