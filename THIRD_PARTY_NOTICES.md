# Third-Party Notices

Smol includes third-party software. This file highlights the packages directly introduced for lossy PNG compression and browser-side WASM loading.

## libimagequant-wasm

- Package: `libimagequant-wasm`
- Version: `0.3.0`
- License: `MIT` (bindings)
- Repository: <https://github.com/akshetpandey/libimagequant-wasm>

`libimagequant-wasm` provides JavaScript/WASM bindings around `libimagequant` for lossy PNG quantization in the browser. It passes RGBA data by reference rather than copying whole images into WASM linear memory, so it quantizes large full-page screenshots reliably.

## libimagequant

- Project: `libimagequant`
- Upstream: <https://github.com/ImageOptim/libimagequant>
- Licensing info: <https://pngquant.org/licensing.html>

`libimagequant` is the upstream quantization library wrapped by `libimagequant-wasm`.

## vite-plugin-wasm

- Package: `vite-plugin-wasm`
- Version: `3.6.0`
- License: `MIT`
- Repository: <https://github.com/Menci/vite-plugin-wasm>

`vite-plugin-wasm` is used so Astro/Vite can bundle the WebAssembly image codecs in both the main app and the compression worker.
