import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();

  // credentialless (not require-corp) keeps the page cross-origin isolated — so
  // SharedArrayBuffer is available and the wasm codecs run multi-threaded — while
  // still allowing cross-origin subresources (Google Fonts, Iconify) to load.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Origin-Agent-Cluster", "?1");

  return response;
});
