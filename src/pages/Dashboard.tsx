import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../services/api'
import CircularGauge from '../components';

export function Dashboard(){
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.getReadings().then(d => { setData(d); setLoading(false) })
  }, [])

  // derive latest reading (fallback: N/A)
  const latest = data.length ? data[data.length - 1] : null
  const latestTemp = latest?.temperature_c ?? null

  return (
    <section className="grid gap-4">
      {/* top row: instant reading + chart side-by-side on md+ */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card flex items-center justify-center md:col-span-1">
          {latestTemp == null ? (
            <p>Loading…</p>
          ) : (
            <div className="grid place-items-center">
              <CircularGauge
                value={latestTemp}
                min={-10}
                max={50}
                units="°C"
                label="Instant"
                size={200}
                strokeWidth={16}
                warnAt={35}
                dangerAt={40}
              />
             
              <p className="text-sm opacity-70 mt-2">
                Updated: {latest?.ts}
              </p>
            </div>
          )}
        </div>
         <div className="card flex items-center justify-center md:col-span-1">
          {latestTemp == null ? (
            <p>Loading…</p>
          ) : (
            <div className="grid place-items-center">
              <CircularGauge
                value={latestTemp}
                min={-10}
                max={50}
                units="°C"
                label="Instant"
                size={200}
                strokeWidth={16}
                warnAt={35}
                dangerAt={40}
              />
             
              <p className="text-sm opacity-70 mt-2">
                Updated: {latest?.ts}
              </p>
            </div>
          )}
        </div>
        


        <div className="card md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Temperature — last 48h</h2>
          {loading ? <p>Loading…</p> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ts" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="temperature_c" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* KPI cards – responsive grid */}
      <div className="cards">

        <div className="card"><Stat label="Active sensors" value={3} /></div>
        <div className="card"><Stat label="Open alerts" value={2} /></div>
        <div className="card"><Stat label="Packet loss" value="<1%" /></div>
      </div>
    </section>
  )
}

function Stat({label, value}:{label:string, value:any}){
  return (
    <div className="p-2">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
