"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 2500);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-muted">
      <span className="h-2 w-2 rounded-full bg-brand-warning animate-ping" />
      <span>Checking payment status...</span>
    </div>
  );
}
