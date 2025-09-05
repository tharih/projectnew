import { useMemo, useState } from "react";

export default function PayrollExport() {
  const [fromIso, setFromIso] = useState("");
  const [toIso, setToIso] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const valid = useMemo(() => {
    if (!fromIso || !toIso) return false;
    const a = new Date(fromIso);
    const b = new Date(toIso);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
    return a <= b;
  }, [fromIso, toIso]);

  const filename = useMemo(() => {
    const safe = (s) => String(s).replace(/[:]/g, "-");
    return `payroll_${safe(fromIso)}_${safe(toIso)}.csv`;
  }, [fromIso, toIso]);

  const tryDownload = async (url) => {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      let msg = "Download failed";
      try {
        const data = await res.json();
        msg = data?.detail || data?.message || msg;
      } catch {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const dl = async () => {
    setErr("");
    if (!valid) {
      setErr("Please enter valid ISO datetimes (From ≤ To).");
      return;
    }
    setDownloading(true);
    try {
      // 1) Your route (as in your snippet)
      const url1 = `${API_BASE}/api/reports/payroll?from_iso=${encodeURIComponent(
        fromIso
      )}&to_iso=${encodeURIComponent(toIso)}`;
      try {
        await tryDownload(url1);
      } catch {
        // 2) Fallback to backend I provided earlier
        const url2 = `${API_BASE}/exports/payroll.csv?start=${encodeURIComponent(
          fromIso
        )}&end=${encodeURIComponent(toIso)}`;
        await tryDownload(url2);
      }
    } catch (e) {
      setErr(e?.message || "Export error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Payroll Export</h1>
      <p className="mb-3 text-sm opacity-80">
        Choose a UTC ISO range (e.g. <code>2025-08-01T00:00:00Z</code>).
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">From (ISO 8601)</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="2025-08-01T00:00:00Z"
            value={fromIso}
            onChange={(e) => setFromIso(e.target.value)}
            disabled={downloading}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">To (ISO 8601)</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="2025-08-31T23:59:59Z"
            value={toIso}
            onChange={(e) => setToIso(e.target.value)}
            disabled={downloading}
          />
        </div>

        {err && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}

        <button
          onClick={dl}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={downloading || !valid}
        >
          {downloading ? "Exporting…" : "Download CSV"}
        </button>
      </div>
    </div>
  );
}
