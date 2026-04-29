import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ServiceWorkerProvider } from "@/components/shared/ServiceWorkerProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Auto Fix HQ — The Shop OS",
  description: "The shop OS built for the floor, not the boardroom.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Auto Fix HQ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e293b",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("afhq-locale")?.value;
  const initialLocale = localeCookie === "es" ? "es" : "en";

  return (
    <html lang={initialLocale} className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-slate-50 antialiased">
        <LocaleProvider initialLocale={initialLocale}>
          {children}
          <ServiceWorkerProvider />
          <Toaster richColors position="top-right" />
        </LocaleProvider>
      </body>
    </html>
  );
}
