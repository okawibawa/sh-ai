"use client";

import { ReactNode, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPageNameByUrl } from "@/lib/utils";

export default function PagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const gradientGenerator = useCallback(() => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 40) + 60; // 60-100%
    const lightness = Math.floor(Math.random() * 40) + 30; // 30-70%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [pathname]);

  return (
    <main className="text-center space-y-6 max-w-[600px] w-full">
      <section className="mb-12">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-bold">
            sh-ai <span className="text-sm font-medium">alpha.</span>
          </h1>
        </Link>
        <p className="text-xl">
          Your Powerful AI{" "}
          <span
            className="font-semibold bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${gradientGenerator()}, ${gradientGenerator()})`,
            }}
          >
            {getPageNameByUrl(pathname) ?? "Super Helper"}
          </span>
          .
        </p>
      </section>
      {children}
    </main>
  );
}
