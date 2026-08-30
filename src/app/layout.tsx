import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import type { Metadata } from "next";
import { absoluteUrl, siteName, siteUrl } from "@/lib/seo";
const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AI Academy | AI, Programming & Technology Courses", template: "%s | AI Academy" },
  description: "Practical AI, programming, data science, web development, and technology education for ambitious learners.",
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  applicationName: siteName,
  keywords: ["AI courses", "technology academy", "programming courses", "Pakistan"],
  alternates: { canonical: absoluteUrl("/") },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: { type: "website", locale: "en_PK", url: siteUrl, siteName, title: "AI Academy | AI, Programming & Technology Courses", description: "Practical technology education built for career-ready learners." },
  twitter: { card: "summary_large_image", title: "AI Academy | AI, Programming & Technology Courses", description: "Practical technology education built for career-ready learners." },
  icons: { icon: "/images/logo/AI-logo.png" },
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
        </ThemeProvider>
      </body>
    </html>
  );
}
