export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
            GS
          </div>
          <span className="font-semibold tracking-tight text-sm">
            Driver Terminal
          </span>
        </div>
        <div className="text-xs text-white/60 font-mono">
          {process.env.NODE_ENV === "development" ? "DEV" : "PROD"}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
