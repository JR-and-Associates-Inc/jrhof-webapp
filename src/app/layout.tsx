"use client";

import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Roboto, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import clarity from "@microsoft/clarity";
import Analytics from "@/components/Analytics";
import Clarity from "@/components/Clarity";

const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "700"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      clarity.init("regjnz11le");
    } catch (error) {
      console.error("Clarity initialization failed:", error);
    }
  }, []);

  return (
    <html lang="en" dir="ltr" className="h-full">
      <head>
        <title>Joe Rossi Hall of Fame</title>
        <meta name="description" content="Honoring the legacy of high school baseball umpires in Colorado." />
        <Analytics />
        <Clarity />
        <link rel="icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" sizes="192x192" href="/favicon/android-chrome-192x192.png" />
        <link rel="icon" sizes="512x512" href="/favicon/android-chrome-512x512.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="apple-mobile-web-app-title" content="JRHOF" />
        <meta name="application-name" content="JRHOF" />
        <meta name="theme-color" content="#ffffff" />
        <meta property="og:title" content="Joe Rossi Hall of Fame" />
        <meta property="og:description" content="Honoring the legacy of high school baseball umpires in Colorado." />
        <meta property="og:image" content="/favicon/android-chrome-512x512.png" />
        <meta property="og:url" content="https://jrhof.org" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/favicon/android-chrome-512x512.png" />
        <meta property="og:image:type" content="image/png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`
          ${roboto.variable} 
          ${playfair.variable} 
          antialiased
          font-roboto
          m-0
          bg-[#f4f4f4]
          text-[#333]
          bg-[url('/diamond_bg.jpg')]
          bg-cover
          bg-fixed
          bg-no-repeat
          bg-center
          h-full
          flex
          flex-col
        `}
      >
        <Header />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}