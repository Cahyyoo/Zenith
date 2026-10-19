import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { WORKSPACE_STORAGE_KEY } from "@/lib/storage-keys";

import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Zenith",
  title: { default: "Zenith", template: "%s · Zenith" },
  description: "Personal routines and developer projects, in one calm place.",
  appleWebApp: { capable: true, title: "Zenith", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icon.svg",
    apple: "/pwa-icon/apple",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Applies the workspace accent before first paint so the precached static
// shell never flashes the wrong theme.
const workspaceScript = `(function(){try{var p=location.pathname,w=null;if(p==="/d"||p.indexOf("/d/")===0)w="developer";else if(p==="/p"||p.indexOf("/p/")===0)w="personal";if(!w){var s=JSON.parse(localStorage.getItem("${WORKSPACE_STORAGE_KEY}")||"null");w=(s&&s.state&&s.state.lastWorkspace)||"personal"}document.documentElement.dataset.workspace=w}catch(e){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: workspaceScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
