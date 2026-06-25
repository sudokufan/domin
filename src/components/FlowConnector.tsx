import { ChevronDown, ChevronRight } from "lucide-react";
import type { StationStatus } from "@/api/types";
import { statusStyle } from "@/lib/status";

/**
 * Directional link drawn between two stations to show material flow through
 * the line. Coloured by the upstream station's status, so a faulted or idle
 * machine visibly "breaks" the flow downstream. Points down when the flow is
 * stacked (mobile) and right when it's laid out as a row (desktop).
 */
export const FlowConnector = ({ status }: { status: StationStatus }) => {
  const color = statusStyle(status).hex;
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center lg:flex-row"
      aria-hidden
    >
      <span
        className="h-3 w-px lg:h-px lg:w-3"
        style={{ backgroundColor: color }}
      />
      <ChevronDown className="h-3.5 w-3.5 lg:hidden" style={{ color }} />
      <ChevronRight className="hidden h-3.5 w-3.5 lg:block" style={{ color }} />
    </div>
  );
};
