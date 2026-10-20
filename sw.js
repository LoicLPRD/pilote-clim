// Cache de l'interface uniquement. Les appels au serveur ne sont jamais mis en cache.
var CACHE = "pilote-clim-v16";
var SHELL = ["./", "index.html", "app.js", "split.js", "prog.js", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png"];

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
  // Reseau d'abord (mises a jour immediates), cache en secours hors ligne ou si le reseau tarde plus de 4 s.
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    function fallback() {
      caches.match(req, { ignoreSearch: true }).then(function (r) {
        if (done) return;
        if (r) { done = true; resolve(r); }
      });
    }
    var t = setTimeout(fallback, 4000);
    fetch(req).then(function (res) {
      clearTimeout(t);
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(t);
      caches.match(req, { ignoreSearch: true }).then(function (r) {
        if (done) return; done = true;
        resolve(r || (req.mode === "navigate" ? caches.match("index.html") : new Response("", { status: 504 })));
      });
    });
  }));
});
