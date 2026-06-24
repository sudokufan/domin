import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layout/AppLayout'
import { StationsPage } from '@/pages/StationsPage'
import { FloorMapPage } from '@/pages/FloorMapPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { StubPage } from '@/pages/StubPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/stations" replace />} />
        <Route path="stations" element={<StationsPage />} />
        <Route path="floor-map" element={<FloorMapPage />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Production + account areas are out of scope for this build and
            render a clearly-labelled placeholder. */}
        <Route path="jobs" element={<StubPage title="Jobs" />} />
        <Route path="valves" element={<StubPage title="Valves" />} />
        <Route path="reports" element={<StubPage title="Reports" />} />
        <Route path="alerts" element={<StubPage title="Alerts" />} />
        <Route path="settings" element={<StubPage title="Settings" />} />

        <Route path="*" element={<Navigate to="/stations" replace />} />
      </Route>
    </Routes>
  )
}

export default App
