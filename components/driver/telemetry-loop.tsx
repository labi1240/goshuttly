"use client";

import { useEffect, useState } from "react";
import { pushTelemetry } from "@/app/actions/telemetry";

type GeoState =
  | { kind: "idle" }
  | { kind: "permission" }
  | { kind: "active"; lat: number; lng: number; accuracy: number; ts: number }
  | { kind: "error"; message: string };

export function TelemetryLoop({
  shiftId,
  active,
}: {
  shiftId: string;
  active: boolean;
}) {
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });

  useEffect(() => {
    if (!active) {
      setGeo({ kind: "idle" });
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({ kind: "error", message: "Geolocation not supported on this device." });
      return;
    }

    setGeo({ kind: "permission" });

    let lastPush = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const ts = Date.now();
        setGeo({ kind: "active", lat: latitude, lng: longitude, accuracy, ts });

        // Throttle network pushes to ~5s
        if (ts - lastPush >= 4500) {
          lastPush = ts;
          pushTelemetry({ shiftId, lat: latitude, lng: longitude }).catch(() => {});
        }
      },
      (err) => {
        setGeo({ kind: "error", message: err.message });
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [shiftId, active]);

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs font-mono">
      {geo.kind === "idle" && (
        <span className="text-white/50">Telemetry standby</span>
      )}
      {geo.kind === "permission" && (
        <span className="text-amber-300">Awaiting GPS permission…</span>
      )}
      {geo.kind === "error" && (
        <span className="text-red-300">GPS error: {geo.message}</span>
      )}
      {geo.kind === "active" && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
          <span className="tabular-nums">
            {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
          </span>
          <span className="text-white/40">±{Math.round(geo.accuracy)}m</span>
        </div>
      )}
    </div>
  );
}
