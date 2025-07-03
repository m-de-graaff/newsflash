import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { validateConfig } from "@/lib/config";
import ClientPerformanceMonitor from "@/components/client-performance-monitor";
import "./globals.css";

// Validate configuration on app startup
if (typeof window === "undefined") {
  try {
    validateConfig();
  } catch (error) {
    console.error("❌ Configuration Error:", (error as Error).message);
    console.error("Please check your environment variables in .env file");
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NewsFlash - Real-time News & Weather",
  description:
    "Stay informed with real-time breaking news, local weather, and personalized news updates from around the world.",
  keywords: [
    "news",
    "breaking news",
    "weather",
    "real-time news",
    "local news",
    "world news",
    "news aggregator",
    "NewsFlash",
  ],
  authors: [{ name: "Mark de Graaff", url: "https://github.com/m-de-graaff" }],
  creator: "Mark de Graaff",
  openGraph: {
    title: "NewsFlash - Real-time News & Weather",
    description:
      "Stay informed with real-time breaking news, local weather, and personalized news updates from around the world.",
    url: "https://github.com/m-de-graaff/newsflash",
    siteName: "NewsFlash",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewsFlash - Real-time News & Weather",
    description:
      "Stay informed with real-time breaking news, local weather, and personalized news updates from around the world.",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ClientPerformanceMonitor />
        </ThemeProvider>
      </body>
    </html>
  );
}
