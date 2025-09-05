import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    // TODO: Replace this with a real API call to your backend
    // e.g. await fetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
    setSent(true);
  };

  return (
    <div className="page" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h1>Forgot Password</h1>

      {!sent ? (
        <form onSubmit={onSubmit} className="forgot-form" style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded p-2"
          />
          <button type="submit" className="bg-black text-white rounded p-2">
            Send Reset Link
          </button>
          {error && <p style={{ color: "crimson", fontSize: 14 }}>{error}</p>}
        </form>
      ) : (
        <p>If the email exists, a reset link has been sent.</p>
      )}
    </div>
  );
}
