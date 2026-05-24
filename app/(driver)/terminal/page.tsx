import { TerminalPinEntry } from "@/components/driver/terminal-pin-entry";

export default function TerminalLandingPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Sign in to your vehicle</h1>
          <p className="mt-1 text-sm text-white/60">
            Enter your driver PIN to begin shift.
          </p>
        </div>
        <TerminalPinEntry />
      </div>
    </div>
  );
}
