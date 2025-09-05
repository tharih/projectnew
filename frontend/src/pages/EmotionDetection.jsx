import React, { useEffect, useRef, useState } from 'react'
import { detectEmotion } from '../api/client.js'
import { getUsernameFromToken } from '../api/client.js'

export default function EmotionDetection() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [lastFaces, setLastFaces] = useState([])
  const intervalRef = useRef(null)
const personName = getUsernameFromToken() || localStorage.getItem('username') || 'Camera User'
  // Simple cooldown to avoid spamming /api/attendance/mark (adjust as needed)
  const lastSentRef = useRef(0)
  const SEND_COOLDOWN_MS = 2500

  useEffect(() => () => stopStream(), [])

  const startStream = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setRunning(true)
        tick()
        intervalRef.current = setInterval(tick, 700)
      }
    } catch (e) {
      setError('Could not access camera. Please allow permission.')
    }
  }

  const stopStream = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
  }

  const tick = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth, h = video.videoHeight
    if (!w || !h) return
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))

    try {
      const res = await detectEmotion(blob)
      setStats(res.history || {})
      setLastFaces(res.faces || [])

      // draw overlays
      ctx.drawImage(video, 0, 0, w, h)
      ctx.lineWidth = 3
      ctx.font = '16px Poppins, sans-serif'
      ctx.strokeStyle = 'white'
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      res.faces.forEach(f => {
        const { x, y, width, height } = f.bbox
        ctx.strokeRect(x, y, width, height)
        const label = `${f.top_emotion}`
        const tw = ctx.measureText(label).width + 10
        ctx.fillRect(x, y - 22, tw, 20)
        ctx.fillStyle = 'white'
        ctx.fillText(label, x + 5, y - 7)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
      })

      // === NEW: persist detection to backend attendance ===
      if (res.faces?.length) {
        const now = Date.now()
        if (now - lastSentRef.current >= SEND_COOLDOWN_MS) {
          const top = res.faces[0]; // first face
const personName = localStorage.getItem('username') || 'Camera User';
await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/attendance/mark`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
  },
  body: JSON.stringify({ name: personName, emotion: top.top_emotion }),
          }).catch(() => {}) // non-blocking

          lastSentRef.current = now
        }
      }
      // === END NEW ===

    } catch (e) {
      if (e?.code === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
      setError(e.message || 'Failed to detect')
    }
  }

  return (
    <div className="page">
      <h1>Emotion Detection</h1>
      <p className="muted">Live webcam emotion detection using facial landmarks.</p>

      <div className="grid-2">
        <div className="panel">
          <div className="video-wrap">
            <video ref={videoRef} playsInline muted className="video"></video>
            <canvas ref={canvasRef} className="overlay"></canvas>
            {!running ? <button onClick={startStream}>Start Camera</button> : <button onClick={stopStream}>Stop Camera</button>}
          </div>
          {error && <p className="error">{error}</p>}
        </div>

        <div className="panel">
          <h2>Dashboard</h2>
          {Object.keys(stats).length === 0 ? <p>No data yet.</p> : (
            <div className="bars">
              {Object.entries(stats).sort((a,b)=>b[1]-a[1]).map(([label, value]) => (
                <div key={label} className="bar-row">
                  <div className="bar-label">{label}</div>
                  <div className="bar"><div className="bar-fill" style={{width: `${Math.min(100, value)}%`}}></div></div>
                  <div className="bar-value">{value}</div>
                </div>
              ))}
            </div>
          )}
          <h3 style={{marginTop: '16px'}}>Last result</h3>
          {lastFaces.length ? <ul>{lastFaces.map((f, i)=>(<li key={i}>{f.top_emotion} — bbox ({f.bbox.x}, {f.bbox.y}, {f.bbox.width}×{f.bbox.height})</li>))}</ul> : <p>—</p>}
        </div>
      </div>

      <style>{`
        .grid-2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
        .panel { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; }
        .video-wrap { position: relative; display: inline-block; }
        .video, .overlay { max-width: 100%; border-radius: 12px; }
        .video { transform: scaleX(-1); }
        .overlay { position: absolute; left:0; top:0; transform: scaleX(-1); }
        .bars { display: grid; gap: 8px; }
        .bar-row { display:flex; align-items:center; gap: 8px; }
        .bar-label { width: 100px; }
        .bar { flex:1; background: rgba(255,255,255,0.08); border-radius: 999px; overflow:hidden; height: 12px; }
        .bar-fill { height: 12px; background: var(--brand); }
      `}</style>
    </div>
  )
}
