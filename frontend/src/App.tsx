import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout'
import Overview from './pages/Overview'
import Journey from './pages/Journey'
import Journal from './pages/Journal'
import Simulator from './pages/Simulator'
import Analytics from './pages/Analytics'
import Milestones from './pages/Milestones'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'

export default function App() {
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
