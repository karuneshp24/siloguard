import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// ── Font loaded via next/font — zero blocking, self-hosted automatically ──
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",   // show text immediately, swap when font loads
  preload: true,
});

export const metadata: Metadata = {
  title: "SiloGuard — Digital Twin Post-Harvest Intelligence",
  description:
    "Software-Defined Agritech Digital Twin for Post-Harvest Spoilage Prevention & Dynamic Liquidation",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SiloGuard" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "SiloGuard — Digital Twin",
    description: "Real-time 3D grain silo monitoring with fungal kinetic modelling",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable}`}>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#0f172a" />
      </head>
      <body className={`min-h-screen bg-slate-900 text-slate-100 antialiased font-mono ${jetbrainsMono.className}`}>
        {children}
        
        {/* Strict Anti-Zoom Script for iOS/Mobile */}
        <Script
          id="anti-zoom"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('touchmove', function (event) {
                if (event.scale !== 1 || event.touches.length > 1) {
                  event.preventDefault();
                }
              }, { passive: false });
              
              var lastTouchEnd = 0;
              document.addEventListener('touchend', function (event) {
                var now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                  event.preventDefault();
                }
                lastTouchEnd = now;
              }, { passive: false });
            `,
          }}
        />
      </body>
    </html>
  );
}
