// Shared helpers used by the /api/leads and /api/leads.csv Vercel routes.
// Reads CRM config from env; stores leads in Vercel Postgres (Neon).
//
// First request lazily creates the table (idempotent CREATE TABLE IF NOT
// EXISTS), so there's nothing to run on deploy.

import { sql } from "@vercel/postgres";

const env = (k, fallback) =>
  process.env[k] ?? process.env[`VITE_${k}`] ?? fallback;

const CRM_BASE     = env("CRM_BASE_URL", "https://crm.thedaystar.co.za");
const CRM_KEY      = env("CRM_API_KEY");
const CRM_SEC      = env("CRM_API_SECRET");
const CRM_CAMPAIGN = env("CRM_CAMPAIGN", "SAFPA");
const CRM_DOCTYPE  = env("CRM_LEAD_DOCTYPE", "CRM Lead");
const CORS_ORIGIN  = process.env.CORS_ORIGIN || "*";

export const crmConfigured = Boolean(CRM_KEY && CRM_SEC);

export function applyCors(req, res) {
  const origin = req.headers.origin;
  const allow = CORS_ORIGIN === "*"
    ? "*"
    : CORS_ORIGIN.split(",").map(s => s.trim()).includes(origin) ? origin : "";
  if (allow) res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export async function forwardToCrm({ name, mobile, email }) {
  if (!crmConfigured) {
    return { status: "skipped", reason: "CRM credentials not configured" };
  }
  const [firstName, ...rest] = (name || "").trim().split(/\s+/);
  const payload = {
    lead_name: name,
    first_name: firstName || name,
    last_name: rest.join(" ") || undefined,
    mobile_no: mobile,
    email,
    campaign: CRM_CAMPAIGN,
  };
  const url = `${CRM_BASE.replace(/\/$/, "")}/api/resource/${encodeURIComponent(CRM_DOCTYPE)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `token ${CRM_KEY}:${CRM_SEC}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      return { status: "failed", reason: `HTTP ${res.status}: ${text.slice(0, 400)}` };
    }
    let data; try { data = JSON.parse(text); } catch { data = null; }
    const crmRef = data?.data?.name || "";
    return { status: "sent", crmRef, reason: crmRef ? `Sent — ${crmRef}` : "Sent" };
  } catch (err) {
    return { status: "failed", reason: err.message || String(err) };
  }
}

// ─── Postgres ────────────────────────────────────────────────────────────────

let initPromise;
function ensureSchema() {
  if (!initPromise) {
    initPromise = sql`
      CREATE TABLE IF NOT EXISTS leads (
        id        SERIAL PRIMARY KEY,
        ts        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status    TEXT NOT NULL,
        name      TEXT NOT NULL,
        mobile    TEXT NOT NULL,
        email     TEXT,
        campaign  TEXT,
        crm_ref   TEXT,
        reason    TEXT
      )
    `.catch((err) => { initPromise = null; throw err; });
  }
  return initPromise;
}

// Insert and return the row (with the assigned id + db-side timestamp).
export async function insertLead({ status, name, mobile, email, campaign, crmRef, reason }) {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO leads (status, name, mobile, email, campaign, crm_ref, reason)
    VALUES (${status}, ${name}, ${mobile}, ${email}, ${campaign}, ${crmRef || ""}, ${reason || ""})
    RETURNING id, ts, status, name, mobile, email, campaign, crm_ref, reason
  `;
  return rowToLead(rows[0]);
}

export async function updateLead(id, { status, crmRef, reason }) {
  await ensureSchema();
  const { rows } = await sql`
    UPDATE leads
       SET status = ${status},
           crm_ref = ${crmRef || ""},
           reason = ${reason || ""}
     WHERE id = ${id}
     RETURNING id, ts, status, name, mobile, email, campaign, crm_ref, reason
  `;
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function listLeads() {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, ts, status, name, mobile, email, campaign, crm_ref, reason
      FROM leads
     ORDER BY ts DESC
  `;
  return rows.map(rowToLead);
}

function rowToLead(r) {
  return {
    id: r.id,
    timestamp: (r.ts instanceof Date ? r.ts.toISOString() : r.ts),
    status: r.status,
    name: r.name,
    mobile: r.mobile,
    email: r.email || "",
    campaign: r.campaign || "",
    crmRef: r.crm_ref || "",
    reason: r.reason || "",
  };
}

export { CRM_CAMPAIGN };
