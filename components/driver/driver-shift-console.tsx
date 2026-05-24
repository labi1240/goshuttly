"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setShiftStatus } from "@/app/actions/telemetry";
import { QrScanner } from "./qr-scanner";
import { TelemetryLoop } from "./telemetry-loop";
import { DriverWakeLock } from "./wake-lock";

interface ShiftInfo {
  id: string;
  status: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  vehiclePlate: string;
  vehicleCapacity: number;
  driverName: string;
}

interface BookingInfo {
  id: string;
  passengerName: string;
  seatCount: number;
  boardedStatus: string;
}

interface DriverShiftConsoleProps {
  shift: ShiftInfo;
  bookings: BookingInfo[];
}

export function DriverShiftConsole({ shift, bookings }: DriverShiftConsoleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(shift.status);

  const totalBookedSeats = bookings.reduce((sum, b) => sum + b.seatCount, 0);
  const boardedSeats = bookings
    .filter((b) => b.boardedStatus === "BOARDED")
    .reduce((sum, b) => sum + b.seatCount, 0);

  const handleStatusChange = (newStatus: "SCHEDULED" | "EN_ROUTE" | "COMPLETED" | "CANCELLED") => {
    startTransition(async () => {
      const result = await setShiftStatus(shift.id, newStatus);
      if (result.success) {
        setStatus(newStatus);
        router.refresh();
      }
    });
  };

  const handleBoarded = (passengerName: string, seatCount: number) => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-4 md:p-8">
      <DriverWakeLock />
      
      {/* Top Telemetry & Status Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
        <div>
          <span className="text-xs text-brand-muted uppercase tracking-wider block mb-1">Telemetry Loop</span>
          <TelemetryLoop shiftId={shift.id} active={status === "EN_ROUTE"} />
        </div>

        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
          <span className="text-xs text-brand-muted uppercase tracking-wider block mb-1">Shift Status</span>
          <div className="flex gap-2 w-full sm:w-auto">
            {status === "SCHEDULED" && (
              <button
                disabled={isPending}
                onClick={() => handleStatusChange("EN_ROUTE")}
                className="driver-tap-target w-full sm:w-auto px-6 rounded-lg bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold flex items-center justify-center transition-colors disabled:opacity-50"
              >
                Start Shift (En Route)
              </button>
            )}
            {status === "EN_ROUTE" && (
              <button
                disabled={isPending}
                onClick={() => handleStatusChange("COMPLETED")}
                className="driver-tap-target w-full sm:w-auto px-6 rounded-lg bg-brand-success hover:bg-emerald-600 text-white font-semibold flex items-center justify-center transition-colors disabled:opacity-50"
              >
                Complete Shift
              </button>
            )}
            {status === "COMPLETED" && (
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold text-sm">
                Shift Completed
              </span>
            )}
            {status === "CANCELLED" && (
              <span className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg font-semibold text-sm">
                Shift Cancelled
              </span>
            )}
            {status !== "COMPLETED" && status !== "CANCELLED" && (
              <button
                disabled={isPending}
                onClick={() => {
                  if (confirm("Are you sure you want to cancel this shift?")) {
                    handleStatusChange("CANCELLED");
                  }
                }}
                className="driver-tap-target px-4 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 font-semibold border border-red-500/30 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Shift Info & QR Scanner */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Shift Details</h2>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-brand-muted block">Driver</span>
                <span className="font-medium text-white/90">{shift.driverName}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Vehicle Plate</span>
                <span className="font-medium text-white/90">{shift.vehiclePlate}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Departure</span>
                <span className="font-medium text-white/90">{shift.departureTime}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Arrival (Est)</span>
                <span className="font-medium text-white/90">{shift.arrivalTime}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <span className="text-brand-muted block text-sm">Route</span>
              <span className="font-semibold text-lg text-brand-blue">
                {shift.origin} &rarr; {shift.destination}
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Ticket Check-In</h2>
            <p className="text-sm text-brand-muted">
              Use the camera scanner below to validate passenger QR code tickets.
            </p>
            <QrScanner shiftId={shift.id} onBoarded={handleBoarded} />
          </div>
        </div>

        {/* Right Column: Passenger Manifest */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight">Passenger Manifest</h2>
            <div className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full text-brand-muted">
              {boardedSeats} / {totalBookedSeats} Boarded ({shift.vehicleCapacity - totalBookedSeats} Open)
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-brand-muted text-sm">
                No bookings registered for this shift.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${
                    booking.boardedStatus === "BOARDED"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100"
                      : "bg-white/5 border-white/10 text-white/90"
                  }`}
                >
                  <div>
                    <span className="font-medium block">{booking.passengerName}</span>
                    <span className="text-xs text-brand-muted">
                      {booking.seatCount} seat{booking.seatCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div>
                    {booking.boardedStatus === "BOARDED" ? (
                      <span className="text-xs font-semibold text-emerald-400 px-2 py-1 bg-emerald-500/20 rounded-md">
                        Boarded
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-400 px-2 py-1 bg-amber-500/20 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
