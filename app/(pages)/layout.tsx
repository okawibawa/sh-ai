"use client";

import { ReactNode, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPageNameByUrl } from "@/lib/utils";
import { DefaultColors } from "tailwindcss/types/generated/colors";

export default function PagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const gradientGenerator = useCallback(() => {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }, [pathname]);

  return (
    <main className="text-center space-y-6 max-w-[600px] w-full">
      <section>
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-bold">sh-ai</h1>
        </Link>
        <p className="text-xl">
          Your powerful AI{" "}
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
