import { useEffect, useMemo, useState } from "react";

export default function Integrations() {
  const [form, setForm] = useState({ slack_webhook: "", teams_webhook: "" });
  const [initial, setInitial] = useState({ slack_webhook: "", teams_webhook: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/settings/integrations`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: ac.signal,
        });
        if (!res.ok) {
          let msg = "Failed to load settings";
          try {
            const j = await res.json();
            msg = j?.detail || j?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        const next = {
          slack_webhook: data?.slack_webhook || "",
          teams_webhook: data?.teams_webhook || "",
        };
        setForm(next);
        setInitial(next);
      } catch (e) {
        if (!ac.signal.aborted) setErr(e?.message || "Load error");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [API_BASE, token]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isValidUrl = (s) => {
    if (!s) return true; // empty is allowed
    try {
      const u = new URL(s);
      return u.protocol === "https:"; // enforce https
    } catch {
      return false;
    }
  };

  const invalidSlack = !isValidUrl(form.slack_webhook);
  const invalidTeams = !isValidUrl(form.teams_webhook);

  const dirty = useMemo(() => {
    return (
      form.slack_webhook !== initial.slack_webhook ||
      form.teams_webhook !== initial.teams_webhook
    );
  }, [form, initial]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    setErr("");

    if (invalidSlack || invalidTeams) {
      setErr("Please enter valid https URLs.");
      return;
    }
    if (!dirty) {
      setSaved(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/integrations`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let msg = "Failed to save";
        try {
          const j = await res.json();
          msg = j?.detail || j?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      setInitial(form);
      setSaved(true);
    } catch (e) {
      setErr(e?.message || "Save error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notifications & Integrations</h1>
      <p className="mb-6 text-sm opacity-80">
        Paste your Slack or Microsoft Teams incoming webhook URLs.
      </p>

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Slack Webhook URL</label>
          <input
            type="url"
            name="slack_webhook"
            className={`border rounded w-full p-2 ${invalidSlack ? "border-red-400" : ""}`}
            placeholder="https://hooks.slack.com/services/…"
            value={form.slack_webhook}
            onChange={onChange}
            disabled={saving}
          />
          {invalidSlack && (
            <p className="text-xs text-red-600 mt-1">Enter a valid https URL.</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Microsoft Teams Webhook URL</label>
          <input
            type="url"
            name="teams_webhook"
            className={`border rounded w-full p-2 ${invalidTeams ? "border-red-400" : ""}`}
            placeholder="https://outlook.office.com/webhook/…"
            value={form.teams_webhook}
            onChange={onChange}
            disabled={saving}
          />
          {invalidTeams && (
            <p className="text-xs text-red-600 mt-1">Enter a valid https URL.</p>
          )}
        </div>

        {err && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={saving || invalidSlack || invalidTeams}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && !err && (
            <span className="text-green-600 text-sm">Saved ✓</span>
          )}
          {!dirty && !saving && !err && (
            <span className="text-sm opacity-70">No changes</span>
          )}
        </div>
      </form>
    </div>
  );
}
