import { useMemo, useState } from "react";

export default function Register({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    full_name: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const canSubmit = useMemo(() => {
    return (
      form.full_name.trim().length >= 2 &&
      form.username.trim().length >= 3 &&
      form.email.trim().length > 3 &&
      form.password.length >= 6
    );
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // Try to parse JSON either way
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg =
          (data && (data.detail || data.message)) || "Registration failed";
        throw new Error(msg);
      }

      // success
      onLogin?.(data);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-rose-50 to-amber-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-sm opacity-70 mb-6">
          Join with your student email and a username.
        </p>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              name="full_name"
              className="w-full border rounded-xl p-3"
              onChange={onChange}
              value={form.full_name}
              placeholder="Alice Khan"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Student Email</label>
            <input
              name="email"
              type="email"
              className="w-full border rounded-xl p-3"
              onChange={onChange}
              value={form.email}
              placeholder="alice@uni.edu"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              name="username"
              className="w-full border rounded-xl p-3"
              onChange={onChange}
              value={form.username}
              placeholder="alice"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="flex gap-2">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                className="w-full border rounded-xl p-3"
                onChange={onChange}
                value={form.password}
                placeholder="••••••••"
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
            <p className="text-xs opacity-70 mt-1">
              Use at least 6 characters.
            </p>
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
            {loading ? "Creating…" : "Create account"}
          </button>

          <div className="text-sm text-center">
            Already have an account?{" "}
            <a href="/login" className="underline">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
