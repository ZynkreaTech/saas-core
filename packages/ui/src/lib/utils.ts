import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges Tailwind classes safely: clsx handles conditional classes
// (cn("p-2", isActive && "bg-primary")), tailwind-merge then resolves
// conflicts so e.g. "p-2 p-4" collapses to just "p-4" instead of both applying.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
