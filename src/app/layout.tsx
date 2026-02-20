import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AgeVerification } from "@/components/AgeVerification";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LabVex - HD Videolar",
    template: "%s | LabVex",
  },
  description:
    "En kaliteli HD videolar. Kategoriler, starlar ve daha fazlası.",
  metadataBase: new URL("https://labvex.site"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "LabVex",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    rating: "adult",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0a14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AgeVerification />
        {children}
      </body>
    </html>
  );
}
