import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/shifts", label: "Shifts" },
  { href: "/dashboard/routes", label: "Routes" },
  { href: "/dashboard/vehicles", label: "Vehicles" },
  { href: "/dashboard/drivers", label: "Drivers" },
  { href: "/dashboard/payouts", label: "Payouts" },
];

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-brand-bg">
      <aside className="w-64 shrink-0 border-r border-brand-border bg-white flex flex-col">
        <Link
          href="/dashboard"
          className="h-16 border-b border-brand-border px-5 flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-md bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
            GS
          </div>
          <span className="font-semibold tracking-tight">Operator</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-brand-dark hover:bg-slate-100 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-brand-border">
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm text-brand-muted hover:bg-slate-100"
          >
            ← Back to marketplace
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-brand-border bg-white flex items-center justify-between px-6">
          <div className="text-sm text-brand-muted">
            Mountain Shuttle Operations Console
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-muted">Demo Operator</span>
            <div className="h-8 w-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-semibold">
              DO
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
