import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const operator = await prisma.operator.findFirst();
  if (!operator) return null;

  const completedShifts = await prisma.shift.findMany({
    where: { vehicle: { operatorId: operator.id }, status: "COMPLETED" },
    include: {
      trip: { include: { route: true } },
      bookings: true,
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  let totalGross = 0;
  const rows = completedShifts.map((s) => {
    const gross = s.bookings
      .filter((b) => b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + b.seatCount * s.trip.route.basePrice, 0);
    totalGross += gross;
    return {
      id: s.id,
      date: s.date,
      label: `${s.trip.route.origin} → ${s.trip.route.destination}`,
      gross,
      payout: gross * 0.85,
      fee: gross * 0.15,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payouts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Gross (completed)" value={formatMoney(totalGross)} />
        <Stat label="Marketplace fee (15%)" value={formatMoney(totalGross * 0.15)} />
        <Stat label="Net payout (85%)" value={formatMoney(totalGross * 0.85)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed shifts</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No completed shifts yet. Once a driver marks a shift complete, the
              escrowed funds release here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-brand-muted border-b border-brand-border">
                <tr>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Route</th>
                  <th className="py-2 pr-3 font-medium text-right">Gross</th>
                  <th className="py-2 pr-3 font-medium text-right">Fee</th>
                  <th className="py-2 pr-3 font-medium text-right">Payout</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-3">{formatDate(r.date)}</td>
                    <td className="py-3 pr-3">{r.label}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      {formatMoney(r.gross)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-brand-muted">
                      −{formatMoney(r.fee)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums font-medium">
                      {formatMoney(r.payout)}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant="success">RELEASED</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-5">
      <div className="text-xs uppercase tracking-wider text-brand-muted">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
