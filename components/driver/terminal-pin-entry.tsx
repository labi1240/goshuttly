"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveDriverShifts } from "@/app/actions/driver";

export function TerminalPinEntry() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function press(n: string) {
    setError(null);
    if (n === "←") {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 6) {
      setPin((p) => p + n);
    }
  }

  function submit() {
    if (pin.length < 4) {
      setError("Enter at least 4 digits.");
      return;
    }
    startTransition(async () => {
      const res = await resolveDriverShifts(pin);
      if (!res.success) {
        setError(res.error);
        setPin("");
        return;
      }
      router.push(`/terminal/${res.driverId}/select-shift`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
        <div className="tracking-[0.5em] text-3xl font-mono tabular-nums min-h-[2.5rem]">
          {pin.split("").map((_, i) => "•").join("") || (
            <span className="text-white/30">····</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "OK"].map(
          (k) => (
            <button
              key={k}
              type="button"
              onClick={() => (k === "OK" ? submit() : press(k))}
              disabled={pending}
              className={
                "driver-tap-target rounded-lg text-2xl font-semibold transition " +
                (k === "OK"
                  ? "bg-brand-success hover:bg-emerald-600 text-white"
                  : k === "←"
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-white/5 hover:bg-white/15 text-white")
              }
            >
              {k === "OK" && pending ? "…" : k}
            </button>
          ),
        )}
      </div>

      {error && (
        <div className="rounded-md bg-brand-danger/20 border border-brand-danger/40 px-3 py-2 text-sm text-center text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
