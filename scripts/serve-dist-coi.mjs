// Local cross-origin-isolated static server for the production build.
// Mirrors the public/_headers policy (COOP same-origin + COEP credentialless)
// so you can test the multi-threaded wasm codecs against `dist/` locally —
// `astro preview` does NOT apply _headers, so threaded mode can't be tested there.
//
//   bun run build && node scripts/serve-dist-coi.mjs   (serves on :4321)
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.env.PORT) || 4321;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

createServer(async (req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Origin-Agent-Cluster", "?1");

  let pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname
  );
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  let file = join(root, pathname);
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) {
    file = join(file, "index.html");
    info = await stat(file).catch(() => null);
  }
  if (!info) {
    // Try directory-style route (e.g. /about -> /about/index.html)
    file = join(root, pathname, "index.html");
    info = await stat(file).catch(() => null);
  }
  if (!info) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  res.setHeader(
    "Content-Type",
    mime[extname(file)] ?? "application/octet-stream"
  );
  res.end(await readFile(file));
}).listen(port, () => {
  process.stdout.write(`COI static server: http://localhost:${port}\n`);
});
