import React, { useState } from 'react'

export default function ForgotUser() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const onSubmit = (e) => { e.preventDefault(); setSent(true) }

  return (
    <div className="page">
      <h1>Forgot Password</h1>
      {!sent ? (
        <form onSubmit={onSubmit} className="forgot-form">
          <input type="email" placeholder="Enter your email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
          <button type="submit">Send Reset Link</button>
        </form>
      ) : <p>If the email exists, a reset link has been sent.</p>}
    </div>
  )
}
