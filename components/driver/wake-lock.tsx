"use client";

import { useEffect, useRef } from "react";

type WakeLockSentinel = {
  release: () => Promise<void>;
};

export function DriverWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    async function request() {
      const nav = navigator as unknown as {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
      };
      if (!nav.wakeLock) return;
      try {
        sentinelRef.current = await nav.wakeLock.request("screen");
      } catch (err) {
        console.error("Wake Lock unavailable:", err);
      }
    }

    request();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && sentinelRef.current == null) {
        request();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, []);

  return null;
}
