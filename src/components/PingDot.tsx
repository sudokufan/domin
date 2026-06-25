import { clsx } from "clsx";

/**
 * A pulsing "live" indicator: a solid dot with an expanding ping ring behind
 * it. Used for the sidebar/topbar live markers and for running stations.
 *
 * Colours are Tailwind background-class strings (e.g. 'bg-emerald-500' or a
 * status colour like 'bg-green-500'). `pingColor` defaults to `color`, but
 * can differ for a two-tone effect.
 */
export const PingDot = ({
  size = "h-2 w-2",
  color = "bg-emerald-500",
  pingColor,
  className,
  title,
}: {
  /** Tailwind height/width classes for the dot. */
  size?: string;
  /** Background class for the solid core. */
  color?: string;
  /** Background class for the animated ring (defaults to `color`). */
  pingColor?: string;
  className?: string;
  title?: string;
}) => (
  <span className={clsx("relative flex", size, className)} title={title}>
    <span
      className={clsx(
        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
        pingColor ?? color,
      )}
    />
    <span className={clsx("relative inline-flex rounded-full", size, color)} />
  </span>
);
