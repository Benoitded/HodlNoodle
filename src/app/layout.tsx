// @/app/layout.tsx

import type { Metadata, Viewport } from "next";
// import "./globals.css";
import ReownProvider from "@/context/reown";
import Header from "@/components/Header/Header";
import { ViewTransitions } from "next-view-transitions";
import { Toaster } from "react-hot-toast";

import { headers } from "next/headers";
import "@/styles/globals.css";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PWAProvider } from "@/context/PWAContext/PWAContext";
import { ContextProvider } from "@/context/usePushSDK";

export const metadata: Metadata = {
  title: "HodlNoodle",
  icons: {
    icon: "/logo-icon.png",
  },
  description:
    "HodlNoodle is an app to share with your crypto friends the best spots to eat in Bangkok!",

  openGraph: {
    images: ["/og-image.png"],
    type: "website",
    siteName: "HodlNoodle",
    title: "HodlNoodle",
    description:
      "HodlNoodle is an app to share with your crypto friends the best spots to eat in Bangkok!",
  },
  twitter: {
    card: "summary_large_image",
    title: "HodlNoodle",
    description:
      "HodlNoodle is an app to share with your crypto friends the best spots to eat in Bangkok!",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  height: "device-height",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const NoSSR = dynamic(() => import("@/components/NoSSR"), { ssr: false });
  const cookies = headers().get("cookie");

  //add gas component
  return (
    <ViewTransitions>
      <html lang="en">
        <body>
          <NoSSR>
            <ReownProvider cookies={cookies}>
              {/* <PWAProvider> */}
              <ContextProvider>
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: "#111",
                      color: "#FFF",
                    },
                  }}
                />
                <div className="containerTotal">
                  <Header />
                  {children}
                </div>
              </ContextProvider>
              {/* </PWAProvider> */}
            </ReownProvider>
          </NoSSR>
        </body>
      </html>
    </ViewTransitions>
  );
}
