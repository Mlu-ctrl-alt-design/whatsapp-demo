// Vercel serverless function — GET /api/leads.csv downloads every captured
// lead as a CSV. Used by the booth UI's "Export CSV" button when the user
// wants the full server-side ledger (vs the browser localStorage queue).

import { applyCors, listLeads } from "./_lib/lead.js";

const csvCell = (v) => `"${(v == null ? "" : String(v)).replace(/"/g, '""')}"`;

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const leads = await listLeads();
    const header = ["timestamp", "status", "name", "mobile", "email", "campaign", "crmRef", "reason"];
    const csv = [
      header.join(","),
      ...leads.map(e => header.map(h => csvCell(e[h])).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="crm-leads-${new Date().toISOString().replace(/[:.]/g, "-")}.csv"`
    );
    return res.status(200).send(csv);
  } catch (err) {
    console.error("[api/leads.csv]", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
