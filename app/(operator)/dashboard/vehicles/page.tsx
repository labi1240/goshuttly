import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const operator = await prisma.operator.findFirst({
    where: { companyId: { not: null } },
  });
  if (!operator || !operator.companyId) return null;
  const companyId = operator.companyId;

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vehicles</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fleet</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-brand-muted border-b border-brand-border">
              <tr>
                <th className="py-2 pr-3 font-medium">Code</th>
                <th className="py-2 pr-3 font-medium">Plate</th>
                <th className="py-2 pr-3 font-medium">Make / Model</th>
                <th className="py-2 pr-3 font-medium">Capacity</th>
                <th className="py-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="py-3 pr-3 font-mono">{v.code}</td>
                  <td className="py-3 pr-3 font-mono">{v.plateNumber}</td>
                  <td className="py-3 pr-3">
                    {v.make} {v.modelName} ({v.year})
                  </td>
                  <td className="py-3 pr-3 tabular-nums">{v.seatCapacity}</td>
                  <td className="py-3 pr-3 text-xs">{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
