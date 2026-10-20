// Cache de l'interface uniquement. Les appels au serveur ne sont jamais mis en cache.
var CACHE = "pilote-clim-v7";
var SHELL = ["./", "index.html", "app.js", "split.js", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Reseau d'abord (mises a jour immediates), cache en secours hors ligne.
  e.respondWith(fetch(req).then(function (res) {
    var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
  }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match("index.html"); }); }));
});
