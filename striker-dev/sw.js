const V = "striker-v2.0";
const CORE = ["./", "./index.html", "./favicon.svg", "./manifest.webmanifest"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  e.respondWith(
    fetch(r)
      .then((n) => { const cp = n.clone(); caches.open(V).then((c) => c.put(r, cp)); return n; })
      .catch(() => caches.match(r).then((m) => m || caches.match("./index.html")))
  );
});
