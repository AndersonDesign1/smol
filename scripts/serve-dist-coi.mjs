// Local cross-origin-isolated static server for the production build.
// Mirrors the public/_headers policy (COOP same-origin + COEP credentialless)
// so you can test the multi-threaded wasm codecs against `dist/` locally —
// `astro preview` does NOT apply _headers, so threaded mode can't be tested there.
//
//   bun run build && node scripts/serve-dist-coi.mjs   (serves on :4321)
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
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

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname
    );
  } catch {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  // Resolve within root and reject any path traversal (e.g. ../).
  let file = resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(root + sep)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) {
    file = resolve(file, "index.html");
    info = await stat(file).catch(() => null);
  } else if (!info) {
    // Try directory-style route (e.g. /about -> /about/index.html)
    const indexFile = resolve(file, "index.html");
    info = await stat(indexFile).catch(() => null);
    if (info) {
      file = indexFile;
    }
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
