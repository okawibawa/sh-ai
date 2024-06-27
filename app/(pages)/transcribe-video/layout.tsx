import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Video Transcriber",
};

export default function TranscribeVideoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
