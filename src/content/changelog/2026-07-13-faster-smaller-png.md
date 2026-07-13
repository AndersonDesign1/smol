---
version: "v0.6.0"
date: "2026-07-13"
summary: "Faster, smaller PNGs that hold up on large screenshots"
---

- Switched lossy PNG quantization to `libimagequant-wasm`, which reliably compresses large full-page screenshots that used to fall back to a slower lossless export.
- Made near-lossless `Smart PNG` the default for PNG files: same format and transparency, typically 75–90% smaller, with WebP still offered when it wins.
- Roughly halved PNG compression time — about 2× faster on typical screenshots — by tuning oxipng to its fast, high-value effort level, so PNG keeps pace with WebP, JPEG, and AVIF.
- The WebP alternative now appears once the PNG result is ready, instead of competing for attention while it is still working.
- Renamed `Compressed PNG` to `Smart PNG` across presets and settings.
