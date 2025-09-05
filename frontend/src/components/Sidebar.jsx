import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">FaceSense</h2>
      <ul className="nav-links">
        <li><NavLink to="/" end>🏠 Home</NavLink></li>
        <li><NavLink to="/dashboard">📋 Dashboard</NavLink></li>
        {/* <li><NavLink to="/train-machine">📦 Train Machine</NavLink></li> */}
        {/* <li><NavLink to="/test-machine">🧪 Test Machine</NavLink></li> */}
        <li><NavLink to="/emotion-detection">😃 Emotion Detection</NavLink></li>
        <li className="logout"><button
    onClick={() => {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }}
    style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', padding:0 }}
  >
    🚪 Logout
  </button></li>
      </ul>
    </aside>
  )
}
