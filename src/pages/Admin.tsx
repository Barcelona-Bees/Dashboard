import React from 'react'
import { api } from '../services/api'
import CircularGauge from '../components';


export function Admin(){
  const [sensors, setSensors] = React.useState<any[]>([])
  React.useEffect(() => { api.getSensors().then(setSensors) }, [])

  return (
    <section className="grid gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Device Registry</h2>
        <table className="w-full text-sm">
          <thead className="opacity-70 text-left">
            <tr><th className="py-2">ID</th><th>Name</th><th>Battery</th><th>Last Seen</th></tr>
          </thead>
          <tbody>
            {sensors.map(s => (
              <tr key={s.sensor_id} className="border-t border-[#202025]">
                <td className="py-2">{s.sensor_id}</td>
                <td>{s.name}</td>
                <td>{s.battery_pct}%</td>
                <td>{s.last_seen}</td>
              </tr>
            ))}
            <CircularGauge
              value={78.5}
              min={0}
              max={100}
              units="%"
              label="Battery"
              size={160}
              strokeWidth={14}
              warnAt={30}
              dangerAt={15}
            />

          </tbody>
        </table>
      </div>
    </section>
  )
}
