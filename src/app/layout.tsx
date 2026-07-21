import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { generateSEOMetadata } from "./metadata";
import Providers from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import MobileNav from "@/components/MobileNav";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const googleSans = Poppins({
  variable: "--font-google-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = generateSEOMetadata({
  title: 'Bosh Sahifa',
  description: 'JURISAI - O\'zbekistonning yetakchi yuridik AI platformasi. IRAC tahlili, hujjat generatsiyasi, qonunlar bazasi va professional maslahat.',
  keywords: ['yuridik ai', 'huquqiy yordamchi', 'o\'zbekiston qonunlari', 'irac tahlili'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ErrorBoundary>
          <Providers>
            <MobileNav />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
