// Thin client for the Daystar CRM (Frappe). Used by the WhatsApp demo to log
// a CRM Lead after the visitor finishes the booth flow.
//
// Configure via Vite env vars in `.env.local`:
//   VITE_CRM_BASE_URL=/crm                 (use Vite dev proxy)
//   VITE_CRM_API_KEY=xxx
//   VITE_CRM_API_SECRET=yyy
//   VITE_CRM_CAMPAIGN=SAFPA                (optional, defaults to "SAFPA")
//   VITE_CRM_LEAD_DOCTYPE=CRM Lead         (optional, defaults to "CRM Lead")
//
// When a POST fails (network, CORS, validation, server down) the submission
// is queued to localStorage so it can be reviewed and exported as CSV later.

const BASE      = import.meta.env.VITE_CRM_BASE_URL || "/crm";
const API_KEY   = import.meta.env.VITE_CRM_API_KEY;
const API_SEC   = import.meta.env.VITE_CRM_API_SECRET;
const CAMPAIGN  = import.meta.env.VITE_CRM_CAMPAIGN || "SAFPA";
const DOCTYPE   = import.meta.env.VITE_CRM_LEAD_DOCTYPE || "CRM Lead";

const QUEUE_KEY = "crm_lead_queue_v1";

export const crmConfigured = () => Boolean(API_KEY && API_SEC);

export async function createLead({ name, mobile, email }) {
  const submission = { name, mobile, email, campaign: CAMPAIGN };

  if (!crmConfigured()) {
    queueLead({ ...submission, reason: "CRM credentials not configured" });
    return { ok: false, skipped: true, reason: "CRM credentials not configured" };
  }

  const [firstName, ...rest] = (name || "").trim().split(/\s+/);
  const lastName = rest.join(" ");

  const payload = {
    lead_name: name,
    first_name: firstName || name,
    last_name: lastName || undefined,
    mobile_no: mobile,
    email: email,
    campaign: CAMPAIGN,
  };

  const url = `${BASE.replace(/\/$/, "")}/api/resource/${encodeURIComponent(DOCTYPE)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `token ${API_KEY}:${API_SEC}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      queueLead({ ...submission, reason: `HTTP ${res.status}: ${body.slice(0, 300)}` });
      return { ok: false, status: res.status, error: body.slice(0, 500) };
    }
    const data = await res.json();
    return { ok: true, name: data?.data?.name, data };
  } catch (err) {
    queueLead({ ...submission, reason: err.message || String(err) });
    return { ok: false, error: err.message || String(err) };
  }
}

// ─── Local queue (failed / unsent submissions) ────────────────────────────────

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
  const header = ["timestamp", "name", "mobile", "email", "campaign", "reason"];
  const rows = list.map(e => header.map(h => csvCell(e[h])).join(","));
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `crm-leads-pending-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
