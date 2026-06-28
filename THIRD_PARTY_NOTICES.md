# Third-Party Notices

Smol includes third-party software. This file highlights the packages directly introduced for lossy PNG compression and browser-side WASM loading.

## imagequant

- Package: `imagequant`
- Version: `0.1.2`
- License: `GPL v3`
- Repository: <https://github.com/valterkraemer/imagequant-wasm>

`imagequant` provides JavaScript/WASM bindings around `libimagequant` for lossy PNG quantization in the browser.

## libimagequant

- Project: `libimagequant`
- Upstream: <https://github.com/ImageOptim/libimagequant>
- Licensing info: <https://pngquant.org/licensing.html>

`libimagequant` is the upstream quantization library used by the `imagequant` WASM bindings.

## vite-plugin-wasm

- Package: `vite-plugin-wasm`
- Version: `3.6.0`
- License: `MIT`
- Repository: <https://github.com/Menci/vite-plugin-wasm>

`vite-plugin-wasm` is used so Astro/Vite can bundle the `imagequant` WebAssembly module in both the main app and the compression worker.
