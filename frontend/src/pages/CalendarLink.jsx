import { useMemo, useState } from "react";

export default function CalendarLink() {
  const [fromIso, setFromIso] = useState("");
  const [toIso, setToIso] = useState("");
  const [err, setErr] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const url = useMemo(() => {
    if (!fromIso || !toIso) return "";
    try {
      // basic date validation
      const from = new Date(fromIso);
      const to = new Date(toIso);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new Error("Invalid ISO date/time");
      }
      if (from > to) throw new Error("From date must be before To date");
      setErr("");
      return `${API_BASE}/api/calendar/attendance.ics?from_iso=${encodeURIComponent(
        fromIso
      )}&to_iso=${encodeURIComponent(toIso)}`;
    } catch (e) {
      setErr(e.message);
      return "";
    }
  }, [fromIso, toIso, API_BASE]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Calendar Feed</h1>
      <p className="mb-3 text-sm opacity-80">
        Use this URL in <strong>Google Calendar</strong> → Settings → Add
        calendar → From URL.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">From (ISO 8601)</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="2025-08-01T00:00:00Z"
            value={fromIso}
            onChange={(e) => setFromIso(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">To (ISO 8601)</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="2025-08-31T23:59:59Z"
            value={toIso}
            onChange={(e) => setToIso(e.target.value)}
          />
        </div>

        {err && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}

        {url && !err && (
          <div className="mt-2 break-all">
            <div className="text-sm font-mono border rounded p-2 bg-gray-50">
              {url}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 underline"
            >
              Open feed
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
