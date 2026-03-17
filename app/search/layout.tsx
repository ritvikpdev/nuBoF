import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Foods | nuBoF",
  description: "Search the nuBoF database and log foods to your daily tracker.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
