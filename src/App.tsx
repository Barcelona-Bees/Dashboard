import React, { useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Alerts } from './pages/Alerts'
import { Admin } from './pages/Admin'

type Tab = 'dashboard' | 'alerts' | 'admin'

export default function App(){
  const [tab, setTab] = React.useState<Tab>('dashboard')

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(console.warn)
    }
  }, [])

  return (
    <div className="min-h-screen">
      <nav className="nav">
        <h1 className="text-xl font-bold text-primary">Beehive Sensors</h1>
        <button className="btn" onClick={() => setTab('dashboard')}>Dashboard</button>
        <button className="btn" onClick={() => setTab('alerts')}>Alerts</button>
        <button className="btn" onClick={() => setTab('admin')}>Admin</button>
      </nav>

      <main className="p-4 grid gap-4 max-w-6xl mx-auto">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'alerts' && <Alerts />}
        {tab === 'admin' && <Admin />}
      </main>
    </div>
  )
}
