import type { StationStatus } from "@/api/types";

export interface StatusStyle {
  label: string;
  /** Solid colour (dots, timeline segments, chart strokes). */
  hex: string;
  /** Tailwind class for a solid dot. */
  dot: string;
  /** Tailwind classes for a soft badge/pill. */
  badge: string;
  /** Tailwind text colour. */
  text: string;
}

/**
 * Single source of truth for how each status looks. Charts read `hex`;
 * everything else uses the Tailwind class strings so the palette stays
 * consistent across the app.
 */
export const STATUS_STYLES: Record<StationStatus, StatusStyle> = {
  running: {
    label: "Running",
    hex: "#22c55e", // green-500
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
    text: "text-green-700",
  },
  idle: {
    label: "Idle",
    hex: "#f59e0b", // amber-500
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    text: "text-amber-700",
  },
  faulted: {
    label: "Faulted",
    hex: "#ef4444", // red-500
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    text: "text-red-700",
  },
  maintenance: {
    label: "Maintenance",
    hex: "#6366f1", // indigo-500
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20",
    text: "text-indigo-700",
  },
};

export const statusStyle = (status: StationStatus): StatusStyle =>
  STATUS_STYLES[status];
