"use client";

import { useEffect, useRef, useState } from "react";
import { boardPassenger, type BoardingResult } from "@/app/actions/boarding";

export function QrScanner({
  shiftId,
  onBoarded,
}: {
  shiftId: string;
  onBoarded: (passengerName: string, seatCount: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScanRef = useRef<{ token: string; ts: number } | null>(null);
  const [feedback, setFeedback] = useState<BoardingResult | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled || !containerRef.current) return;
      const id = "qr-scanner-region";
      containerRef.current.innerHTML = `<div id="${id}" class="w-full"></div>`;
      const instance = new Html5Qrcode(id, { verbose: false });
      scanner = instance as unknown as typeof scanner;

      try {
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decoded) => {
            const now = Date.now();
            if (
              lastScanRef.current &&
              lastScanRef.current.token === decoded &&
              now - lastScanRef.current.ts < 3000
            ) {
              return;
            }
            lastScanRef.current = { token: decoded, ts: now };
            const result = await boardPassenger({ passcode: decoded, shiftId });
            setFeedback(result);
            if (result.success && !result.alreadyBoarded) {
              try {
                const ctx = new (window.AudioContext ||
                  (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext)();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.frequency.value = 880;
                g.gain.setValueAtTime(0.15, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                o.start();
                o.stop(ctx.currentTime + 0.25);
              } catch {
                // audio bell is best-effort
              }
              onBoarded(result.passengerName, result.seatCount);
            }
          },
          () => {},
        );
      } catch (err) {
        setFeedback({
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Camera unavailable on this device",
        });
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop().catch(() => {});
    };
  }, [active, shiftId, onBoarded]);

  return (
    <div className="space-y-3">
      {!active ? (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="driver-tap-target w-full rounded-lg bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold text-lg"
        >
          Scan ticket
        </button>
      ) : (
        <>
          <div
            ref={containerRef}
            className="rounded-lg overflow-hidden bg-black aspect-square"
          />
          <button
            type="button"
            onClick={() => setActive(false)}
            className="w-full rounded-lg bg-white/10 hover:bg-white/15 text-white py-2 text-sm"
          >
            Close scanner
          </button>
        </>
      )}

      {feedback && (
        <div
          className={
            "rounded-lg px-4 py-3 text-sm " +
            (feedback.success
              ? feedback.alreadyBoarded
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
              : "bg-red-500/20 text-red-200 border border-red-500/30")
          }
        >
          {feedback.success ? (
            <>
              <div className="font-semibold">
                {feedback.alreadyBoarded ? "Already boarded" : "Boarded"} ·{" "}
                {feedback.passengerName}
              </div>
              <div className="text-xs opacity-80">
                {feedback.seatCount} seat{feedback.seatCount === 1 ? "" : "s"}
              </div>
            </>
          ) : (
            <div className="font-semibold">{feedback.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
