"use client";
import { useState } from "react";
import { Icon } from "@/components/ui";

/** Copies the canonical story link (without ?compare) to the clipboard. */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const share = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      // Clipboard can be blocked (insecure context, permissions); fall back to the native sheet.
      try {
        if (navigator.share) {
          await navigator.share({ title, url });
          setStatus("idle");
          return;
        }
      } catch {
        /* user cancelled */
      }
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2500);
  };
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-ink-soft hover:text-ink"
    >
      <Icon name="external" size={16} />
      <span aria-live="polite">{status === "copied" ? "Link copied" : status === "failed" ? "Copy failed" : "Share"}</span>
    </button>
  );
}
