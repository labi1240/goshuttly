"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SearchForm({
  defaultOrigin = "",
  defaultDestination = "",
  defaultDate = new Date().toISOString().slice(0, 10),
}: {
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [date, setDate] = useState(defaultDate);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams({ origin, destination, date });
    router.push(`/search?${qs.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 rounded-xl bg-white p-4 shadow-xl border border-white/40"
    >
      <div>
        <Label htmlFor="origin">From</Label>
        <Input
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Banff"
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="destination">To</Label>
        <Input
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Lake Louise"
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1.5"
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full md:w-auto">
          Search shuttles
        </Button>
      </div>
    </form>
  );
}
