import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Your powerful AI Super Helper | sh-ai",
    template: "Your powerful AI %s | sh-ai",
    absolute: "Your powerful AI Super Helper | sh-ai",
  },
  description: "Specifically made for you to not worry about small but mundane tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col items-center p-24 justify-between",
          fontSans.variable
        )}
      >
        {children}
        <footer className="text-zinc-800 mt-10 text-center space-y-2">
          <a
            href="https://github.com/okawibawa/sh-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            GitHub
          </a>
          <p className="text-sm">
            &copy; 2024 |{" "}
            <a
              href="https://www.okawibawa.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Oka Wibawa
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
