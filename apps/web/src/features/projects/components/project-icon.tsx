import {
  Bot,
  Braces,
  Cpu,
  Database,
  type LucideProps,
  Network,
  Server,
  Wrench,
} from "lucide-react";

import type { ProjectContentDocument } from "../server/project-content-schema";

type ProjectIconName =
  ProjectContentDocument["frontmatter"]["technologies"][number]["icon"];

type ProjectIconProps = LucideProps & {
  name: ProjectIconName;
};

const iconByName = {
  code: Braces,
  database: Database,
  server: Server,
  ai: Bot,
  hardware: Cpu,
  network: Network,
  tool: Wrench,
} satisfies Record<ProjectIconName, typeof Braces>;

export function ProjectIcon({ name, ...props }: ProjectIconProps) {
  const Icon = iconByName[name];

  return <Icon {...props} />;
}
