import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const operator = await prisma.operator.findFirst();
  if (!operator) return null;

  const drivers = await prisma.driver.findMany({
    where: { operatorId: operator.id },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Drivers</h1>
      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-brand-muted border-b border-brand-border">
              <tr>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Phone</th>
                <th className="py-2 pr-3 font-medium">Terminal PIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 pr-3 font-medium">{d.name}</td>
                  <td className="py-3 pr-3">{d.phone}</td>
                  <td className="py-3 pr-3 font-mono">{d.driverPin}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-brand-muted">
            Drivers enter their PIN at <span className="font-mono">/terminal</span> on
            the in-vehicle device to start their shift.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
