import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryProvider } from "@/components/shared/query-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "IRAN — Internship Readiness Analyzer",
    template: "%s | IRAN",
  },
  description:
    "AI-powered platform to evaluate and improve your internship readiness through resume analysis, skill assessments, coding challenges, and personalized roadmaps.",
  keywords: [
    "internship",
    "readiness",
    "analyzer",
    "placement",
    "resume",
    "coding",
    "assessment",
    "AI",
  ],
  authors: [{ name: "IRAN Platform" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "IRAN — Internship Readiness Analyzer",
    description: "Evaluate and boost your internship readiness with AI",
    siteName: "IRAN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
