import type { Metadata, Viewport } from "next";
import { DM_Mono, Syne } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "무한매수법 V4.0 계산기",
  description: "TQQQ 무한매수법 주문표 계산기 (라오어 V4.0)",
  applicationName: "TQQQ 무한매수",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/tqqq-app.svg",
    apple: "/icons/tqqq-app.svg",
  },
  appleWebApp: {
    capable: true,
    title: "TQQQ 무한매수",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${dmMono.variable} ${syne.variable}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
