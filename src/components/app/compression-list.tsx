import { Icon } from "@iconify/react";
import {
  formatBytes,
  savingsPercent,
  variantFormatLabel,
} from "../../lib/utils/format";
import type { CompressionJob } from "../../lib/utils/types";

interface CompressionListProps {
  allChecked: boolean;
  checkedIds: Set<string>;
  jobs: CompressionJob[];
  onSelect: (id: string) => void;
  onToggleAll: () => void;
  onToggleChecked: (id: string) => void;
  selectedId: string | null;
}

function jobSummary(job: CompressionJob) {
  const bestVariant =
    job.bestVariantId === null
      ? null
      : (job.variants.find((variant) => variant.id === job.bestVariantId) ??
        null);
  const latestVariant = job.variants.at(-1) ?? null;

  let summary = "The original is still the smallest.";
  let summaryClassName = "text-white/62";

  if (
    bestVariant &&
    bestVariant.sizeDelta !== null &&
    bestVariant.sizeDelta < 0
  ) {
    summary = `Best ${variantFormatLabel(bestVariant.format, bestVariant.strategy)} saves ${savingsPercent(bestVariant.sizeDelta, job.file.size)}%`;
    summaryClassName = "text-emerald-300";
  } else if (latestVariant?.status === "processing") {
    summary = `Trying ${variantFormatLabel(latestVariant.format, latestVariant.strategy)} now...`;
    summaryClassName = "text-sky-300";
  } else if (latestVariant?.status === "larger-than-original") {
    summary = "The latest try came out larger.";
    summaryClassName = "text-amber-300";
  } else if (job.status === "error") {
    summary = "This one needs another pass.";
    summaryClassName = "text-rose-300";
  }

  return { bestVariant, latestVariant, summary, summaryClassName };
}

function statusIcon(status: CompressionJob["status"]) {
  switch (status) {
    case "processing":
      return (
        <Icon
          className="animate-spin text-text"
          icon="hugeicons:loading-03"
          width={14}
        />
      );
    case "done":
      return (
        <Icon
          className="text-success"
          icon="hugeicons:checkmark-circle-02"
          width={14}
        />
      );
    case "error":
      return (
        <Icon className="text-error" icon="hugeicons:alert-circle" width={14} />
      );
    default:
      return (
        <Icon className="text-muted" icon="hugeicons:image-02" width={14} />
      );
  }
}

export function CompressionList({
  allChecked,
  checkedIds,
  jobs,
  onSelect,
  onToggleAll,
  onToggleChecked,
  selectedId,
}: CompressionListProps) {
  if (!jobs.length) {
    return null;
  }

  const someChecked = checkedIds.size > 0 && !allChecked;

  return (
    <aside className="flex max-h-[40dvh] w-full shrink-0 flex-col border-border border-b bg-white/[0.018] md:max-h-none md:w-[280px] md:border-r md:border-b-0">
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            aria-label="Select all files"
            checked={allChecked}
            className="size-[15px] cursor-pointer accent-emerald-400"
            onChange={onToggleAll}
            ref={(el) => {
              if (el) {
                el.indeterminate = someChecked;
              }
            }}
            type="checkbox"
          />
          <span className="font-semibold text-[0.78rem] text-muted uppercase tracking-[0.12em]">
            Files
          </span>
        </label>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent-soft px-1.5 font-bold text-[0.72rem] text-text">
          {checkedIds.size > 0
            ? `${checkedIds.size}/${jobs.length}`
            : jobs.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {jobs.map((job) => {
          const { latestVariant, summary, summaryClassName } = jobSummary(job);
          const active = selectedId === job.id;
          const variantCount = job.variants.length;

          return (
            <div
              className={`mb-1.5 flex items-stretch gap-1.5 rounded-[0.6rem] border transition ${
                active
                  ? "border-border-strong bg-white/6"
                  : "border-transparent bg-transparent hover:bg-white/4"
              }`}
              key={job.id}
            >
              <label className="flex cursor-pointer items-start pt-2.5 pl-2.5">
                <input
                  aria-label={`Select ${job.file.name} for download`}
                  checked={checkedIds.has(job.id)}
                  className="size-[15px] cursor-pointer accent-emerald-400"
                  onChange={() => onToggleChecked(job.id)}
                  type="checkbox"
                />
              </label>
              <button
                className="flex w-full min-w-0 flex-col gap-1 py-2 pr-3 text-left"
                onClick={() => onSelect(job.id)}
                type="button"
              >
                <div className="flex items-center gap-2">
                  {statusIcon(job.status)}
                  <span className="flex-1 truncate font-medium text-[0.85rem] text-text">
                    {job.file.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 pl-6 text-[0.75rem] text-muted">
                  <span>{formatBytes(job.file.size)}</span>
                  <span>
                    {variantCount} version{variantCount === 1 ? "" : "s"}
                  </span>
                </div>

                <p
                  className={`pl-6 text-[0.73rem] leading-[1.4] ${summaryClassName}`}
                >
                  {summary}
                </p>

                {job.error ? (
                  <p className="pl-6 text-[0.73rem] text-error leading-[1.35]">
                    {job.error}
                  </p>
                ) : null}

                {latestVariant?.note ? (
                  <p className="pl-6 text-[0.73rem] text-white/45 leading-[1.35]">
                    {latestVariant.note}
                  </p>
                ) : null}

                {job.status === "processing" && latestVariant && (
                  <div className="mt-1 ml-6 h-0.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#999,#ccc)] transition-[width] duration-200 ease-out"
                      style={{ width: `${latestVariant.progress}%` }}
                    />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
