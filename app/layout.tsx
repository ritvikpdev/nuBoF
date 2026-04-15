import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { NuriChat } from "@/components/nuri/nuri-chat";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nuBoF — Sync Your Body's Fuel",
  description: "Syncing your Body's Fuel with Precision Nutrition. Track Macronutrients and Micronutrients tailored to your body.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <QueryProvider>
            <AuthProvider>
              <Navbar />
              {/* pb-16 on mobile clears the 64px BottomNav; removed on sm+ */}
              <main className="pb-16 sm:pb-0">{children}</main>
              <BottomNav />
              <NuriChat />
              <Toaster richColors closeButton />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
