import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const assets = (await readdir("dist/assets")).map((f) => "/assets/" + f);
const files = [
  "/",
  "/index.html",
  "/logo.png",
  "/manifest.webmanifest",
  ...(await readdir("dist/icons")).map((f) => "/icons/" + f),
  ...assets,
];
const version = createHash("sha256")
  .update(await readFile("dist/index.html"))
  .update(files.join(","))
  .digest("hex")
  .slice(0, 16);
await writeFile(
  "dist/sw.js",
  `// Cache the public application shell only. Private Supabase requests never enter this cache.
const CACHE='pda-shell-${version}';
const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pda-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('Authorization'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;}
 if(FILES.includes(url.pathname))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
`,
);
