import React from 'react'
import { api } from '../services/api'

export function Alerts(){
  const [alerts, setAlerts] = React.useState<any[]>([])
  React.useEffect(() => { api.getAlerts().then(setAlerts) }, [])

  return (
    <section className="grid gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Alerts</h2>
        <ul className="grid gap-2">
          {alerts.map(a => (
            <li key={a.alert_id} className="p-3 rounded-xl bg-[#17171a] border border-[#202025]">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{a.rule_key}</div>
                <span className="text-xs opacity-70">{new Date(a.triggered_at).toLocaleString()}</span>
              </div>
              <div className="text-sm opacity-80">{a.message}</div>
              <div className="text-xs mt-1">severity: {a.severity}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
