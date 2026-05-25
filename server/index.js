// Small booth backend. The browser POSTs every WhatsApp completion here;
// we persist it to disk (data/leads.json) BEFORE attempting any CRM
// forward, so the lead is safe even if Daystar / our network / our
// process is having a bad day. Then we try the CRM forward and update
// the row with the outcome. The browser still keeps its own localStorage
// queue as a last-ditch fallback for when this backend is itself
// unreachable.
//
// Run with: node server/index.js
// Env vars (mirror the Vite client's vars):
//   PORT=3001
//   CRM_BASE_URL=https://crm.thedaystar.co.za
//   CRM_API_KEY=...
//   CRM_API_SECRET=...
//   CRM_CAMPAIGN=SAFPA
//   CRM_LEAD_DOCTYPE=CRM Lead
//   DATA_DIR=./data
//   CORS_ORIGIN=*                  comma-separated list, or *

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Reuse the .env.local file the Vite client already uses if the unprefixed
// vars aren't set — saves the user from maintaining the same creds twice.
const env = (k, fallback) =>
  process.env[k] ?? process.env[`VITE_${k}`] ?? fallback;

const PORT          = Number(process.env.PORT || 3001);
const DATA_DIR      = resolve(process.env.DATA_DIR || join(__dirname, "..", "data"));
const STORE_PATH    = join(DATA_DIR, "leads.json");
const CRM_BASE      = env("CRM_BASE_URL", "https://crm.thedaystar.co.za");
const CRM_KEY       = env("CRM_API_KEY");
const CRM_SEC       = env("CRM_API_SECRET");
const CRM_CAMPAIGN  = env("CRM_CAMPAIGN", "SAFPA");
const CRM_DOCTYPE   = env("CRM_LEAD_DOCTYPE", "CRM Lead");
const CORS_ORIGIN   = process.env.CORS_ORIGIN || "*";

const crmConfigured = Boolean(CRM_KEY && CRM_SEC);

// ─── Storage ──────────────────────────────────────────────────────────────────
async function loadStore() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) return [];
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf8")) || [];
  } catch {
    return [];
  }
}

let writeChain = Promise.resolve();
function saveStore(list) {
  writeChain = writeChain.then(() =>
    writeFile(STORE_PATH, JSON.stringify(list, null, 2)));
  return writeChain;
}

// ─── CRM forward ──────────────────────────────────────────────────────────────
async function forwardToCrm({ name, mobile, email }) {
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

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function applyCors(req, res) {
  const origin = req.headers.origin;
  const allow = CORS_ORIGIN === "*"
    ? "*"
    : CORS_ORIGIN.split(",").map(s => s.trim()).includes(origin) ? origin : "";
  if (allow) res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, code, body) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

const csvCell = (v) => `"${(v == null ? "" : String(v)).replace(/"/g, '""')}"`;
function leadsToCsv(list) {
  const header = ["timestamp", "status", "name", "mobile", "email", "campaign", "crmRef", "reason"];
  return [
    header.join(","),
    ...list.map(e => header.map(h => csvCell(e[h])).join(",")),
  ].join("\n");
}

// ─── Routes ───────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return json(res, 200, { ok: true, crmConfigured });
    }

    if (req.method === "POST" && url.pathname === "/api/leads") {
      const body = await readBody(req);
      const { name = "", mobile = "", email = "" } = body || {};
      if (!name || !mobile) return json(res, 400, { error: "name and mobile are required" });

      const entry = {
        timestamp: new Date().toISOString(),
        status: "queued",
        name, mobile, email,
        campaign: CRM_CAMPAIGN,
        crmRef: "",
        reason: "Saved locally — CRM forward pending",
      };

      // Persist FIRST, then forward. If forward fails, the row stays.
      const list = await loadStore();
      list.push(entry);
      await saveStore(list);

      const result = await forwardToCrm({ name, mobile, email });
      entry.status = result.status;
      entry.crmRef = result.crmRef || "";
      entry.reason = result.reason || entry.reason;
      await saveStore(list);

      return json(res, 200, { ok: true, lead: entry });
    }

    if (req.method === "GET" && url.pathname === "/api/leads") {
      const list = await loadStore();
      return json(res, 200, { leads: list });
    }

    if (req.method === "GET" && url.pathname === "/api/leads.csv") {
      const list = await loadStore();
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="crm-leads-${new Date().toISOString().replace(/[:.]/g, "-")}.csv"`
      );
      res.end(leadsToCsv(list));
      return;
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 500, { error: err.message || String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`[leads-backend] listening on :${PORT}`);
  console.log(`[leads-backend] data file: ${STORE_PATH}`);
  console.log(`[leads-backend] CRM: ${crmConfigured ? CRM_BASE : "not configured (forward disabled)"}`);
});
