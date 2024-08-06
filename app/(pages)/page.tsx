import Link from "next/link";
import { headers } from "next/headers";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <section className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/transcribe-video"
            className={`${buttonVariants({ variant: "default" })}`}
          >
            Transcribe Video
          </Link>
          <Link
            href="/query-generator"
            className={`${buttonVariants({ variant: "default" })}`}
          >
            SQL Query Generator
          </Link>
          <Link
            href="#"
            className={`${buttonVariants({ variant: "secondary" })} pointer-events-none opacity-60`}
          >
            Summarize Video
          </Link>
          <Link
            href="#"
            className={`${buttonVariants({ variant: "secondary" })} pointer-events-none opacity-60`}
          >
            Image-to-Speech
          </Link>
        </div>
      </section>
    </>
  );
}
