import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate, startOfDay, endOfDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

function hhmm(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

// TODO: read operator.uid from the better-auth session
// (auth.api.getSession({ headers: await headers() })) and look up via uid.
// For now we resolve the first Operator + Company to keep the dashboard
// renderable in dev before session wiring is finished.
async function resolveOperatorContext() {
  const operator = await prisma.operator.findFirst({
    where: { companyId: { not: null } },
  });
  if (!operator || !operator.companyId) return null;
  const company = await prisma.shuttleCompany.findUnique({
    where: { id: operator.companyId },
    include: {
      Vehicles: { select: { id: true } },
      Drivers: { select: { uid: true } },
      Routes: { select: { id: true } },
    },
  });
  if (!company) return null;
  return { operator, company };
}

export default async function DashboardOverviewPage() {
  const ctx = await resolveOperatorContext();
  if (!ctx) {
    return (
      <div className="rounded-lg border border-brand-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">No operator data yet</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Run <code className="font-mono">bun db:seed</code> to populate the demo
          operator and shifts.
        </p>
      </div>
    );
  }

  const { company } = ctx;
  const today = new Date();

  const [shiftsToday, paymentsTodayAgg, activeShifts] = await Promise.all([
    prisma.shift.findMany({
      where: {
        Trip: { serviceDate: { gte: startOfDay(today), lte: endOfDay(today) } },
        Vehicle: { companyId: company.id },
      },
      include: {
        Vehicle: true,
        Trip: {
          include: {
            Template: { include: { Route: true } },
            TripLegs: {
              include: {
                LegTemplate: {
                  include: {
                    FromStop: { select: { name: true } },
                    ToStop: { select: { name: true } },
                  },
                },
              },
              orderBy: { departAt: "asc" },
            },
          },
        },
        TripLegs: { select: { seatsBooked: true } },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        companyId: company.id,
        createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      _sum: { amountTotalCents: true, applicationFeeCents: true },
      _count: { _all: true },
    }),
    prisma.shift.count({
      where: { status: "EN_ROUTE", Vehicle: { companyId: company.id } },
    }),
  ]);

  const grossTodayCents = paymentsTodayAgg._sum.amountTotalCents ?? 0;
  const feeTodayCents = paymentsTodayAgg._sum.applicationFeeCents ?? 0;
  const netPayoutCad = (grossTodayCents - feeTodayCents) / 100;
  const bookingsTodayCount = paymentsTodayAgg._count._all;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{company.displayName}</h1>
        <p className="text-sm text-brand-muted">
          {formatDate(today)} · {company.Vehicles.length} vehicles ·{" "}
          {company.Drivers.length} drivers · {company.Routes.length} routes
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Active shifts" value={String(activeShifts)} />
        <Stat label="Shifts today" value={String(shiftsToday.length)} />
        <Stat label="Bookings today" value={String(bookingsTodayCount)} />
        <Stat label="Net payout today" value={formatMoney(netPayoutCad)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s shifts</CardTitle>
          <Link
            href="/dashboard/shifts"
            className="text-sm text-brand-blue hover:text-brand-blue-dark"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {shiftsToday.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No shifts scheduled for today.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {shiftsToday.map((s) => {
                const firstLeg = s.Trip.TripLegs[0];
                const lastLeg = s.Trip.TripLegs[s.Trip.TripLegs.length - 1];
                const seatsBookedTotal = s.TripLegs.reduce(
                  (sum, tl) => sum + tl.seatsBooked,
                  0,
                );
                return (
                  <div key={s.id} className="py-3 flex items-center gap-4">
                    <div className="w-20 tabular-nums font-semibold">
                      {firstLeg ? hhmm(firstLeg.departAt) : "—"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {firstLeg?.LegTemplate.FromStop.name ?? "—"} →{" "}
                        {lastLeg?.LegTemplate.ToStop.name ?? "—"}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {s.Vehicle.make} {s.Vehicle.modelName} ·{" "}
                        {s.Vehicle.plateNumber}
                      </div>
                    </div>
                    <div className="text-sm text-brand-muted tabular-nums">
                      {seatsBookedTotal} seats
                    </div>
                    <Badge
                      variant={
                        s.status === "EN_ROUTE"
                          ? "success"
                          : s.status === "COMPLETED"
                            ? "muted"
                            : "default"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
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
