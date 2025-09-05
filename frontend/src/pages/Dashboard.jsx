import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../api/client.js'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [emotions, setEmotions] = useState({ distribution: {} })
  const [recent, setRecent] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const [s, d, e, r] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.attendanceDaily(7),
          dashboardApi.emotions(7),
          dashboardApi.recent(10),
        ])
        setSummary(s)
        setDaily(d)
        setEmotions(e)
        setRecent(r)
      } catch (e) {
        if (e?.code === 401) { localStorage.removeItem('token'); navigate('/login'); return }
        setError(e.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="error">{error}</p>

  const totalUsers = summary?.total_users ?? 0
  const attendanceToday = summary?.attendance_today ?? 0
  const uniquePeopleToday = summary?.unique_people_today ?? 0
  const emotionsToday = summary?.emotions_today ?? {}
  const last = summary?.last_attendance

  const maxDaily = Math.max(1, ...daily.map(d => d.count))
  const emotionsSorted = Object.entries(emotions.distribution || {}).sort((a,b)=>b[1]-a[1])

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="muted">Overview of usage, attendance, and emotions.</p>

      {/* Stat Cards */}
      <div className="cards">
        <StatCard title="Total Users" value={totalUsers} />
        <StatCard title="Attendance Today" value={attendanceToday} />
        <StatCard title="Unique People Today" value={uniquePeopleToday} />
      </div>

      {/* Chart + Emotion Distribution */}
      <div className="grid-2">
        <div className="panel">
          <h2>Attendance — Last 7 Days</h2>
          <div className="mini-bars">
            {daily.map((d) => (
              <div key={d.date} className="mini-bar">
                <div className="mini-bar-fill" style={{ height: `${(d.count / maxDaily) * 100}%` }} />
                <span className="mini-bar-label">{d.date.slice(5)}</span>
                <span className="mini-bar-value">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Emotion Distribution (7 days)</h2>
          {emotionsSorted.length ? (
            <div className="bars">
              {emotionsSorted.map(([label, value]) => (
                <div className="bar-row" key={label}>
                  <div className="bar-label">{label}</div>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: `${Math.min(100, value)}%` }}></div>
                  </div>
                  <div className="bar-value">{value}</div>
                </div>
              ))}
            </div>
          ) : <p>No emotion data yet.</p>}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Recent Activity</h2>
        {last && <p className="muted">Last: <strong>{last.name}</strong> — {last.emotion} at {new Date(last.timestamp).toLocaleString()}</p>}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Name</th><th>Emotion</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              {recent.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.name}</td>
                  <td>{r.emotion}</td>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local styles for the dashboard */}
      <style>{`
        .cards { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; margin: 12px 0 20px; }
        .card { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; }
        .card h3 { margin: 0 0 8px; font-weight: 600; }
        .card .value { font-size: 28px; font-weight: 700; }

        .grid-2 { display:grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
        .panel { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; }

        .mini-bars { display:flex; align-items:flex-end; gap: 10px; height: 160px; margin-top: 8px; }
        .mini-bar { position:relative; width: 36px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; }
        .mini-bar-fill { width: 100%; background: var(--brand); border-radius: 10px 10px 0 0; }
        .mini-bar-label { font-size: 12px; margin-top: 4px; color: var(--muted); }
        .mini-bar-value { position:absolute; top: -20px; font-size: 12px; }

        .bars { display:grid; gap: 8px; }
        .bar-row { display:flex; align-items:center; gap: 8px; }
        .bar-label { width: 110px; }
        .bar { flex:1; background: rgba(255,255,255,0.08); border-radius: 999px; overflow:hidden; height: 12px; }
        .bar-fill { height: 12px; background: var(--accent); }
      `}</style>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
    </div>
  )
}