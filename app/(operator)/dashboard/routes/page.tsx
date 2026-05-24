import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RoutesPage() {
  const operator = await prisma.operator.findFirst();
  if (!operator) return null;

  const routes = await prisma.route.findMany({
    where: { operatorId: operator.id },
    include: { trips: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Routes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>
                {r.origin} → {r.destination}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-brand-muted">Base price</div>
                <div className="font-bold">{formatMoney(r.basePrice)}</div>
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-brand-muted mb-2">
                  Trip times
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.trips.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-md border border-brand-border bg-slate-50 px-2 py-1 text-xs font-mono"
                    >
                      {t.departureTime} → {t.arrivalTime}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
