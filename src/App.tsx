import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/useAuthStore'
import { settingsService } from '@/lib/services'
import { ToastContainer } from '@/components/ui/Toast'

import Login        from '@/pages/Login'
import Dashboard    from '@/pages/Dashboard'
import Vehicles     from '@/pages/Vehicles'
import VehicleDetail from '@/pages/VehicleDetail'
import Maintenance  from '@/pages/Maintenance'
import Compliance   from '@/pages/Compliance'
import Fuel         from '@/pages/Fuel'
import Incidents    from '@/pages/Incidents'
import Equipment    from '@/pages/Equipment'
import Drivers      from '@/pages/Drivers'
import DriverDetail from '@/pages/DriverDetail'
import Settings     from '@/pages/Settings'
import Finance      from '@/pages/Finance'

function AppRoutes() {
  const checkSession = useAuthStore((s) => s.checkSession)
  const { isAuthenticated, updateSettings } = useAuthStore()
  useEffect(() => { checkSession() }, [checkSession])
  useEffect(() => {
    if (!isAuthenticated) return
    settingsService.load().then((remote) => {
      if (remote) updateSettings(remote)
    }).catch(() => {})
  }, [isAuthenticated])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Outlet /></Layout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"    element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="vehicles"     element={<ProtectedRoute module="vehicles"><Vehicles /></ProtectedRoute>} />
        <Route path="vehicles/:id" element={<VehicleDetail />} />
        <Route path="maintenance"  element={<ProtectedRoute module="maintenance"><Maintenance /></ProtectedRoute>} />
        <Route path="compliance"   element={<ProtectedRoute module="compliance"><Compliance /></ProtectedRoute>} />
        <Route path="incidents"    element={<ProtectedRoute module="incidents"><Incidents /></ProtectedRoute>} />
        <Route path="drivers"      element={<ProtectedRoute module="drivers"><Drivers /></ProtectedRoute>} />
        <Route path="drivers/:id"  element={<DriverDetail />} />
        <Route path="fuel"         element={<ProtectedRoute module="fuel"><Fuel /></ProtectedRoute>} />
        <Route path="equipment"    element={<ProtectedRoute module="equipment"><Equipment /></ProtectedRoute>} />
        <Route path="settings"     element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />
        <Route path="finance"      element={<Finance />} />
        <Route path="*"            element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  )
}
