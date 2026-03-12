import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MagicHouse Next Migration",
  description: "Next.js App Router scaffold for the MagicHouse migration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
