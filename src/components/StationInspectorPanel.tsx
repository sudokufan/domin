import { MousePointerClick } from "lucide-react";
import { Card } from "./Card";
import { StationDetail } from "./StationDetail";
import { EmptyState } from "./states";

/**
 * Right-hand panel on the floor map: shows the selected station's live detail,
 * or a prompt to pick one.
 */
export const StationInspectorPanel = ({
  stationId,
  onClose,
  className,
}: {
  stationId: string | null;
  onClose: () => void;
  className?: string;
}) => (
  <Card className={className}>
    {stationId ? (
      <StationDetail stationId={stationId} onClose={onClose} />
    ) : (
      <EmptyState
        icon={<MousePointerClick className="h-8 w-8" />}
        title="Select a station to see details"
        description="Live status, time-in-state, recent events and 24h utilisation."
        className="h-full"
      />
    )}
  </Card>
);
