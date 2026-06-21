import type { CompressionSettings, FormatPreference } from "./types";

// Fresh "smol:" namespace; v1 stores the current settings shape (Auto default,
// with the quality slider reset to default on load).
const STORAGE_KEY = "smol:last-settings:v1";

// The quality slider intentionally resets to this on every reload rather than
// persisting, so each visit starts from the same safe default.
export const DEFAULT_QUALITY = 90;
const validFormats: FormatPreference[] = [
  "auto",
  "original",
  "jpeg",
  "png",
  "webp",
  "avif",
];

function isValidSettings(value: unknown): value is CompressionSettings {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<CompressionSettings>;
  return (
    typeof candidate.quality === "number" &&
    candidate.quality >= 1 &&
    candidate.quality <= 100 &&
    typeof candidate.format === "string" &&
    validFormats.includes(candidate.format as FormatPreference) &&
    typeof candidate.lossless === "boolean" &&
    (candidate.pngMode === "lossless" || candidate.pngMode === "compressed") &&
    typeof candidate.pngColors === "number" &&
    candidate.pngColors >= 2 &&
    candidate.pngColors <= 256
  );
}

export function loadSettings(): CompressionSettings | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidSettings(parsed)) {
      return null;
    }

    // Always reopen in Auto mode at the default quality (PNG preferences still
    // persist), so the streamlined default experience is the same every visit.
    return {
      ...parsed,
      format: "auto",
      lossless: false,
      quality: DEFAULT_QUALITY,
    };
  } catch {
    return null;
  }
}

export function saveSettings(settings: CompressionSettings): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
