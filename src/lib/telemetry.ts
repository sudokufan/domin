import type { Station, Telemetry } from '@/api/types'

export interface TelemetryRow {
  label: string
  value: string
}

const round = (n: number, dp = 0) =>
  n.toLocaleString('en-GB', { maximumFractionDigits: dp })

/**
 * The single most informative telemetry value for a machine, shown large on
 * the floor-map card. Honing reports state only, so it has no headline.
 */
export function telemetryHeadline(station: Station): string | null {
  const t = station.telemetry
  switch (t.kind) {
    case 'printer':
      return `Build ${Math.round(t.buildProgressPct)}%`
    case 'lathe':
      return `${round(t.spindleRpm)} rpm`
    case 'test-rig':
      return t.partSerial ?? 'No part'
    case 'marker':
      return `${t.partsMarkedShift} marked`
    case 'shipping':
      return `${t.partsDispatchedShift} shipped`
    case 'honing':
      return null
  }
}

/** Full set of telemetry read-outs for a machine, for the detail panel. */
export function telemetryRows(telemetry: Telemetry): TelemetryRow[] {
  switch (telemetry.kind) {
    case 'printer':
      return [
        { label: 'Chamber temp', value: `${round(telemetry.chamberTempC)} °C` },
        { label: 'Build progress', value: `${Math.round(telemetry.buildProgressPct)} %` },
        { label: 'Material remaining', value: `${Math.round(telemetry.materialRemainingPct)} %` },
        { label: 'Job ID', value: telemetry.jobId ?? '—' },
      ]
    case 'lathe':
      return [
        { label: 'Spindle speed', value: `${round(telemetry.spindleRpm)} rpm` },
        { label: 'Coolant temp', value: `${round(telemetry.coolantTempC, 1)} °C` },
      ]
    case 'test-rig':
      return [
        { label: 'Test running', value: telemetry.testRunning ? 'Yes' : 'No' },
        { label: 'Result', value: telemetry.testResult ? telemetry.testResult.toUpperCase() : 'In progress' },
        { label: 'Inlet pressure', value: `${round(telemetry.inletPressureBar)} bar` },
        { label: 'Outlet pressure', value: `${round(telemetry.outletPressureBar)} bar` },
        { label: 'Flow rate', value: `${round(telemetry.flowRateLpm, 1)} L/min` },
        { label: 'Fluid temp', value: `${round(telemetry.fluidTempC, 1)} °C` },
        { label: 'Duration', value: `${round(telemetry.testDurationS)} s` },
        { label: 'Part serial', value: telemetry.partSerial ?? '—' },
      ]
    case 'marker':
      return [{ label: 'Parts marked (shift)', value: round(telemetry.partsMarkedShift) }]
    case 'shipping':
      return [{ label: 'Parts dispatched (shift)', value: round(telemetry.partsDispatchedShift) }]
    case 'honing':
      return []
  }
}
