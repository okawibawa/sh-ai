import { ReactNode } from "react";
import Link from "next/link";

import { StyledTitle } from "@/components/styled-title";

export default function PagesLayout({ children }: { children: ReactNode }) {
  return (
    <main className="text-center space-y-6 max-w-[600px] w-full">
      <section className="mb-12">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-bold">
            sh-ai <span className="text-sm font-medium">alpha.</span>
          </h1>
        </Link>
        <StyledTitle />
        <p className="text-sm">
          Each request is rate limited to 20 requests per hour. If you exceed
          the limit, please wait for a while.
        </p>
      </section>
      {children}
    </main>
  );
}
