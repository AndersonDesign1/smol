import type {
  CompressionSettings,
  CompressionStrategy,
  OutputFormat,
} from "../utils/types";

// level is oxipng's optimization effort (0-6). 4 trades a little more CPU for
// meaningfully smaller lossless PNGs than the previous level 2.
const pngOptimiseOptions = {
  interlace: false,
  level: 4,
  optimiseAlpha: true,
} as const;

async function encodeToPng(imageData: ImageData): Promise<ArrayBuffer> {
  const { encode } = await import("@jsquash/png");
  return encode(imageData);
}

async function quantizePng(
  imageData: ImageData,
  quality: number,
  colors: number
) {
  const { Imagequant } = await import("imagequant");
  const instance = new Imagequant();
  const image = Imagequant.new_image(
    new Uint8Array(imageData.data.buffer.slice(0)),
    imageData.width,
    imageData.height,
    0
  );

  try {
    instance.set_max_colors(colors);
    instance.set_quality(Math.max(0, quality - 20), quality);
    instance.set_speed(3);

    const output = instance.process(image);
    const quantized = Uint8Array.from(output).buffer;
    return optimisePng(quantized);
  } finally {
    image.free();
    instance.free();
  }
}

async function optimisePng(
  pngData: ArrayBuffer | ImageData
): Promise<ArrayBuffer> {
  const { optimise } = await import("@jsquash/oxipng");
  return optimise(pngData, pngOptimiseOptions);
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
