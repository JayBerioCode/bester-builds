/**
 * UpdateBanner
 *
 * Shown at the top of the app when running inside Electron and an update is
 * available, downloading, or ready to install.
 *
 * States rendered:
 *   available   → "Update v1.2.3 available" + Download button
 *   downloading → progress bar with percentage
 *   downloaded  → "Ready to install" + Install Now button
 *   error       → dismissible error message
 *
 * The banner is invisible in the browser (window.electronUpdater is undefined).
 */

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Download, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UpdaterState =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

interface UpdaterStatus {
  state: UpdaterState;
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  releaseNotes?: string | null;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSpeed(bps: number): string {
  if (bps < 1024) return `${bps} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdaterStatus>({ state: "idle" });
  const [dismissed, setDismissed] = useState(false);

  // Re-show banner when a new update event arrives
  const handleStatus = useCallback((s: UpdaterStatus) => {
    setStatus(s);
    // Reset dismissal when a fresh update becomes available or downloads
    if (s.state === "available" || s.state === "downloaded") {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const updater = (window as any).electronUpdater;
    if (!updater) return; // not running in Electron

    // Fetch current status (in case window was reloaded after update-available)
    updater.getStatus().then((s: UpdaterStatus) => {
      if (s && s.state !== "idle") setStatus(s);
    });

    updater.onStatus(handleStatus);
    return () => updater.offStatus(handleStatus);
  }, [handleStatus]);

  // Don't render outside Electron or when dismissed / no relevant state
  const isElectron = !!(window as any).electronUpdater;
  if (!isElectron) return null;

  const visible =
    !dismissed &&
    (status.state === "available" ||
      status.state === "downloading" ||
      status.state === "downloaded" ||
      status.state === "error");

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center gap-3 px-4 py-2.5 text-sm shadow-lg"
      style={{
        background:
          status.state === "error"
            ? "linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)"
            : status.state === "downloaded"
            ? "linear-gradient(90deg, #14532d 0%, #166534 100%)"
            : "linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)",
        color: "#fff",
      }}
    >
      {/* Icon */}
      <span className="shrink-0">
        {status.state === "error" ? (
          <AlertTriangle className="h-4 w-4 text-red-300" />
        ) : status.state === "downloaded" ? (
          <CheckCircle2 className="h-4 w-4 text-green-300" />
        ) : status.state === "downloading" ? (
          <Download className="h-4 w-4 text-indigo-200 animate-bounce" />
        ) : (
          <RefreshCw className="h-4 w-4 text-indigo-200" />
        )}
      </span>

      {/* Message + controls */}
      <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
        {status.state === "available" && (
          <>
            <span className="font-medium">
              Update {status.version} is available
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="h-6 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => (window as any).electronUpdater.download()}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </>
        )}

        {status.state === "downloading" && (
          <>
            <span className="font-medium whitespace-nowrap">
              Downloading update… {status.percent ?? 0}%
            </span>
            <div className="flex items-center gap-2 flex-1 min-w-[120px]">
              <Progress
                value={status.percent ?? 0}
                className="h-1.5 flex-1 bg-white/20 [&>div]:bg-white"
              />
            </div>
            {status.bytesPerSecond !== undefined && (
              <span className="text-xs text-indigo-200 whitespace-nowrap">
                {formatSpeed(status.bytesPerSecond)}
                {status.transferred !== undefined && status.total !== undefined
                  ? ` · ${formatBytes(status.transferred)} / ${formatBytes(status.total)}`
                  : ""}
              </span>
            )}
          </>
        )}

        {status.state === "downloaded" && (
          <>
            <span className="font-medium">
              Update {status.version} ready to install
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="h-6 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => (window as any).electronUpdater.install()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Restart &amp; Install
            </Button>
          </>
        )}

        {status.state === "error" && (
          <span className="text-red-200 truncate">
            Update failed: {status.error ?? "unknown error"}
          </span>
        )}
      </div>

      {/* Dismiss (not shown during active download) */}
      {status.state !== "downloading" && (
        <button
          aria-label="Dismiss update notification"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
