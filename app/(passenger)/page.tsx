import Link from "next/link";
import { SearchForm } from "@/components/passenger/search-form";

const featured = [
  { from: "Banff", to: "Lake Louise", price: "$32", duration: "45 min" },
  { from: "Calgary YYC", to: "Banff", price: "$74", duration: "1h 50m" },
  { from: "Lake Louise", to: "Jasper", price: "$129", duration: "4h 10m" },
  { from: "Vancouver", to: "Whistler", price: "$58", duration: "2h 00m" },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-sky-500 to-brand-dark opacity-95" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.18) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider border border-white/20">
              Live across the Canadian Rockies
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">
              Shuttle the mountains with real-time confidence.
            </h1>
            <p className="mt-4 text-lg text-white/85">
              One marketplace for trusted local operators. Real-time vehicle tracking,
              guaranteed seats, and tap-to-board QR tickets — no apps required.
            </p>
          </div>
          <div className="mt-10 max-w-4xl">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-semibold tracking-tight">
            Popular routes
          </h2>
          <Link
            href="/search"
            className="text-sm text-brand-blue hover:text-brand-blue-dark"
          >
            Browse all →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((r) => (
            <Link
              key={`${r.from}-${r.to}`}
              href={`/search?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}`}
              className="group rounded-lg border border-brand-border bg-white p-5 hover:border-brand-blue hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 text-sm text-brand-muted">
                <span>{r.from}</span>
                <span>→</span>
                <span>{r.to}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-brand-dark">
                  {r.price}
                </span>
                <span className="text-sm text-brand-muted">/ seat</span>
              </div>
              <div className="mt-1 text-xs text-brand-muted">
                Typical {r.duration}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Real-time tracking",
              body: "Watch your vehicle approach the pick-up bay. Live GPS, no refreshing.",
            },
            {
              title: "Guaranteed seat",
              body: "Race-condition-safe inventory means the seat you booked is the seat you get.",
            },
            {
              title: "Tap-to-board QR",
              body: "Driver scans your ticket at the bay. Boarded in two seconds, every time.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-brand-border bg-white p-6"
            >
              <h3 className="font-semibold text-brand-dark">{f.title}</h3>
              <p className="mt-2 text-sm text-brand-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
