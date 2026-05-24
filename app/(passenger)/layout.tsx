import Link from "next/link";

export default function PassengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-brand-border bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-brand-blue text-white flex items-center justify-center font-bold">
              GS
            </div>
            <span className="font-semibold text-brand-dark tracking-tight">
              GoShuttly
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="text-brand-muted hover:text-brand-dark transition"
            >
              Book a ride
            </Link>
            <Link
              href="/dashboard"
              className="text-brand-muted hover:text-brand-dark transition"
            >
              For operators
            </Link>
            <Link
              href="/terminal"
              className="text-brand-muted hover:text-brand-dark transition"
            >
              Driver terminal
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-brand-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-brand-muted flex flex-col sm:flex-row gap-2 justify-between">
          <div>© {new Date().getFullYear()} GoShuttly Marketplace Inc.</div>
          <div>Banff · Lake Louise · Jasper · Whistler</div>
        </div>
      </footer>
    </div>
  );
}
