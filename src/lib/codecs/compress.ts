// Emitted as a fingerprinted asset URL by Vite; the actual wasm is fetched lazily
// in loadQuantizer(), so this import stays cheap (just a string).
import quantizerWasmUrl from "libimagequant-wasm/wasm/libimagequant_wasm_bg.wasm?url";
import type {
  CompressionSettings,
  CompressionStrategy,
  OutputFormat,
} from "../utils/types";

// oxipng optimization effort (0-6). Squoosh's default is 2 — "quite fast, good
// compression" — and effort above 4 hits steep diminishing returns. Keeping
// lossless optimization at 2 puts PNG speed on par with the lossy encoders
// (WebP/AVIF/JPEG) instead of paying 2-4x the CPU for a single-digit % gain.
const LOSSLESS_LEVEL = 2;

// After palette quantization the PNG is already small, so the DEFLATE search has
// little left to find. A light pass keeps quantized ("Smart PNG") output fast.
const POST_QUANTIZE_LEVEL = 2;

// libimagequant speed/quality trade-off: 1 (brute force) … 10 (fastest). We use
// 5 for a fast, near-lossless result — the balance TinyPNG-class tools strike.
const IMAGEQUANT_SPEED = 5;

// Full Floyd–Steinberg dithering (pngquant's default) keeps gradients smooth
// after the palette is reduced.
const QUANTIZE_DITHERING = 1.0;

function optimiseOptions(level: number) {
  return { interlace: false, level, optimiseAlpha: true } as const;
}

// libimagequant aborts with an error if it can't reach the *minimum* quality,
// which on color-rich images (screenshots, photos) happens constantly and forces
// a slow fallback to lossless. So the minimum stays 0 — best effort, never
// aborts — and `quality` is the target it aims for while capping at `pngColors`.
// The compare view + WebP candidate cover the rare case where the result looks
// off, so we always want a real (fast) quantized result rather than a bail-out.
const QUANTIZE_MIN_QUALITY = 0;

// libimagequant-wasm (maintained libimagequant build). Unlike the old `imagequant`
// package, it passes RGBA by reference and doesn't copy the whole image into wasm
// linear memory up front, so it survives large full-page screenshots that made
// the previous library return a null pointer. Init runs once and is cached.
type QuantizerModule = typeof import("libimagequant-wasm/wasm/libimagequant_wasm.js");
let quantizerReady: Promise<QuantizerModule> | undefined;

function loadQuantizer(): Promise<QuantizerModule> {
  if (!quantizerReady) {
    quantizerReady = (async () => {
      const mod = await import("libimagequant-wasm/wasm/libimagequant_wasm.js");
      await mod.default({ module_or_path: quantizerWasmUrl });
      return mod;
    })();
  }
  return quantizerReady;
}

async function encodeToPng(imageData: ImageData): Promise<ArrayBuffer> {
  const { encode } = await import("@jsquash/png");
  return encode(imageData);
}

async function quantizePng(
  imageData: ImageData,
  quality: number,
  colors: number
): Promise<ArrayBuffer> {
  const { ImageQuantizer, encode_palette_to_png } = await loadQuantizer();
  const { data, width, height } = imageData;

  const quantizer = new ImageQuantizer();
  try {
    quantizer.setSpeed(IMAGEQUANT_SPEED);
    quantizer.setQuality(QUANTIZE_MIN_QUALITY, quality);
    quantizer.setMaxColors(colors);

    const result = quantizer.quantizeImage(data, width, height);
    try {
      result.setDithering(QUANTIZE_DITHERING);
      const indices = result.getPaletteIndices(data, width, height);
      const palette = result.getPalette();
      const png = encode_palette_to_png(indices, palette, width, height);
      // Copy out of wasm memory into a standalone ArrayBuffer for oxipng.
      const quantized = png.slice().buffer;
      return optimisePng(quantized, POST_QUANTIZE_LEVEL);
    } finally {
      result.free();
    }
  } finally {
    quantizer.free();
  }
}

async function optimisePng(
  pngData: ArrayBuffer | ImageData,
  level: number = LOSSLESS_LEVEL
): Promise<ArrayBuffer> {
  const { optimise } = await import("@jsquash/oxipng");
  return optimise(pngData, optimiseOptions(level));
}

export async function compressPngFile(file: File): Promise<ArrayBuffer> {
  return optimisePng(await file.arrayBuffer());
}

export async function compressImageData(
  imageData: ImageData,
  settings: CompressionSettings & { format: OutputFormat },
  strategy: CompressionStrategy
): Promise<ArrayBuffer> {
  const format = settings.format;

  if (strategy === "png-optimize") {
    try {
      return await optimisePng(imageData);
    } catch {
      return encodeToPng(imageData);
    }
  }

  if (strategy === "png-quantized") {
    return quantizePng(imageData, settings.quality, settings.pngColors);
  }

  if (strategy === "png-encode-fallback" || format === "png") {
    return encodeToPng(imageData);
  }

  if (format === "webp") {
    const { encode } = await import("@jsquash/webp");
    return encode(imageData, {
      exact: 0,
      near_lossless:
        strategy === "webp-lossless" || settings.lossless ? 100 : 0,
      quality:
        strategy === "webp-lossless" || settings.lossless
          ? 100
          : settings.quality,
    });
  }

  if (format === "avif") {
    const { encode } = await import("@jsquash/avif");
    return encode(imageData, {
      quality: settings.lossless ? 100 : settings.quality,
      speed: 7,
    });
  }

  const { encode } = await import("@jsquash/jpeg");
  return encode(imageData, {
    baseline: false,
    optimize_coding: true,
    quality: settings.quality,
  });
}
