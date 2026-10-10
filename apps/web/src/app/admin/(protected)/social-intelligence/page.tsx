import { SocialIntelligenceConsole } from "@/features/admin/components/social-intelligence-console";
import { requireAdmin } from "@/features/admin/server/admin-auth";
import { socialIntelligenceSnapshot } from "@/features/social-intelligence/server/manifest";
import { prisma } from "@/server/db/prisma";

export default async function SocialIntelligencePage() {
  await requireAdmin("users:manage");
  const health = await prisma.operationalHealth.findMany({
    where: { key: { startsWith: "social_" } },
    orderBy: { key: "asc" },
    select: {
      key: true,
      status: true,
      summary: true,
      lastCheckedAt: true,
    },
  });

  return (
    <SocialIntelligenceConsole
      initialSnapshot={socialIntelligenceSnapshot()}
      health={health.map((item) => ({
        ...item,
        lastCheckedAt: item.lastCheckedAt.toISOString(),
      }))}
    />
  );
}
