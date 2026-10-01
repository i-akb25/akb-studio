import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, twoFactor } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { prisma } from "@/server/db/prisma";

function trustedOrigins(): string[] {
  const origins = new Set<string>();
  for (const value of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.BETTER_AUTH_URL,
  ]) {
    if (!value?.trim()) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {}
  }
  return [...origins];
}

export const auth = betterAuth({
  appName: "AKB Studio",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: trustedOrigins(),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 14,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  account: { encryptOAuthTokens: true },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => ({
          data: { ...session, ipAddress: null },
        }),
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: "database",
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    database: { joins: true },
  },
  plugins: [
    admin({
      defaultRole: "viewer",
      adminRoles: ["owner"],
      roles: {
        owner: adminAc,
        editor: userAc,
        moderator: userAc,
        viewer: userAc,
      },
    }),
    twoFactor({ issuer: "AKB Studio" }),
    nextCookies(),
  ],
});
