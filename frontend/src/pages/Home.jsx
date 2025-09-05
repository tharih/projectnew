import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Home() {
  const [todaysAttendance, setTodaysAttendance] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [newUserName, setNewUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const [attendance, users] = await Promise.all([
          api.getAttendance(),
          api.getRecentUsers(),
        ])
        setTodaysAttendance(attendance || [])
        setRecentUsers(users || [])
      } catch (e) {
        if (e?.code === 401) { localStorage.removeItem('token'); navigate('/login'); return; }
        setError(e.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const addUser = async (e) => {
    e.preventDefault()
    const name = newUserName.trim()
    if (!name) return
    try {
      await api.addUser({ name })
      setRecentUsers((prev) => [{ name }, ...prev])
      setNewUserName('')
    } catch (e) {
      if (e?.code === 401) { localStorage.removeItem('token'); navigate('/login'); return; }
      setError(e.message || 'Failed to add user')
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="dashboard-container">
      <h2>Today's Attendance</h2>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Emotion</th><th>Timestamp</th></tr></thead>
          <tbody>
            {todaysAttendance.length ? todaysAttendance.map((entry, idx) => (
              <tr key={idx}><td>{entry.name}</td><td>{entry.emotion}</td><td>{entry.timestamp}</td></tr>
            )) : <tr><td colSpan="3">No attendance marked yet today.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Recently Added Users</h2>
      <ul className="recent-users">
        {recentUsers.map((user, idx) => (<li key={idx}>{user.name}</li>))}
      </ul>

      <h2>Add New User</h2>
      <form onSubmit={addUser} className="add-user-form">
        <input type="text" placeholder="Enter name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
        <button type="submit">Add User</button>
      </form>
    </div>
  )
}
