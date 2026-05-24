import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const operator = await prisma.operator.findFirst();
  if (!operator) return null;

  const vehicles = await prisma.vehicle.findMany({
    where: { operatorId: operator.id },
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
                <th className="py-2 pr-3 font-medium">Plate</th>
                <th className="py-2 pr-3 font-medium">Make / Model</th>
                <th className="py-2 pr-3 font-medium">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="py-3 pr-3 font-mono">{v.plateNumber}</td>
                  <td className="py-3 pr-3">{v.makeModel}</td>
                  <td className="py-3 pr-3 tabular-nums">{v.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
