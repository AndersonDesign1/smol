import { Icon } from "@iconify/react";
import type { CompressionSettings } from "../../lib/utils/types";

interface ToolbarControlsProps {
  hasCompleted: boolean;
  hasJobs: boolean;
  hasSelection: boolean;
  isProcessing: boolean;
  onAddFiles: () => void;
  onClear: () => void;
  onDownloadSelected: () => void;
  onDownloadZip: () => void;
  onOpenSettings: () => void;
  onQualityChange: (quality: number) => void;
  onQualityCommit: (quality: number) => void;
  selectedCount: number;
  settings: CompressionSettings;
}

const buttonClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[0.55rem] border border-border bg-white/4 px-3 py-1.5 font-medium text-[0.82rem] text-muted-strong transition hover:border-border-strong hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45";

export function ToolbarControls({
  hasCompleted,
  hasJobs,
  hasSelection,
  isProcessing,
  onAddFiles,
  onClear,
  onDownloadSelected,
  onDownloadZip,
  onOpenSettings,
  onQualityChange,
  onQualityCommit,
  selectedCount,
  settings,
}: ToolbarControlsProps) {
  const hasChecked = selectedCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 border-border border-t bg-black/85 px-3 py-2.5 backdrop-blur-xl">
      <button
        aria-label="Add files"
        className={buttonClass}
        onClick={onAddFiles}
        type="button"
      >
        <span className="text-[0.95rem] leading-none">+</span>
        <span className="hidden sm:inline">Add files</span>
      </button>

      <div className="order-last flex min-w-[10rem] basis-full items-center gap-2 sm:order-none sm:min-w-[13rem] sm:max-w-[22rem] sm:basis-auto">
        <span className="whitespace-nowrap text-[0.7rem] text-white/42 uppercase tracking-[0.12em]">
          Quality
        </span>
        <span className="hidden whitespace-nowrap text-[0.74rem] text-muted sm:inline">
          Smaller
        </span>
        <input
          aria-label="Compression quality"
          className="h-1 flex-1 disabled:opacity-30"
          disabled={isProcessing}
          max={100}
          min={1}
          onChange={(event) => onQualityChange(Number(event.target.value))}
          onKeyUp={(event) =>
            onQualityCommit(Number(event.currentTarget.value))
          }
          onPointerUp={(event) =>
            onQualityCommit(Number(event.currentTarget.value))
          }
          type="range"
          value={settings.quality}
        />
        <span className="hidden whitespace-nowrap text-[0.74rem] text-muted sm:inline">
          Detail
        </span>
        <span className="w-7 text-right text-[0.78rem] text-muted tabular-nums">
          {settings.quality}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Settings"
          className={buttonClass}
          onClick={onOpenSettings}
          type="button"
        >
          <Icon icon="hugeicons:settings-02" width={15} />
          <span className="hidden sm:inline">Settings</span>
        </button>
        <button
          aria-label="Download current image"
          className={buttonClass}
          disabled={!hasSelection || isProcessing}
          onClick={onDownloadSelected}
          type="button"
        >
          <Icon icon="hugeicons:download-04" width={15} />
          <span className="hidden sm:inline">Download</span>
        </button>
        <button
          aria-label={
            hasChecked
              ? `Download ${selectedCount} selected as zip`
              : "Download all as zip"
          }
          className={buttonClass}
          disabled={!hasCompleted}
          onClick={onDownloadZip}
          type="button"
        >
          <Icon icon="hugeicons:archive" width={15} />
          <span className="hidden sm:inline">
            {hasChecked ? "Download" : "Download all"}
          </span>
          {hasChecked ? (
            <span className="rounded-full bg-emerald-400/20 px-1.5 font-semibold text-[0.72rem] text-emerald-200">
              {selectedCount}
            </span>
          ) : null}
        </button>
        <button
          aria-label="Clear all files"
          className={buttonClass}
          disabled={isProcessing || !hasJobs}
          onClick={onClear}
          type="button"
        >
          <Icon icon="hugeicons:delete-02" width={15} />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
}
