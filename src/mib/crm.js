// Client for the booth backend. The browser POSTs every WhatsApp completion
// to /api/leads — that backend (see server/index.js) owns persistence and
// forwards to the Daystar CRM server-side. If our backend is unreachable
// the submission still lands in a localStorage queue as a last-ditch
// fallback so it can be exported as CSV later.
//
// Configure via Vite env vars in `.env.local`:
//   VITE_API_BASE_URL=/api                (default; routed via Vite proxy in dev)
//   VITE_CRM_CAMPAIGN=SAFPA               (display-only on the queue entries)

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const CAMPAIGN = import.meta.env.VITE_CRM_CAMPAIGN || "SAFPA";

const QUEUE_KEY = "crm_lead_queue_v1";

export async function createLead({ name, mobile, email }) {
  const submission = { name, mobile, email, campaign: CAMPAIGN };

  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ name, mobile, email }),
    });

    if (!res.ok) {
      const body = await res.text();
      // Backend rejected (e.g. validation). Stash to the local fallback
      // so we don't lose the visitor's details.
      queueLead({
        ...submission, status: "failed",
        reason: `Backend HTTP ${res.status}: ${body.slice(0, 300)}`,
      });
      return { ok: false, status: res.status, error: body.slice(0, 500) };
    }

    const data = await res.json();
    const lead = data?.lead || {};
    // Mirror the backend's record into the local queue so the booth UI
    // can show it even when no one is hitting the server's /api/leads.
    queueLead({
      ...submission,
      status: lead.status || "queued",
      crmRef: lead.crmRef || "",
      reason: lead.reason || "",
    });
    return { ok: true, name: lead.crmRef || "", data: lead };
  } catch (err) {
    queueLead({
      ...submission, status: "failed",
      reason: `Backend unreachable: ${err.message || String(err)}`,
    });
    return { ok: false, error: err.message || String(err) };
  }
}

// ─── Local fallback queue (used when the backend is unreachable) ──────────────

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(list) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("crm-queue-changed"));
  } catch {
    // localStorage full or unavailable — nothing useful to do here.
  }
}

export function queueLead(entry) {
  const list = readQueue();
  list.push({
    timestamp: new Date().toISOString(),
    name: entry.name || "",
    mobile: entry.mobile || "",
    email: entry.email || "",
    campaign: entry.campaign || CAMPAIGN,
    status: entry.status || "queued",
    crmRef: entry.crmRef || "",
    reason: entry.reason || "",
  });
  writeQueue(list);
}

export function getQueuedLeads() {
  return readQueue();
}

export function clearQueuedLeads() {
  writeQueue([]);
}

export function removeQueuedLead(timestamp) {
  writeQueue(readQueue().filter(e => e.timestamp !== timestamp));
}

// CSV-escape a single value: wrap in quotes, double any internal quotes.
const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
};

export function exportQueuedLeadsCsv() {
  const list = readQueue();
  const header = ["timestamp", "status", "name", "mobile", "email", "campaign", "crmRef", "reason"];
  const rows = list.map(e => header.map(h => csvCell(e[h])).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `crm-leads-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
