"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureSeatBooking } from "@/app/actions/booking";
import { formatMoney } from "@/lib/utils";

export function BookingForm({
  shiftId,
  pricePerSeat,
  maxSeats,
}: {
  shiftId: string;
  pricePerSeat: number;
  maxSeats: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await secureSeatBooking({
        shiftId,
        passengerName: String(formData.get("passengerName")),
        passengerEmail: String(formData.get("passengerEmail")),
        passengerPhone: String(formData.get("passengerPhone")),
        seatsRequested: seats,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.location.href = result.checkoutSessionUrl;
    });
  }

  const total = pricePerSeat * seats;
  const canBook = maxSeats > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="passengerName">Full name</Label>
        <Input
          id="passengerName"
          name="passengerName"
          required
          placeholder="Jane Smith"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="passengerEmail">Email</Label>
        <Input
          id="passengerEmail"
          name="passengerEmail"
          type="email"
          required
          placeholder="jane@example.com"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="passengerPhone">Phone</Label>
        <Input
          id="passengerPhone"
          name="passengerPhone"
          type="tel"
          required
          placeholder="+1 403 555 0100"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="seats">Seats</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSeats((n) => Math.max(1, n - 1))}
            disabled={!canBook}
          >
            −
          </Button>
          <Input
            id="seats"
            type="number"
            value={seats}
            min={1}
            max={maxSeats}
            readOnly
            className="text-center w-20"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSeats((n) => Math.min(maxSeats, n + 1))}
            disabled={!canBook}
          >
            +
          </Button>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-brand-border flex items-center justify-between">
        <span className="font-medium">Total</span>
        <span className="text-xl font-bold tabular-nums">
          {formatMoney(total)}
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-brand-danger/10 border border-brand-danger/30 px-3 py-2 text-sm text-brand-danger">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || !canBook}
      >
        {pending ? "Reserving seat…" : `Confirm & pay ${formatMoney(total)}`}
      </Button>
      <p className="text-xs text-brand-muted text-center">
        Stripe escrow holds funds until your ride is completed. 15% marketplace fee.
      </p>
    </form>
  );
}
