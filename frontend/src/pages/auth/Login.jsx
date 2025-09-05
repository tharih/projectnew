import { useMemo, useState } from "react";

export default function Login({ onLogin }) {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const canSubmit = useMemo(() => {
    return identity.trim().length > 0 && password.length >= 6;
  }, [identity, password]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: identity.trim(), password }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || "Login failed";
        throw new Error(msg);
      }

      onLogin?.(data);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 to-sky-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-sm opacity-70 mb-6">Sign in with your email or username.</p>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm mb-1">Email or Username</label>
            <input
              className="w-full border rounded-xl p-3"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="e.g. alice or alice@uni.edu"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="flex gap-2">
              <input
                className="w-full border rounded-xl p-3"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                minLength={6}
              />
              <button
                type="button"
                className="px-3 border rounded-xl"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs opacity-70 mt-1">Use at least 6 characters.</p>
          </div>

          {err && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl bg-black text-white disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex justify-between text-sm">
            <a href="/register" className="underline">Create account</a>
            <a href="/forgot" className="underline">Forgot password?</a>
          </div>

          <div className="relative py-2 text-center text-sm opacity-60">or</div>
          <a href="/face-login" className="w-full block text-center py-3 rounded-xl border">
            Sign in with Face
          </a>
        </form>
      </div>
    </div>
  );
}
