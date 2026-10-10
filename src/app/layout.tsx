import { SpeedInsights } from "@vercel/speed-insights/next"
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import type { Metadata } from "next";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo";
import { academy } from "@/config/academy";
const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: academy.name, template: `%s | ${academy.name}` },
  description: academy.tagline,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  applicationName: siteName,
  keywords: ["school academy", "academic coaching", "career counseling", "Pakistan"],
  alternates: { canonical: absoluteUrl("/") },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: { type: "website", locale: "en_PK", url: siteUrl, siteName, title: academy.name, description: academy.tagline },
  twitter: { card: "summary_large_image", title: academy.name, description: academy.tagline },
  icons: { icon: "/images/logo/logo-placeholder.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider
          attribute="class"
          enableSystem={false}
          defaultTheme="light"
          disableTransitionOnChange
        >
          <Header />
          {children}
          <Footer />
          <ScrollToTop />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
