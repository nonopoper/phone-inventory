// 手機盤點小工具 v3 — 離線快取。
// 網頁本身（index.html 等）：先走網路（拿最新版），斷線時改用快取。
// 辨識引擎 ocr/（約 7MB）：快取優先 —— 第一次按「拍照辨識」下載後存起來，之後重開或斷網都直接用快取，不重複下載。
var CACHE = 'phone-inventory-v3';
var OCR_CACHE = 'phone-inventory-ocr-tesseract-7.0.0'; // 引擎版本不變就保留，網頁改版不會連引擎一起重抓
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./', './index.html']); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  // 清掉舊版（v1／v2）網頁快取；盤點資料在 localStorage，不受影響
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k !== OCR_CACHE && k.indexOf('phone-inventory-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function isOcrAsset(url) { return url.origin === location.origin && url.pathname.indexOf('/ocr/') >= 0; }
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (isOcrAsset(url)) {
    e.respondWith(caches.open(OCR_CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
        return hit || fetch(e.request).then(function (res) {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        });
      });
    }));
    return;
  }
  e.respondWith(fetch(e.request).then(function (res) {
    if (res && res.ok && url.origin === location.origin) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); });
  }));
});
