const V = "striker-v3.140";
self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.map((x) => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  if (r.mode === "navigate" || (r.headers.get("accept") || "").includes("text/html")) return;
  e.respondWith(fetch(r).catch(() => caches.match(r)));
});
