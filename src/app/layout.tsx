import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { auth } from "@/auth/auth";
import { SessionProvider } from "next-auth/react";
import { StoreProvider } from "./storeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QA Agent - Automatización inteligente de pruebas",
  description: "Plataforma de automatización de pruebas QA para aplicaciones web",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <StoreProvider>
            {children}
          </StoreProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
