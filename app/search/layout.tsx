import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Foods | NutriTrack",
  description: "Search the Edamam database and log foods to your daily tracker.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
