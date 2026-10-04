"use client";

import {
  Activity,
  BookOpenText,
  Bot,
  BriefcaseBusiness,
  GalleryHorizontalEnd,
  Gauge,
  Image,
  LayoutDashboard,
  Library,
  MessageSquareText,
  Music2,
  NotebookPen,
  ScrollText,
  Sparkles,
  UserRound,
} from "lucide-react";
import ImageAsset from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { AdminLogoutButton } from "./admin-logout-button";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const groups: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        description: "Status and shortcuts",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Consented activity and health",
        icon: Gauge,
      },
    ],
  },
  {
    label: "Portfolio",
    items: [
      {
        href: "/admin/profile",
        label: "Profile",
        description: "About identity and portrait",
        icon: UserRound,
      },
      {
        href: "/admin/availability",
        label: "Availability",
        description: "Public work status",
        icon: BriefcaseBusiness,
      },
      {
        href: "/admin/projects",
        label: "Projects",
        description: "Project registry and covers",
        icon: GalleryHorizontalEnd,
      },
      {
        href: "/admin/reflections",
        label: "Reflections",
        description: "Daily Sanskrit reflection",
        icon: Sparkles,
      },
      {
        href: "/admin/galleries",
        label: "Galleries",
        description: "Travel, painting and images",
        icon: Image,
      },
      {
        href: "/admin/media",
        label: "Media & music",
        description: "Uploads and portfolio audio",
        icon: Music2,
      },
    ],
  },
  {
    label: "Publishing",
    items: [
      {
        href: "/admin/content",
        label: "Journal & Knowledge",
        description: "Draft and publish writing",
        icon: NotebookPen,
      },
      {
        href: "/admin/pravaah",
        label: "Pravaah",
        description: "Public signal archive",
        icon: Activity,
      },
      {
        href: "/admin/vartalap",
        label: "Vartalap",
        description: "Questions and moderation",
        icon: MessageSquareText,
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        description: "Publishing delivery controls",
        icon: BookOpenText,
      },
    ],
  },
  {
    label: "Private operations",
    items: [
      {
        href: "/admin/aeva",
        label: "Aeva",
        description: "Approved memory and sources",
        icon: Bot,
      },
      {
        href: "/admin/studio",
        label: "Private Studio",
        description: "Contacts and follow-ups",
        icon: Library,
      },
      {
        href: "/admin/requests",
        label: "Requests",
        description: "Contact and privacy inbox",
        icon: MessageSquareText,
      },
      {
        href: "/admin/audit",
        label: "Audit log",
        description: "Recorded administrative changes",
        icon: ScrollText,
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminSidebar({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();
  return (
    <aside className="akb-admin-sidebar">
      <div className="akb-admin-sidebar__brand">
        <ImageAsset
          src="/brand/akb-logo.svg"
          alt="AKB Studio"
          width={126}
          height={42}
          priority
        />
        <div>
          <strong>Private Studio</strong>
          <span>Portfolio administration</span>
        </div>
      </div>

      <nav aria-label="Admin sections" className="akb-admin-sidebar__nav">
        {groups.map((group) => (
          <section key={group.label} className="akb-admin-nav-group">
            <h2>{group.label}</h2>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon aria-hidden={true} className="akb-admin-nav-icon" />
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="akb-admin-sidebar__footer">
        <span className="akb-admin-user">
          Signed in as <strong>{userLabel}</strong>
        </span>
        <Link href="/" target="_blank">
          View public site
        </Link>
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
