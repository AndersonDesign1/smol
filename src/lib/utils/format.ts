import type {
  CompressionSettings,
  CompressionStrategy,
  FormatPreference,
  OutputFormat,
} from "./types";

export const formatOptions: Array<{
  label: string;
  value: FormatPreference;
}> = [
  { label: "Auto", value: "auto" },
  { label: "Original", value: "original" },
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "WebP", value: "webp" },
  { label: "AVIF", value: "avif" },
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(1)} ${units[unit]}`;
}

export function outputExtension(format: OutputFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

export function formatLabel(format: FormatPreference): string {
  if (format === "auto") {
    return "Auto";
  }

  if (format === "original") {
    return "Original";
  }

  return format === "jpeg" ? "JPEG" : format.toUpperCase();
}

export function variantFormatLabel(
  format: OutputFormat,
  strategy: CompressionStrategy
) {
  if (strategy === "png-optimize") {
    return "Optimized PNG";
  }

  if (strategy === "png-quantized") {
    return "Compressed PNG";
  }

  if (strategy === "png-encode-fallback") {
    return "PNG export";
  }

  if (strategy === "webp-lossless") {
    return "WebP lossless";
  }

  if (strategy === "webp-lossy") {
    return format === "webp" ? "WebP conversion" : "WebP";
  }

  if (strategy === "avif-lossy") {
    return "AVIF conversion";
  }

  return format === "png" ? "PNG" : formatLabel(format);
}

export function formatFromMimeType(mimeType: string): OutputFormat | null {
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpeg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return null;
  }
}

export function formatFromFilename(name: string): OutputFormat | null {
  const extension = name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "jpeg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "avif":
      return "avif";
    default:
      return null;
  }
}

export function formatFromFile(file: Pick<File, "name" | "type">) {
  return formatFromMimeType(file.type) ?? formatFromFilename(file.name);
}

export function resolveOutputFormat(
  file: Pick<File, "name" | "type">,
  preferredFormat: FormatPreference
): OutputFormat {
  // "auto" and "original" both resolve to the source format here; Auto's
  // multi-format fan-out happens earlier in buildCompressionTasks, so any
  // task reaching this point already carries a concrete format.
  if (preferredFormat !== "original" && preferredFormat !== "auto") {
    return preferredFormat;
  }

  return formatFromFile(file) ?? "webp";
}

export function savingsPercent(sizeDelta: number, originalSize: number) {
  if (!originalSize) {
    return 0;
  }

  return Math.round((Math.abs(sizeDelta) / originalSize) * 100);
}

export function settingsSignature(
  settings: CompressionSettings,
  presetId: string | null,
  strategy: CompressionStrategy
) {
  return JSON.stringify({
    format: settings.format,
    lossless: settings.lossless,
    pngColors: settings.pngColors,
    pngMode: settings.pngMode,
    presetId,
    quality: settings.quality,
    strategy,
  });
}

export function buildSettingsForFormat(
  settings: CompressionSettings,
  format: FormatPreference
): CompressionSettings {
  let lossless = false;
  let pngMode = settings.pngMode;

  if (format === "png") {
    lossless = true;
    pngMode = "lossless";
  } else if (format === "webp") {
    lossless = settings.lossless;
  } else if (format === "original" || format === "auto") {
    pngMode = "lossless";
  }

  return {
    ...settings,
    format,
    quality: format === "png" ? 100 : settings.quality,
    lossless,
    pngMode,
  };
}
