"use client";

import { getPageNameByUrl } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useCallback } from "react";

export const StyledTitle = () => {
  const pathname = usePathname();

  const gradientGenerator = useCallback(() => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 40) + 60; // 60-100%
    const lightness = Math.floor(Math.random() * 40) + 30; // 30-70%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [pathname]);

  return (
    <p className="text-xl mb-2">
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
  );
};
