import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

function minutesToHhmm(min: number): string {
  const wrapped = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default async function RoutesPage() {
  const operator = await prisma.operator.findFirst({
    where: { companyId: { not: null } },
  });
  if (!operator || !operator.companyId) return null;
  const companyId = operator.companyId;

  const routes = await prisma.route.findMany({
    where: { companyId },
    include: {
      ScheduleTemplates: {
        include: {
          LegTemplates: {
            include: {
              FromStop: { select: { name: true } },
              ToStop: { select: { name: true } },
            },
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Routes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((r) => {
          const totalCents = r.ScheduleTemplates[0]?.LegTemplates.reduce(
            (sum, l) => sum + l.priceCents,
            0,
          ) ?? 0;
          const firstLeg = r.ScheduleTemplates[0]?.LegTemplates[0];
          const lastLeg =
            r.ScheduleTemplates[0]?.LegTemplates[
              r.ScheduleTemplates[0].LegTemplates.length - 1
            ];
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle>
                  {firstLeg?.FromStop.name ?? r.displayName}
                  {lastLeg ? ` → ${lastLeg.ToStop.name}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-brand-muted">
                    End-to-end price (sum of legs)
                  </div>
                  <div className="font-bold">
                    {formatMoney(totalCents / 100)}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-brand-muted mb-2">
                    Schedules
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.ScheduleTemplates.map((st) => {
                      const first = st.LegTemplates[0];
                      const last = st.LegTemplates[st.LegTemplates.length - 1];
                      if (!first || !last) return null;
                      return (
                        <span
                          key={st.id}
                          className="rounded-md border border-brand-border bg-slate-50 px-2 py-1 text-xs font-mono"
                        >
                          {minutesToHhmm(first.departMin)} →{" "}
                          {minutesToHhmm(last.arriveMin)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
