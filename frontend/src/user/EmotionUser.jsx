import React, { useEffect, useRef, useState } from 'react'
import { detectEmotion, markMyAttendance } from '../api/client.js'

export default function EmotionUser() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [lastFaces, setLastFaces] = useState([])
  const intervalRef = useRef(null)

  // cooldown between saved attendance events
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
        intervalRef.current = setInterval(tick, 800)
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
      setLastFaces(res.faces || [])

      // overlay
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

      // save MY attendance (server uses username from token)
      if (res.faces?.length) {
        const now = Date.now()
        if (now - lastSentRef.current >= SEND_COOLDOWN_MS) {
          const emotion = res.faces[0].top_emotion
          markMyAttendance(emotion).catch(()=>{}) // fire-and-forget
          lastSentRef.current = now
        }
      }
    } catch (e) {
      if (e?.code === 401) { localStorage.removeItem('token'); window.location.href = '/user/login'; return; }
      setError(e.message || 'Failed to detect')
    }
  }

  return (
    <div className="page">
      <h1>Emotion Detection</h1>
      <p className="muted">Mark your attendance by looking at the camera.</p>

      <div className="panel">
        <div className="video-wrap">
          <video ref={videoRef} playsInline muted className="video"></video>
          <canvas ref={canvasRef} className="overlay"></canvas>
        </div>
        <div style={{marginTop: 12}}>
          {!running ? <button onClick={startStream}>Start Camera</button> : <button onClick={stopStream}>Stop Camera</button>}
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <style>{`
        .panel { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; }
        .video-wrap { position: relative; display: inline-block; }
        .video, .overlay { max-width: 100%; border-radius: 12px; }
        .video { transform: scaleX(-1); }
        .overlay { position: absolute; left:0; top:0; transform: scaleX(-1); }
      `}</style>
    </div>
  )
}
