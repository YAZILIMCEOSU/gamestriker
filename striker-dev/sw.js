const V = "striker-v3.109";
self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.map((x) => caches.delete(x))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((cs) => Promise.all(cs.map((c) => (c.navigate ? c.navigate(c.url) : null))))
  );
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  if (r.mode === "navigate" || (r.headers.get("accept") || "").includes("text/html")) return;
  e.respondWith(fetch(r).catch(() => caches.match(r)));
});
