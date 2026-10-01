import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import type { PublicThread } from "@/features/vartalap/components/vartalap-panel";

const threadSchema = z.object({
  questionId: z.string().min(1).max(120),
  displayName: z.string().min(1).max(80),
  question: z.string().min(1).max(2_000),
  reply: z.string().min(1).max(4_000),
  publishedAt: z.string().datetime({ offset: true }),
});

const readPublicThreads = unstable_cache(
  async (contentId: string): Promise<PublicThread[]> => {
    if (
      !process.env.AKB_PUBLISHING_SERVICE_URL ||
      !process.env.AKB_PUBLISHING_SERVICE_TOKEN
    )
      return [];
    try {
      const result = await callPublishingService<unknown>("vartalap_public", {
        contentId,
      });
      const parsed = z.array(threadSchema).max(100).safeParse(result.data);
      return result.ok && parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  },
  ["public-vartalap"],
  { revalidate: 300 },
);

export async function getPublicVartalap(
  contentId: string,
): Promise<PublicThread[]> {
  return readPublicThreads(contentId);
}
