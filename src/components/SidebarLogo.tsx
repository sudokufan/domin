import { PingDot } from "./PingDot";

export const SidebarLogo = () => (
  <div className="px-5 pt-5 pb-4">
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-sm font-bold text-emerald-400">
        D
      </span>
      <span className="text-lg font-bold tracking-tight text-white">DOMIN</span>
    </div>
    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">
      <span>Factory Status</span>
      <span className="flex items-center gap-1 text-emerald-400">
        <PingDot size="h-1.5 w-1.5" color="bg-emerald-400" />
        Live
      </span>
    </div>
  </div>
);
