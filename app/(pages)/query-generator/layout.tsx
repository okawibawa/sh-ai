import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SQL Query Generator",
};

export default function TranscribeVideoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
