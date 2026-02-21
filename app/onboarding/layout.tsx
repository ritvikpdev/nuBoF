import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Profile | NutriTrack",
  description: "Tell us about yourself so we can calculate your personalised nutrition targets.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
