import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const operator = await prisma.operator.findFirst({
    where: { companyId: { not: null } },
  });
  if (!operator || !operator.companyId) return null;
  const companyId = operator.companyId;

  const drivers = await prisma.driver.findMany({
    where: { companyId },
    include: {
      User: { select: { phoneNumber: true } },
    },
    orderBy: { displayName: "asc" },
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
                <th className="py-2 pr-3 font-medium">Licence</th>
                <th className="py-2 pr-3 font-medium">PIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {drivers.map((d) => (
                <tr key={d.uid}>
                  <td className="py-3 pr-3 font-medium">{d.displayName}</td>
                  <td className="py-3 pr-3">{d.User.phoneNumber ?? "—"}</td>
                  <td className="py-3 pr-3 text-xs text-brand-muted">
                    {d.licenceClass} · {d.licenceProvince ?? "—"}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-brand-muted">
                    {d.driverPinHash ? "•••• set" : "not set"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-brand-muted">
            PINs are SHA-256 hashed at rest; the plaintext cannot be recovered.
            Issue a new PIN by triggering a reset from the driver detail page
            (TODO once driver-management UI lands).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
