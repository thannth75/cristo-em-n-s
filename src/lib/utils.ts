import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getUserFirstName(
  profile: { full_name?: string | null } | null | undefined,
  fallback = "Jovem",
): string {
  return profile?.full_name?.split(" ")[0] || fallback;
}

type DateFormatPreset = "short" | "medium" | "long" | "numeric";

const DATE_FORMAT_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  short: { day: "2-digit", month: "short" },
  medium: { day: "2-digit", month: "short", year: "numeric" },
  long: { day: "2-digit", month: "long", year: "numeric" },
  numeric: { day: "2-digit", month: "2-digit" },
};

export function formatDateBR(
  dateStr: string,
  preset: DateFormatPreset | Intl.DateTimeFormatOptions = "short",
): string {
  const date = new Date(dateStr);
  const options =
    typeof preset === "string" ? DATE_FORMAT_OPTIONS[preset] : preset;
  return date.toLocaleDateString("pt-BR", options);
}
