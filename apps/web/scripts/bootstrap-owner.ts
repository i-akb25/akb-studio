import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/server/db/prisma-client";

async function main() {
  const [emailArgument, passwordArgument, ...nameParts] = process.argv.slice(2);
  const email = emailArgument?.trim().toLowerCase();
  const password = passwordArgument ?? "";
  const name = nameParts.join(" ").trim() || "AKB Studio Owner";

  if (!email || !email.includes("@") || password.length < 14) {
    console.error(
      "Usage: pnpm --filter @akb-studio/web admin:bootstrap <email> <14+ character password> [display name]",
    );
    process.exit(1);
  }

  const existingOwner = await prisma.user.findFirst({
    where: { role: "owner" },
  });
  if (existingOwner && existingOwner.email !== email) {
    console.error(
      `An owner already exists (${existingOwner.email}). Refusing to create another.`,
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, emailVerified: true, role: "owner" },
    update: {
      name,
      emailVerified: true,
      role: "owner",
      banned: false,
      banReason: null,
      banExpires: null,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: user.id },
    },
    create: {
      providerId: "credential",
      accountId: user.id,
      userId: user.id,
      password: passwordHash,
    },
    update: { password: passwordHash },
  });

  console.log(
    `Owner ${user.email} is ready. Sign in and complete mandatory TOTP setup immediately.`,
  );
  await prisma.$disconnect();
}

void main().catch(async (error) => {
  console.error(
    error instanceof Error ? error.message : "Owner bootstrap failed",
  );
  await prisma.$disconnect().catch(() => {});
  process.exitCode = 1;
});
