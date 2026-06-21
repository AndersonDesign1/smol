import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderHandle,
} from "react-compare-slider";
import {
  formatBytes,
  savingsPercent,
  variantFormatLabel,
} from "../../lib/utils/format";
import type { CompressionJob, CompressionVariant } from "../../lib/utils/types";

interface PreviewPanelProps {
  job?: CompressionJob;
  onSelectVariant: (variantId: string | null) => void;
}

function useObjectUrl(file?: Blob | File) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  return url;
}

function variantSummary(variant: CompressionVariant, originalSize: number) {
  if (variant.status === "processing") {
    return {
      text: "Still working on this one...",
      tone: "text-sky-300",
    };
  }

  if (variant.status === "error") {
    return {
      text: variant.error ?? "That version did not make it through.",
      tone: "text-rose-300",
    };
  }

  if (variant.sizeDelta === null || !variant.output) {
    return {
      text: "No result yet.",
      tone: "text-white/62",
    };
  }

  if (variant.sizeDelta > 0) {
    return {
      text: `${variantFormatLabel(
        variant.format,
        variant.strategy
      )} came out ${savingsPercent(variant.sizeDelta, originalSize)}% larger.`,
      tone: "text-amber-300",
    };
  }

  if (variant.sizeDelta === 0) {
    return {
      text: `${variantFormatLabel(
        variant.format,
        variant.strategy
      )} came out the same size.`,
      tone: "text-white/62",
    };
  }

  return {
    text: `${variantFormatLabel(
      variant.format,
      variant.strategy
    )} saves ${savingsPercent(variant.sizeDelta, originalSize)}%.`,
    tone: "text-emerald-300",
  };
}

// Auto keeps the quality-safe pick selected by default. When a different
// candidate is meaningfully smaller, surface it as a one-click suggestion
// instead of switching for the user.
const SUGGESTION_SAVINGS_RATIO = 0.85; // offer only when >=15% smaller

function getCompressMoreSuggestion(
  job: CompressionJob,
  activeVariant: CompressionVariant | null
) {
  if (job.bestVariantId === null || job.bestVariantId === job.activeVariantId) {
    return null;
  }

  const smaller = job.variants.find(
    (variant) => variant.id === job.bestVariantId
  );
  if (
    !(smaller?.output && smaller.sizeDelta !== null && smaller.sizeDelta < 0)
  ) {
    return null;
  }

  const referenceSize = activeVariant?.output?.size ?? job.file.size;
  if (smaller.output.size > referenceSize * SUGGESTION_SAVINGS_RATIO) {
    return null;
  }

  return {
    id: smaller.id,
    label: variantFormatLabel(smaller.format, smaller.strategy),
    savedMore: savingsPercent(
      smaller.output.size - referenceSize,
      referenceSize
    ),
  };
}

function compareImage(src: string, alt: string) {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <img
        alt={alt}
        className="h-full w-full rounded-[0.5rem] object-contain object-center"
        height={1200}
        src={src}
        width={1600}
      />
    </div>
  );
}

function singlePreviewImage(src: string, alt: string) {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <img
        alt={alt}
        className="h-full w-full rounded-[0.75rem] object-contain object-center"
        height={1200}
        src={src}
        width={1600}
      />
    </div>
  );
}

export function PreviewPanel({ job, onSelectVariant }: PreviewPanelProps) {
  const originalUrl = useObjectUrl(job?.file);
  const activeVariant = useMemo(
    () =>
      job?.variants.find((variant) => variant.id === job.activeVariantId) ??
      null,
    [job]
  );
  const activeOutputUrl = useObjectUrl(activeVariant?.output);
  const latestVariant = job?.variants[job.variants.length - 1] ?? null;

  if (!job) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-[0.9rem] text-muted opacity-60">
          <Icon className="text-muted" icon="hugeicons:image-01" width={28} />
          <p>Pick a file and we can look at the difference.</p>
        </div>
      </div>
    );
  }

  let activeSummary = {
    text: "The original is still the best call so far.",
    tone: "text-white/62",
  };
  if (activeVariant) {
    activeSummary = variantSummary(activeVariant, job.file.size);
  } else if (latestVariant?.status === "larger-than-original") {
    activeSummary = {
      text: "The latest try got bigger, so the original stays selected.",
      tone: "text-amber-300",
    };
  }
  const compareReady = !!(
    originalUrl &&
    activeOutputUrl &&
    activeVariant?.output
  );
  const suggestion = getCompressMoreSuggestion(job, activeVariant);
  const compareContent =
    compareReady && originalUrl && activeOutputUrl ? (
      <div className="h-full w-full overflow-hidden p-4">
        <ReactCompareSlider
          boundsPadding={12}
          className="h-full w-full rounded-[0.75rem] border border-border bg-black/40"
          handle={
            <ReactCompareSliderHandle
              buttonStyle={{
                background: "rgba(8,8,8,0.92)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
              linesStyle={{
                background: "rgba(255,255,255,0.24)",
              }}
            />
          }
          itemOne={compareImage(originalUrl, `Original ${job.file.name}`)}
          itemTwo={compareImage(activeOutputUrl, `Compressed ${job.file.name}`)}
          onlyHandleDraggable
          position={50}
        />
      </div>
    ) : null;
  const compareFallback = originalUrl ? (
    <div className="flex h-full w-full flex-col overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between text-[0.82rem]">
        <span className="text-white/62">Original preview</span>
        <span className="text-amber-300">
          Nothing smaller yet, so the original still wins.
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[0.75rem] border border-border bg-black/40">
        {singlePreviewImage(originalUrl, `Original ${job.file.name}`)}
      </div>
    </div>
  ) : (
    <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[0.9rem] text-muted">
      <p>Waiting for the original preview to show up.</p>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-border border-b px-4 py-3">
        <div className="space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[0.85rem]">
            <Icon className="text-muted" icon="hugeicons:image-02" width={15} />
            <span className="max-w-[20rem] truncate font-semibold text-[0.95rem] text-text">
              {job.file.name}
            </span>
            <span className="whitespace-nowrap text-muted">
              {formatBytes(job.file.size)}
            </span>
            {activeVariant?.output && (
              <>
                <Icon
                  className="text-muted/50"
                  icon="hugeicons:arrow-right-01"
                  width={13}
                />
                <span className="whitespace-nowrap text-muted">
                  {formatBytes(activeVariant.output.size)}
                </span>
              </>
            )}
          </div>
          <p className={`text-[0.82rem] leading-6 ${activeSummary.tone}`}>
            {activeSummary.text}
          </p>
          {activeVariant?.note ? (
            <p className="text-[0.76rem] text-white/45 leading-5">
              {activeVariant.note}
            </p>
          ) : null}
        </div>

        {activeVariant?.output &&
        activeVariant.sizeDelta !== null &&
        activeVariant.sizeDelta < 0 ? (
          <div className="shrink-0 rounded-[0.5rem] border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-semibold text-[0.85rem] text-emerald-200 tabular-nums">
            −{savingsPercent(activeVariant.sizeDelta, job.file.size)}%
          </div>
        ) : null}
      </div>

      {suggestion ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-border border-b bg-emerald-400/[0.06] px-4 py-2.5">
          <span className="text-[0.82rem] text-emerald-100/90">
            <span className="font-semibold text-emerald-200">
              {suggestion.label}
            </span>{" "}
            saves {suggestion.savedMore}% more, and looks the same.
          </span>
          <button
            className="ml-auto inline-flex items-center gap-1.5 rounded-[0.55rem] border border-emerald-400/40 bg-emerald-400/15 px-3 py-1.5 font-medium text-[0.8rem] text-emerald-50 transition hover:bg-emerald-400/25"
            onClick={() => onSelectVariant(suggestion.id)}
            type="button"
          >
            Use {suggestion.label}
            <Icon icon="hugeicons:arrow-right-01" width={14} />
          </button>
        </div>
      ) : null}

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-border border-b px-4 py-3">
        <button
          className={`inline-flex items-center gap-2 rounded-[0.55rem] border px-3 py-1.5 text-left text-[0.78rem] transition ${
            job.activeVariantId === null
              ? "border-emerald-400/35 bg-emerald-400/10 text-text"
              : "border-border bg-transparent text-muted hover:bg-white/4"
          }`}
          onClick={() => onSelectVariant(null)}
          type="button"
        >
          <span className="font-medium">Original</span>
        </button>

        {job.variants
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((variant) => {
            const isActive = job.activeVariantId === variant.id;
            const isSmallest = job.bestVariantId === variant.id;
            let variantTone =
              "border-border bg-transparent text-muted hover:bg-white/4";

            if (job.activeVariantId === variant.id) {
              if (variant.status === "larger-than-original") {
                variantTone = "border-amber-400/40 bg-amber-400/10 text-text";
              } else if (variant.status === "error") {
                variantTone = "border-rose-400/40 bg-rose-400/10 text-text";
              } else {
                variantTone =
                  "border-emerald-400/35 bg-emerald-400/10 text-text";
              }
            }

            return (
              <button
                className={`inline-flex items-center gap-2 rounded-[0.55rem] border px-3 py-1.5 text-left text-[0.78rem] transition ${variantTone}`}
                key={variant.id}
                onClick={() => onSelectVariant(variant.id)}
                type="button"
              >
                <span className="font-medium">
                  {variantFormatLabel(variant.format, variant.strategy)}
                </span>
                {isActive && variant.status === "done" && (
                  <span className="text-emerald-300">Recommended</span>
                )}
                {!isActive && isSmallest && variant.status === "done" && (
                  <span className="text-emerald-300/80">Smaller</span>
                )}
                {variant.status === "larger-than-original" && (
                  <span className="text-[0.72rem] text-amber-300">Larger</span>
                )}
                {variant.status === "processing" && (
                  <span className="text-[0.72rem] text-white/45">Working</span>
                )}
              </button>
            );
          })}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-[repeating-conic-gradient(rgba(255,255,255,0.03)_0%_25%,transparent_0%_50%)] [background-size:20px_20px]">
        {compareContent ?? compareFallback}
      </div>
    </div>
  );
}
