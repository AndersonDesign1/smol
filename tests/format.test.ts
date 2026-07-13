import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatFromFilename,
  formatFromMimeType,
  formatLabel,
  outputExtension,
  savingsPercent,
  variantFormatLabel,
} from "../src/lib/utils/format";

describe("formatBytes", () => {
  it("formats bytes less than 1KB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1)).toBe("1 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10_240)).toBe("10.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1_048_576)).toBe("1.0 MB");
    expect(formatBytes(1_572_864)).toBe("1.5 MB");
    expect(formatBytes(10_485_760)).toBe("10.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1_073_741_824)).toBe("1.0 GB");
  });
});

describe("outputExtension", () => {
  it("returns jpg for jpeg format", () => {
    expect(outputExtension("jpeg")).toBe("jpg");
  });

  it("returns original format for others", () => {
    expect(outputExtension("png")).toBe("png");
    expect(outputExtension("webp")).toBe("webp");
    expect(outputExtension("avif")).toBe("avif");
  });
});

describe("formatLabel", () => {
  it("returns Original for original format", () => {
    expect(formatLabel("original")).toBe("Original");
  });

  it("returns uppercase for standard formats", () => {
    expect(formatLabel("png")).toBe("PNG");
    expect(formatLabel("webp")).toBe("WEBP");
    expect(formatLabel("avif")).toBe("AVIF");
  });

  it("returns JPEG (not uppercase) for jpeg", () => {
    expect(formatLabel("jpeg")).toBe("JPEG");
  });
});

describe("variantFormatLabel", () => {
  it("returns correct labels for PNG strategies", () => {
    expect(variantFormatLabel("png", "png-optimize")).toBe("Optimized PNG");
    expect(variantFormatLabel("png", "png-quantized")).toBe("Smart PNG");
    expect(variantFormatLabel("png", "png-encode-fallback")).toBe("PNG export");
  });

  it("returns correct labels for WebP strategies", () => {
    expect(variantFormatLabel("webp", "webp-lossless")).toBe("WebP lossless");
    expect(variantFormatLabel("webp", "webp-lossy")).toBe("WebP conversion");
    expect(variantFormatLabel("jpeg", "webp-lossy")).toBe("WebP");
  });

  it("returns correct labels for AVIF", () => {
    expect(variantFormatLabel("avif", "avif-lossy")).toBe("AVIF conversion");
  });

  it("returns format name for unknown strategies", () => {
    expect(variantFormatLabel("png", "same-format")).toBe("PNG");
    expect(variantFormatLabel("webp", "same-format")).toBe("WEBP");
  });
});

describe("formatFromMimeType", () => {
  it("parses JPEG mime types", () => {
    expect(formatFromMimeType("image/jpeg")).toBe("jpeg");
    expect(formatFromMimeType("image/jpg")).toBe("jpeg");
    expect(formatFromMimeType("IMAGE/JPEG")).toBe("jpeg");
  });

  it("parses PNG mime type", () => {
    expect(formatFromMimeType("image/png")).toBe("png");
  });

  it("parses WebP mime type", () => {
    expect(formatFromMimeType("image/webp")).toBe("webp");
  });

  it("parses AVIF mime type", () => {
    expect(formatFromMimeType("image/avif")).toBe("avif");
  });

  it("returns null for unknown mime types", () => {
    expect(formatFromMimeType("image/gif")).toBeNull();
    expect(formatFromMimeType("text/plain")).toBeNull();
    expect(formatFromMimeType("")).toBeNull();
  });
});

describe("formatFromFilename", () => {
  it("parses JPEG extensions", () => {
    expect(formatFromFilename("image.jpg")).toBe("jpeg");
    expect(formatFromFilename("image.jpeg")).toBe("jpeg");
    expect(formatFromFilename("IMAGE.JPG")).toBe("jpeg");
  });

  it("parses PNG extension", () => {
    expect(formatFromFilename("image.png")).toBe("png");
  });

  it("parses WebP extension", () => {
    expect(formatFromFilename("image.webp")).toBe("webp");
  });

  it("parses AVIF extension", () => {
    expect(formatFromFilename("image.avif")).toBe("avif");
  });

  it("returns null for unknown extensions", () => {
    expect(formatFromFilename("image.gif")).toBeNull();
    expect(formatFromFilename("image")).toBeNull();
    expect(formatFromFilename("")).toBeNull();
  });
});

describe("savingsPercent", () => {
  it("calculates percentage reduction", () => {
    expect(savingsPercent(-500, 1000)).toBe(50);
    expect(savingsPercent(-100, 1000)).toBe(10);
    expect(savingsPercent(-1, 100)).toBe(1);
  });

  it("calculates percentage increase as positive", () => {
    expect(savingsPercent(500, 1000)).toBe(50);
  });

  it("returns 0 when original size is 0", () => {
    expect(savingsPercent(0, 0)).toBe(0);
    expect(savingsPercent(100, 0)).toBe(0);
  });

  it("returns 0 when no change", () => {
    expect(savingsPercent(0, 1000)).toBe(0);
  });
});
