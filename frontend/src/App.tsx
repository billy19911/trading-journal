import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useAppStore } from './store'
import { GoogleAuthScreen } from './components/GoogleAuthScreen'
import { ToastViewport } from './components/ui'
import AppShell from './components/layout'
import Overview from './pages/Overview'
import Journey from './pages/Journey'
import Journal from './pages/Journal'
import Simulator from './pages/Simulator'
import Analytics from './pages/Analytics'
import Milestones from './pages/Milestones'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

export default function App() {
  const token = useAppStore((state) => state.token)
  const ready = useAppStore((state) => state.ready)

  // Still loading (checking if stored token is valid)
  if (!ready && token) return <LoadingScreen />

  // Not logged in → show Google auth screen
  if (!token) {
    return (
      <>
        <GoogleAuthScreen />
        <ToastViewport />
      </>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Overview />} />
          <Route path="journey" element={<Journey />} />
          <Route path="journal" element={<Journal />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="milestones" element={<Milestones />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
