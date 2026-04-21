/**
 * Create the first admin user.
 * Usage: npx tsx scripts/create-admin.ts <email> <password>
 */

import { scryptSync, randomBytes } from "node:crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
    process.exit(1);
  }

  const { db } = await import("@vacationdeals/db");
  const schema = await import("@vacationdeals/db");
  const { eq } = await import("drizzle-orm");

  const existing = await db.query.adminUsers.findFirst({
    where: eq(schema.adminUsers.email, email.toLowerCase()),
  });

  if (existing) {
    await db.update(schema.adminUsers)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(schema.adminUsers.id, existing.id));
    console.log(`Updated password for ${email}`);
  } else {
    await db.insert(schema.adminUsers).values({
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: "super-admin",
    });
    console.log(`Created admin: ${email}`);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
