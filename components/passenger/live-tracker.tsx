"use client";

import { useEffect, useState } from "react";

type TelemetryPayload = {
  lat: number | null;
  lng: number | null;
  status: string;
  updatedAt: string;
};

export function LiveTracker({
  shiftId,
  initialLat,
  initialLng,
  status: initialStatus,
}: {
  shiftId: string;
  initialLat: number | null;
  initialLng: number | null;
  status: string;
}) {
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [status, setStatus] = useState(initialStatus);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/track/${shiftId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as TelemetryPayload;
        if (!active) return;
        setCoords({ lat: data.lat, lng: data.lng });
        setStatus(data.status);
        setLastUpdate(new Date(data.updatedAt));
      } catch {
        // swallow — next tick will retry
      }
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [shiftId]);

  const hasFix = coords.lat != null && coords.lng != null;

  return (
    <div className="rounded-xl border border-brand-border overflow-hidden bg-brand-dark">
      <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        {hasFix ? (
          <MapStub lat={coords.lat!} lng={coords.lng!} status={status} />
        ) : (
          <div className="text-white/60 text-sm text-center px-6">
            Waiting for first telemetry fix from the vehicle…
          </div>
        )}
      </div>
      <div className="bg-white p-4 flex items-center justify-between text-sm">
        <div>
          {hasFix ? (
            <>
              <div className="font-medium text-brand-dark tabular-nums">
                {coords.lat!.toFixed(5)}, {coords.lng!.toFixed(5)}
              </div>
              <div className="text-xs text-brand-muted">
                {lastUpdate
                  ? `Updated ${secondsAgo(lastUpdate)}s ago`
                  : "Awaiting update…"}
              </div>
            </>
          ) : (
            <div className="text-brand-muted">No fix yet</div>
          )}
        </div>
        <div>
          <span
            className={
              "inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-semibold " +
              (status === "EN_ROUTE"
                ? "bg-brand-success/10 text-brand-success"
                : status === "COMPLETED"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-brand-blue/10 text-brand-blue")
            }
          >
            {status === "EN_ROUTE" && (
              <span className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
            )}
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

function secondsAgo(d: Date) {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}

function MapStub({
  lat,
  lng,
  status,
}: {
  lat: number;
  lng: number;
  status: string;
}) {
  const x = (((lng + 180) % 360) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;

  return (
    <div className="absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path
              d="M 5 0 L 0 0 0 5"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.2"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
      </svg>
      <div
        className="absolute transition-all duration-1000 ease-out"
        style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      >
        <div className="relative">
          {status === "EN_ROUTE" && (
            <span className="absolute inset-0 h-6 w-6 -m-1.5 rounded-full bg-brand-success/40 animate-ping" />
          )}
          <div className="relative h-4 w-4 rounded-full bg-brand-success border-2 border-white shadow-lg" />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 text-[10px] text-white/50 font-mono">
        live vehicle telemetry · region: rocky mountain corridor
      </div>
    </div>
  );
}
