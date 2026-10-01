import type { Metadata } from "next";
import "@/features/admin/admin-shell.css";

export const metadata: Metadata = {
  title: "Private operations",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default function AdminRouteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
