import { Fragment } from "react";
import type { Station } from "@/api/types";
import { StationCard } from "./StationCard";
import { FlowConnector } from "./FlowConnector";

/**
 * The production line laid out in process order (Print → Turn → Hone → Test →
 * Mark → Ship) with flow connectors between stations. Stacks vertically on
 * small screens and becomes a horizontal line on desktop, so it stays legible
 * at any width instead of overflowing a fixed bay grid.
 */
export const ProcessFlow = ({
  stations,
  selectedId,
  onSelect,
}: {
  stations: Station[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const ordered = [...stations].sort((first, second) =>
    first.id.localeCompare(second.id),
  );

  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch">
      {ordered.map((station, index) => (
        <Fragment key={station.id}>
          {index > 0 && <FlowConnector status={ordered[index - 1].status} />}
          <div className="lg:min-w-0 lg:flex-1">
            <StationCard
              station={station}
              isSelected={selectedId === station.id}
              onSelect={onSelect}
            />
          </div>
        </Fragment>
      ))}
    </div>
  );
};
