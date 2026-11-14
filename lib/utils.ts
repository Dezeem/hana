import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TYPE_MAP } from "@/site.config";
import type { Work } from "@/lib/db/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function typeColor(type: Work["type"]): string {
  return TYPE_MAP[type]?.color ?? "var(--c-movie)";
}

export function typeLabel(type: Work["type"]): string {
  return TYPE_MAP[type]?.zh ?? type;
}

export function workMetaLine(work: Work): string {
  return [work.creator, work.year ? String(work.year) : ""].filter(Boolean).join(" · ");
}

export function ratingText(rating: number | null): string {
  if (rating === null || Number.isNaN(rating)) return "—";
  return rating.toFixed(1).replace(/\.0$/, ".0");
}

export function truncate(text: string, length = 120): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export function aspect(ratio: number): string {
  const safe = ratio > 0.3 && ratio < 2.4 ? ratio : 0.72;
  return String(safe.toFixed(3));
}
