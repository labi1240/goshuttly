import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const operator = await prisma.operator.findFirst({
    where: { companyId: { not: null } },
  });
  if (!operator || !operator.companyId) return null;
  const companyId = operator.companyId;

  // Payment-table driven. Each Booking has exactly one Payment; we aggregate
  // successful payments scoped to this operator's company.
  const payments = await prisma.payment.findMany({
    where: { companyId, status: "SUCCEEDED" },
    include: {
      Booking: {
        include: {
          BookingLegs: {
            include: {
              TripLeg: {
                include: {
                  LegTemplate: {
                    include: {
                      FromStop: { select: { name: true } },
                      ToStop: { select: { name: true } },
                    },
                  },
                  Trip: { select: { serviceDate: true } },
                },
              },
            },
            orderBy: { TripLeg: { departAt: "asc" } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let totalGrossCents = 0;
  let totalFeeCents = 0;
  let totalNetCents = 0;

  const rows = payments.map((p) => {
    totalGrossCents += p.amountTotalCents;
    totalFeeCents += p.applicationFeeCents;
    totalNetCents += p.operatorNetCents;

    const firstLeg = p.Booking.BookingLegs[0];
    const lastLeg = p.Booking.BookingLegs[p.Booking.BookingLegs.length - 1];

    return {
      id: p.id,
      date: p.createdAt,
      serviceDate: firstLeg?.TripLeg.Trip.serviceDate ?? p.createdAt,
      label:
        firstLeg && lastLeg
          ? `${firstLeg.TripLeg.LegTemplate.FromStop.name} → ${lastLeg.TripLeg.LegTemplate.ToStop.name}`
          : p.Booking.reference,
      grossCents: p.amountTotalCents,
      feeCents: p.applicationFeeCents,
      netCents: p.operatorNetCents,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payouts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Gross collected" value={formatMoney(totalGrossCents / 100)} />
        <Stat
          label="Marketplace fee"
          value={formatMoney(totalFeeCents / 100)}
        />
        <Stat label="Net payout" value={formatMoney(totalNetCents / 100)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No payments collected yet. Once Stripe confirms a checkout, the
              payment lands here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-brand-muted border-b border-brand-border">
                <tr>
                  <th className="py-2 pr-3 font-medium">Service date</th>
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
                    <td className="py-3 pr-3">{formatDate(r.serviceDate)}</td>
                    <td className="py-3 pr-3">{r.label}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      {formatMoney(r.grossCents / 100)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-brand-muted">
                      −{formatMoney(r.feeCents / 100)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums font-medium">
                      {formatMoney(r.netCents / 100)}
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
