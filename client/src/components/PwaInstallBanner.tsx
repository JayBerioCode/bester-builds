import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (running in standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS for Safari-specific instructions
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);

    // Listen for the Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Check if the user previously dismissed the banner
  const storageKey = "bb-pwa-banner-dismissed";
  useEffect(() => {
    if (localStorage.getItem(storageKey) === "true") {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  // Don't show if: already installed, dismissed, or no install trigger available
  if (isStandalone || dismissed) return null;

  // Android/Chrome: native install prompt available
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg md:left-auto md:right-6 md:w-80">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-card-foreground">Install Bester.Builds</p>
          <p className="text-xs text-muted-foreground">Add to your home screen for quick access</p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleInstall} className="text-xs h-8 px-3">
            Install
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // iOS Safari: manual instructions (no programmatic install API)
  if (isIos) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Download className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">Install on iPhone / iPad</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap <span className="font-medium">Share</span> then{" "}
                <span className="font-medium">"Add to Home Screen"</span>
              </p>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 mt-0.5" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
