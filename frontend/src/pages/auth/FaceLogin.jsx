import { useEffect, useMemo, useRef, useState } from "react";
import "./FaceLogin.css"; 

export default function FaceLogin({ onLogin }) {
  // Form + flow state
  const [identity, setIdentity] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState("idle"); // idle | starting | camera | verifying
  const [tipsOpen, setTipsOpen] = useState(true);

  // Camera + devices
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [fps, setFps] = useState(24);

  // UI niceties
  const [countdown, setCountdown] = useState(3);
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const busy = progress !== "idle";
  const canStart = identity.trim().length > 0 && !busy;

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    try {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
  };

  async function refreshDevices() {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      if (cams.length && !deviceId) setDeviceId(cams[0].deviceId);
    } catch {}
  }

  const enableCamera = async () => {
    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, frameRate: { ideal: fps } }
          : { frameRate: { ideal: fps } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      await refreshDevices();
      return true;
    } catch (e) {
      setErr(
        e?.name === "NotAllowedError"
          ? "Camera access was denied."
          : "Unable to access camera."
      );
      setProgress("idle");
      return false;
    }
  };

  const start = async () => {
    setErr("");
    if (!identity.trim()) {
      setErr("Please enter your email or username first.");
      return;
    }
    setSessionId("");
    setProgress("starting");
    stopCamera();

    try {
      const r = await fetch(`${API_BASE}/api/auth/face/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: identity.trim() }),
      });
      if (!r.ok) throw new Error("Start failed");
      const data = await r.json();
      const sid = data?.face_session_id || "";
      setSessionId(sid);

      const ok = await enableCamera();
      if (!ok) return;

      setProgress("camera");
      setCountdown(3);
      const t0 = Date.now();
      const iv = setInterval(() => {
        const left = 3 - Math.floor((Date.now() - t0) / 1000);
        setCountdown(left > 0 ? left : 0);
        if (left <= 0) {
          clearInterval(iv);
          const faceToken = `demo-token-${sid}`;
          verify(faceToken);
        }
      }, 250);
    } catch (e) {
      setErr(e?.message || "Failed to start face session.");
      setProgress("idle");
    }
  };

  const verify = async (faceToken) => {
    setProgress("verifying");
    try {
      const r = await fetch(`${API_BASE}/api/auth/face/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ face_token: faceToken }),
      });
      if (!r.ok) throw new Error("Face verification failed");
      const data = await r.json();
      stopCamera();
      setProgress("idle");
      onLogin?.(data);
    } catch (e) {
      setErr(e?.message || "Verification error.");
      stopCamera();
      setProgress("idle");
    }
  };

  const retry = () => {
    setErr("");
    setProgress("idle");
    stopCamera();
  };

  const progressPct = useMemo(() => {
    switch (progress) {
      case "starting":
        return 25;
      case "camera":
        return 70;
      case "verifying":
        return 100;
      default:
        return 0;
    }
  }, [progress]);

  return (
    <div className="face-gradient">
      <div className="login-wrapper"> 
      <div className="face-card">
<div className="login-box">
        {/* Header */}
        <div className="face-header">
          <div>
            <h1 className="face-title">Face sign-in</h1>
            <p className="face-sub">Hands-free, fast, and secure.</p>
          </div>
          {progress !== "idle" && (
            <button className="link-dim" onClick={retry} aria-label="Cancel">
              Cancel
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="progress-wrap" aria-hidden={progressPct === 0}>
          <div className="progress" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Identity + controls */}
        <div className="grid-2">
          <div className="col-span-2">
            <label className="label">Email or Username</label>
            <input
              className="input"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="e.g. alice or alice@uni.edu"
              disabled={busy}
              aria-label="Email or username"
            />
          </div>

          <div>
            <label className="label">Camera</label>
            <select
              className="input"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              disabled={busy || !devices.length}
              aria-label="Camera device"
            >
              {devices.length === 0 ? (
                <option value="">(Default)</option>
              ) : (
                devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="label">Frame rate</label>
            <select
              className="input"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              disabled={busy}
              aria-label="Frame rate"
            >
              {[15, 24, 30, 60].map((v) => (
                <option key={v} value={v}>
                  {v} fps
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CTAs */}
        <div className="cta-row">
          <button
            onClick={start}
            className="btn-primary"
            disabled={!canStart}
          >
            {progress === "starting" ? "Starting…" : "Start face sign-in"}
          </button>
          {progress !== "idle" && (
            <button onClick={retry} className="btn-ghost" aria-label="Retry">
              Retry
            </button>
          )}
        </div>

        {/* Error */}
        {err && <div className="alert-error">{err}</div>}

        {/* Live preview */}
        {progress !== "idle" && (
          <div className="preview-wrap">
            {sessionId && (
              <div className="session-id">
                Session: {String(sessionId).slice(0, 16)}…
              </div>
            )}

            <div className="video-shell">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video"
              />
              {/* Face overlay */}
              <div className="overlay">
                <div className="face-ring" />
              </div>
              {/* Countdown */}
              {progress === "camera" && countdown > 0 && (
                <div className="count-pill">Capturing in {countdown}s</div>
              )}
            </div>

            <div className="hint">
              {progress === "starting" && "Preparing camera…"}
              {progress === "camera" && "Align your face inside the circle."}
              {progress === "verifying" && "Verifying…"}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="tips">
          <button
            className="link"
            onClick={() => setTipsOpen((v) => !v)}
          >
            {tipsOpen ? "Hide tips" : "Show tips"}
          </button>
          {tipsOpen && (
            <ul className="tips-list">
              <li>Center your face and keep a neutral expression.</li>
              <li>Avoid strong backlight; face a window or lamp.</li>
              <li>Remove sunglasses/hat; keep the camera steady.</li>
              <li>Choose the correct camera if you have multiple.</li>
            </ul>
          )}
        </div>

        {/* Alt sign in */}
        <div className="alt">
          Prefer password?{" "}
          <a href="/login" className="link">
            Sign in here
          </a>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
