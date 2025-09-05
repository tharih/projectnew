import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length >= 6,
    [username, password]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setError("");
    setLoading(true);

    try {
      // Be flexible about api.login signature and response shape:
      // - signature A: api.login(username, password)
      // - signature B: api.login({ username, password })
      let res;
      try {
        res = await api.login(username, password);
      } catch {
        res = await api.login({ username, password });
      }

      // Accept either { token } or { access_token }
      const token = res?.token || res?.access_token;
      if (!token) throw new Error("Login succeeded but no token returned");

      // Persist
      localStorage.setItem("token", token);
      localStorage.setItem("username", username.trim());

      // Go to previous page or home
      const dest = location.state?.from?.pathname || "/";
      navigate(dest, { replace: true });
    } catch (e) {
      setError(e?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-box">
          <h2>
            Welcome to <span className="highlight">FaceSense</span>
          </h2>

          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="password"
              name="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={!canSubmit || loading}>
              {loading ? "Signing in…" : "Login"}
            </button>

            <p>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
