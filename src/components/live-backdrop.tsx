"use client";

import { useEffect, useState } from "react";

const MOTION_KEY = "dreamrooms-motion";

function readMotionPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MOTION_KEY) !== "off";
  } catch {
    return true;
  }
}

export function LiveBackdrop() {
  const [enabled, setEnabled] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const preference = readMotionPreference();
    const syncPreference = window.setTimeout(() => setEnabled(preference), 0);
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(syncPreference);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function toggleMotion() {
    const next = !enabled;
    setEnabled(next);
    try {
      window.localStorage.setItem(MOTION_KEY, next ? "on" : "off");
    } catch {
      // Storage may be unavailable; the in-memory preference still applies.
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={`live-backdrop ${enabled && visible ? "live-backdrop-motion" : ""}`}
      />
      <button
        aria-pressed={enabled}
        className="fixed bottom-4 right-4 z-30 min-h-11 rounded-full border border-line bg-panel/90 px-3 text-xs text-muted shadow-2xl backdrop-blur hover:border-ink hover:text-ink"
        onClick={toggleMotion}
        type="button"
      >
        Motion {enabled ? "on" : "off"}
      </button>
    </>
  );
}
