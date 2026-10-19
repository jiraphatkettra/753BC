import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import AuthProvider from "@/components/shared/AuthProvider";
import InteractiveDotGrid from "@/components/shared/InteractiveDotGrid";
import { auth } from "@/lib/auth";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Lynn Community - Discord Platform & Events",
  description: "Web Platform สำหรับ Discord Community จัดการกิจกรรม, กระดานอันดับ, แนบสลิป และระบบคอมมูนิตี้",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="th" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#070809] text-[#f5f5f7] relative">
        {/* Interactive Responsive Dot-Matrix Background Layer */}
        <InteractiveDotGrid />
        <AuthProvider session={session}>
          <Navbar />
          <main className="relative z-10 flex-1 pt-[64px]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
