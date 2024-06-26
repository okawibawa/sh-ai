import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";
import { ROUTES } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPageNameByUrl(url: string) {
  return ROUTES.find((route) => route.route === url)?.name;
}
