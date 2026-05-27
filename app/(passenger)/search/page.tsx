import Link from "next/link";
import { searchLegs } from "@/app/actions/search";
import { SearchForm } from "@/components/passenger/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string; destination?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const origin = sp.origin ?? "";
  const destination = sp.destination ?? "";
  const date = sp.date ?? new Date().toISOString().slice(0, 10);

  const hasQuery = origin && destination;
  const results = hasQuery
    ? await searchLegs({ origin, destination, date: new Date(date) })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="bg-brand-dark rounded-xl p-6 mb-8">
        <SearchForm
          defaultOrigin={origin}
          defaultDestination={destination}
          defaultDate={date}
        />
      </div>

      {!hasQuery ? (
        <p className="text-brand-muted">
          Enter an origin and destination to find available shuttles.
        </p>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-brand-dark font-medium">
              No shuttles found for this route on {formatDate(new Date(date))}.
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              Try a different date or check our popular routes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {results.length} shuttle{results.length === 1 ? "" : "s"} on {formatDate(new Date(date))}
            </h1>
          </div>
          {results.map((s) => (
            <Card key={s.id} className="hover:border-brand-blue transition">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-brand-muted">
                    <span>{s.operatorName}</span>
                    <span>·</span>
                    <span>{s.vehicleLabel}</span>
                    {s.status === "BOARDING" || s.status === "IN_TRANSIT" ? (
                      <Badge variant="success" className="ml-1">
                        {s.status}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div>
                      <div className="text-2xl font-bold tabular-nums">
                        {s.departureTime}
                      </div>
                      <div className="text-xs text-brand-muted">{s.origin}</div>
                    </div>
                    <div className="text-brand-muted">→</div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums">
                        {s.arrivalTime}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {s.destination}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end md:items-end justify-between md:justify-center gap-2">
                  <div className="text-right">
                    <div className="text-xl font-bold text-brand-dark">
                      {formatMoney(s.basePrice)}
                    </div>
                    <div className="text-xs text-brand-muted">
                      {s.seatsAvailable} of {s.capacity} seats left
                    </div>
                  </div>
                  <Button asChild disabled={s.seatsAvailable === 0}>
                    <Link href={`/book/${s.id}`}>
                      {s.seatsAvailable === 0 ? "Sold out" : "Book"}
                    </Link>
                  </Button>
                  {/* /book/[legId] — the search result id is a TripLeg id. */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
