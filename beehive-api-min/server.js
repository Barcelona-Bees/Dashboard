import express from 'express'
import cors from 'cors'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789', 12)
const app = express()
const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())

// --- In-memory data stores ---
const sensors = [
  { sensor_id: 1, name: 'Hive A', hive_location: 'East Yard', status: 'active', battery_pct: 78.5, last_seen: new Date().toISOString() },
  { sensor_id: 2, name: 'Hive B', hive_location: 'North Field', status: 'active', battery_pct: 63.2, last_seen: new Date(Date.now()-16*60*1000).toISOString() },
  { sensor_id: 3, name: 'Hive C', hive_location: 'South Hill', status: 'active', battery_pct: 91.0, last_seen: new Date(Date.now()-35*60*1000).toISOString() },
]

const alerts = [
  { alert_id: 1, sensor_id: 1, rule_key: 'COLONY_DEATH', severity: 'critical', triggered_at: new Date(Date.now()-2*60*60*1000).toISOString(), resolved_at: null, message: 'Internal temp dropped near ambient.' },
  { alert_id: 2, sensor_id: 2, rule_key: 'PRE_SWARM', severity: 'warning', triggered_at: new Date(Date.now()-12*60*60*1000).toISOString(), resolved_at: null, message: 'Temp + volume spike observed.' },
]

// Pre-generate 48h of readings per sensor (every 20 min)
const readings = []
function seedReadings(){
  const now = Date.now()
  for (const s of sensors){
    for (let i = 48*3; i >= 0; i--) { // every 20m -> 3 points/hour -> 144/day -> 288/2days
      const ts = new Date(now - i*20*60*1000).toISOString()
      const base = 32
      const val = base + 5*Math.sin(i/6) + (Math.random()-0.5)*0.4
      readings.push({ reading_id: Number(nanoid()), sensor_id: s.sensor_id, ts_utc: ts, temperature_c: Math.round(val*100)/100 })
    }
  }
}
seedReadings()

// --- Routes ---

// Health
app.get('/health', (req,res) => res.json({ ok: true, time: new Date().toISOString() }))

// List sensors
app.get('/sensors', (req,res) => res.json(sensors))

// List alerts
app.get('/alerts', (req,res) => {
  const openOnly = (req.query.open_only ?? 'true') === 'true'
  const out = openOnly ? alerts.filter(a => !a.resolved_at) : alerts
  res.json(out)
})

// Query readings: /readings?sensor_id=1&since=48h&limit=2000
app.get('/readings', (req,res) => {
  const sid = Number(req.query.sensor_id)
  if (!sid) return res.status(400).json({ error: 'sensor_id required' })
  let sinceMs = 48*60*60*1000 // default 48h
  const since = req.query.since
  if (since) {
    const m = /^([0-9]+)([hm])$/.exec(String(since))
    if (m){
      const n = Number(m[1]); const unit = m[2]
      sinceMs = unit === 'h' ? n*60*60*1000 : n*60*1000
    }
  }
  const limit = Math.min(Number(req.query.limit || 2000), 5000)
  const cutoff = Date.now() - sinceMs
  const out = readings
    .filter(r => r.sensor_id === sid && new Date(r.ts_utc).getTime() >= cutoff)
    .slice(-limit)
  res.json(out)
})

// Ingest (idempotent by sensor_id + ts_utc)
const seenKeys = new Set()
app.post('/ingest', (req,res) => {
  const { sensor_id, ts_utc, temperature_c, humidity_pct, sound_db, co2_ppm } = req.body || {}
  if (!sensor_id || !ts_utc || typeof temperature_c !== 'number'){
    return res.status(400).json({ error: 'sensor_id, ts_utc, temperature_c required' })
  }
  const key = `${sensor_id}|${ts_utc}`
  if (seenKeys.has(key)) return res.status(409).json({ error: 'duplicate' })
  seenKeys.add(key)
  readings.push({ reading_id: Number(nanoid()), sensor_id, ts_utc, temperature_c, humidity_pct, sound_db, co2_ppm })
  const s = sensors.find(x => x.sensor_id === Number(sensor_id))
  if (s) s.last_seen = new Date().toISOString()
  return res.status(202).json({ ok: true })
})

// Ack alert
app.post('/alerts/:id/ack', (req,res) => {
  const id = Number(req.params.id)
  const a = alerts.find(x => x.alert_id === id)
  if (!a) return res.sendStatus(404)
  a.resolved_at = new Date().toISOString()
  res.sendStatus(204)
})

app.listen(PORT, () => console.log(`beehive-api-min listening on http://localhost:${PORT}`))
