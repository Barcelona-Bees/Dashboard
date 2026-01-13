export const api = {
  async getReadings(){
    const r = await fetch('/mock/readings.json')
    return r.json()
  },
  async getAlerts(){
    const r = await fetch('/mock/alerts.json')
    return r.json()
  },
  async getSensors(){
    const r = await fetch('/mock/sensors.json')
    return r.json()
  }
}
