import { AdminShell } from "@/components/AdminShell";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { MfaManager } from "./SecurityClient";

export const dynamic = "force-dynamic";

async function getSecurityState(adminId: number) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, desc } = await import("drizzle-orm");

    const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, adminId) });
    const sessions = await db
      .select()
      .from(schema.adminSessions)
      .where(eq(schema.adminSessions.adminUserId, adminId))
      .orderBy(desc(schema.adminSessions.createdAt))
      .limit(10);

    return { mfaEnabled: !!user?.mfaEnabled, sessions };
  } catch (e) {
    console.error("[admin/security]", e);
    return { mfaEnabled: false, sessions: [] as unknown[] };
  }
}

export default async function AdminSecurityPage() {
  const admin = await getCurrentAdmin();
  const { mfaEnabled, sessions } = await getSecurityState(admin?.id ?? 0);

  return (
    <AdminShell title="Security">
      <div className="mb-8 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold text-gray-900">Two-factor authentication</h2>
        <p className="mb-4 text-sm text-gray-500">Adds a 6-digit authenticator code on top of your password.</p>
        <MfaManager enabled={mfaEnabled} />
      </div>

      <div className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold text-gray-900">Active sessions</h2>
        <p className="mb-4 text-sm text-gray-500">Recent sign-ins on your account. Login lockout kicks in after 8 failed attempts (15-minute cooldown).</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Signed in</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(sessions as Array<{ id: number; createdAt: Date; expiresAt: Date; ipAddress: string | null; userAgent: string | null }>).map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 text-xs text-gray-600">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(s.expiresAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">{s.ipAddress || "—"}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">{(s.userAgent || "—").slice(0, 60)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
