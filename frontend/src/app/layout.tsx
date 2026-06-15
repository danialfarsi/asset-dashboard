import type { Metadata } from "next";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const vazir = localFont({
  src: [
    { path: "../../public/fonts/Vazirmatn-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/Vazirmatn-Medium.woff2",  weight: "500" },
    { path: "../../public/fonts/Vazirmatn-Bold.woff2",    weight: "700" },
  ],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asset Dashboard",
  description: "Asset Management System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-vazir)]">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
