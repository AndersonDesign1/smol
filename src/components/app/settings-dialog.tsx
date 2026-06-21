import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";
import { buildSettingsForFormat, formatOptions } from "../../lib/utils/format";
import { presets } from "../../lib/utils/presets";
import type { CompressionSettings, OutputFormat } from "../../lib/utils/types";

interface SettingsDialogProps {
  activePresetId: string | null;
  hasJobs: boolean;
  hasSelection: boolean;
  isProcessing: boolean;
  onApplyAll: (settings: CompressionSettings) => void;
  onApplyPreset: (presetId: string) => void;
  onApplySelected: (settings: CompressionSettings) => void;
  onChange: (settings: CompressionSettings) => void;
  onClose: () => void;
  open: boolean;
  selectedCount: number;
  settings: CompressionSettings;
  sourceFormat: OutputFormat | null;
}

// The concrete output format the format-specific controls apply to. Auto has no
// single output format (it fans out), so its knobs stay hidden.
function getExplicitFormat(
  settings: CompressionSettings,
  sourceFormat: OutputFormat | null
): OutputFormat | null {
  if (settings.format === "auto") {
    return null;
  }
  if (settings.format === "original") {
    return sourceFormat;
  }
  return settings.format;
}

function getPngHelpText(settings: CompressionSettings) {
  if (settings.format !== "png") {
    return null;
  }

  if (settings.pngMode === "compressed") {
    return "Compressed PNG keeps PNG output and transparency, but reduces colors a little for stronger savings.";
  }

  return "PNG export stays lossless and preserves transparency. Switch to Compressed PNG for a smaller PNG without converting formats.";
}

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[0.55rem] border px-3 py-1.5 font-medium text-[0.82rem] transition disabled:cursor-not-allowed disabled:opacity-45";

export function SettingsDialog({
  activePresetId,
  hasJobs,
  hasSelection,
  isProcessing,
  onApplyAll,
  onApplyPreset,
  onApplySelected,
  onChange,
  onClose,
  open,
  selectedCount,
  settings,
  sourceFormat,
}: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Close when the backdrop (the dialog element itself) is clicked. Done via a
  // native listener so it doesn't trip the JSX click/keyboard a11y rule —
  // Escape-to-close is already handled natively by <dialog>.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (event.target === dialog) {
        onClose();
      }
    }

    dialog.addEventListener("click", handleClick);
    return () => dialog.removeEventListener("click", handleClick);
  }, [onClose]);

  const explicitFormat = getExplicitFormat(settings, sourceFormat);
  const pngOutputActive = explicitFormat === "png";
  const losslessSupported =
    explicitFormat === "png" || explicitFormat === "webp";
  const qualityDisabled =
    (pngOutputActive && settings.pngMode === "lossless") ||
    (!pngOutputActive && settings.lossless);
  const pngHelpText = getPngHelpText(settings);

  return (
    <dialog
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-[1.1rem] border border-border bg-surface-soft p-0 text-text shadow-[0_30px_80px_rgba(0,0,0,0.6)] [&::backdrop]:bg-black/55 [&::backdrop]:backdrop-blur-[2px]"
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-semibold text-[1rem] text-text">Settings</h2>
            <p className="text-[0.8rem] text-white/50 leading-5">
              Smol keeps your quality by default. Only reach in here if you want
              a specific format, or to push the size down further.
            </p>
          </div>
          <button
            aria-label="Close settings"
            className="rounded-[0.55rem] border border-border bg-white/[0.03] p-1.5 text-muted-strong transition hover:border-border-strong hover:bg-white/[0.06]"
            onClick={onClose}
            type="button"
          >
            <Icon icon="hugeicons:cancel-01" width={15} />
          </button>
        </div>

        <div className="grid gap-2">
          <span className="text-[0.72rem] text-white/42 uppercase tracking-[0.12em]">
            Quick presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const active = activePresetId === preset.id;
              return (
                <button
                  className={`rounded-[0.55rem] border px-3 py-1.5 text-left text-[0.78rem] transition ${
                    active
                      ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100"
                      : "border-border bg-white/[0.02] text-muted-strong hover:border-border-strong hover:bg-white/[0.05]"
                  }`}
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.id)}
                  title={preset.description}
                  type="button"
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-[0.72rem] text-white/42 uppercase tracking-[0.12em]">
            Output format
          </span>
          <div className="flex flex-wrap overflow-hidden rounded-[0.55rem] border border-border">
            {formatOptions.map((format) => (
              <button
                className={`border-border border-r px-3 py-1.5 font-semibold text-[0.78rem] transition last:border-r-0 ${
                  settings.format === format.value
                    ? "bg-accent-soft text-text"
                    : "bg-transparent text-muted hover:bg-white/5"
                }`}
                key={format.value}
                onClick={() =>
                  onChange(buildSettingsForFormat(settings, format.value))
                }
                type="button"
              >
                {format.label}
              </button>
            ))}
          </div>
          {settings.format === "auto" ? (
            <p className="text-[0.74rem] text-white/45 leading-5">
              Auto keeps your file lossless/high quality and offers a smaller
              version when one is clearly worth it.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.72rem] text-white/42 uppercase tracking-[0.12em]">
              Quality
            </span>
            <span className="text-[0.78rem] text-muted tabular-nums">
              {settings.quality}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[0.74rem] text-muted">
              Smaller
            </span>
            <input
              className="h-1 flex-1 disabled:opacity-30"
              disabled={qualityDisabled}
              max={100}
              min={1}
              onChange={(event) =>
                onChange({ ...settings, quality: Number(event.target.value) })
              }
              type="range"
              value={settings.quality}
            />
            <span className="whitespace-nowrap text-[0.74rem] text-muted">
              Better detail
            </span>
          </div>
        </div>

        {pngOutputActive ? (
          <div className="grid gap-2">
            <span className="text-[0.72rem] text-white/42 uppercase tracking-[0.12em]">
              PNG mode
            </span>
            <div className="flex overflow-hidden rounded-[0.55rem] border border-border">
              {[
                { label: "Lossless PNG", value: "lossless" as const },
                { label: "Compressed PNG", value: "compressed" as const },
              ].map((mode) => (
                <button
                  className={`border-border border-r px-3 py-1.5 font-semibold text-[0.78rem] transition last:border-r-0 ${
                    settings.pngMode === mode.value
                      ? "bg-accent-soft text-text"
                      : "bg-transparent text-muted hover:bg-white/5"
                  }`}
                  key={mode.value}
                  onClick={() =>
                    onChange({
                      ...settings,
                      lossless: true,
                      pngColors: mode.value === "compressed" ? 128 : 256,
                      pngMode: mode.value,
                      quality:
                        mode.value === "compressed"
                          ? Math.min(settings.quality, 78)
                          : 100,
                    })
                  }
                  type="button"
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {losslessSupported && !pngOutputActive ? (
          <label className="inline-flex cursor-pointer items-center gap-2 text-[0.82rem] text-muted">
            <input
              checked={settings.lossless}
              className="size-[14px] cursor-pointer"
              onChange={(event) =>
                onChange({ ...settings, lossless: event.target.checked })
              }
              type="checkbox"
            />
            <Icon icon="hugeicons:lossless" width={15} />
            Lossless (WebP)
          </label>
        ) : null}

        {pngHelpText ? (
          <p className="text-[0.74rem] text-white/45 leading-5">
            {pngHelpText}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-border border-t pt-4">
          <button
            className={`${buttonBase} mr-auto border-transparent text-muted hover:text-text`}
            onClick={onClose}
            type="button"
          >
            Done
          </button>
          <button
            className={`${buttonBase} border-border bg-white/[0.03] text-muted-strong hover:border-border-strong hover:bg-white/[0.06]`}
            disabled={!hasJobs || isProcessing}
            onClick={() => onApplyAll(settings)}
            type="button"
          >
            <Icon icon="hugeicons:layers-01" width={15} />
            {selectedCount > 0
              ? `Apply to ${selectedCount} selected`
              : "Apply to all"}
          </button>
          <button
            className={`${buttonBase} border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15`}
            disabled={!hasSelection || isProcessing}
            onClick={() => onApplySelected(settings)}
            type="button"
          >
            <Icon icon="hugeicons:refresh" width={15} />
            Apply
          </button>
        </div>
      </div>
    </dialog>
  );
}
