"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPageNameByUrl } from "@/lib/utils";

export default function PagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="text-center space-y-6 max-w-[600px] w-full">
      <section>
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-bold">sh-ai</h1>
        </Link>
        <p className="text-xl">
          Your powerful AI{" "}
          <span className="font-semibold">
            {getPageNameByUrl(pathname) ?? "Super Helper"}
          </span>
          .
        </p>
      </section>
      {children}
    </main>
  );
}
