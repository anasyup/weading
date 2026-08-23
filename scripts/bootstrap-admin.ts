/* eslint-disable no-console */
// Creates (or resets) the first Super Admin on a fresh production database.
// Usage:  npx tsx scripts/bootstrap-admin.ts <email> <password>
//         npx tsx scripts/bootstrap-admin.ts              → defaults below

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] ?? "admin@noorbridal.test").toLowerCase();
  const password = process.argv[3] ?? "Admin#2026";

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  let role = await prisma.role.findUnique({ where: { key: "SUPER_ADMIN" } });
  if (!role) {
    role = await prisma.role.create({
      data: { key: "SUPER_ADMIN", name: "Super Admin", description: "Full platform access" },
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
        roles: { deleteMany: {}, create: { roleId: role.id } },
      },
    });
    console.log(`Super Admin updated: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: role.id } },
      },
    });
    console.log(`Super Admin created: ${email}`);
  }
  console.log("⚠ Change this password after first login (production).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
