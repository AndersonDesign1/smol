import type { CompressionPreset } from "./types";

export const presets: CompressionPreset[] = [
  {
    id: "keep-quality",
    label: "Keep quality",
    description:
      "Start with the safer option and trim size without pushing it.",
    settings: {
      format: "original",
      quality: 90,
      lossless: false,
      pngColors: 256,
      pngMode: "lossless",
    },
  },
  {
    id: "smaller-file",
    label: "Smaller file",
    description:
      "Push a bit harder when you care more about size than perfect detail.",
    settings: {
      format: "original",
      quality: 78,
      lossless: false,
      pngColors: 256,
      pngMode: "lossless",
    },
  },
  {
    id: "modern-web",
    label: "Modern web",
    description: "Make a WebP version for the web when smaller matters more.",
    settings: {
      format: "webp",
      quality: 82,
      lossless: false,
      pngColors: 256,
      pngMode: "lossless",
    },
  },
  {
    id: "compressed-png",
    label: "Smart PNG",
    description:
      "Keep PNG output but quantize colors for fast, near-lossless savings.",
    settings: {
      format: "png",
      quality: 78,
      lossless: true,
      pngColors: 128,
      pngMode: "compressed",
    },
  },
];
