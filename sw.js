// 手機盤點小工具 v2 — 離線快取：先走網路（拿最新版），斷線時改用快取。
var CACHE = 'phone-inventory-v2';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./', './index.html']); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  // 清掉舊版（v1）快取；盤點資料在 localStorage，不受影響
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k.indexOf('phone-inventory-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (res) {
    if (res && res.ok && new URL(e.request.url).origin === location.origin) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); });
  }));
});
