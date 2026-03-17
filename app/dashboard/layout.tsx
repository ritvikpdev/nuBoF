import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | nuBoF",
  description: "Your daily nutrition overview.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
