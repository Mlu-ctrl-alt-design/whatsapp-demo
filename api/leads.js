// Vercel serverless function — POST /api/leads creates a row in Postgres,
// then attempts the CRM forward, then updates the row with the outcome.
// GET /api/leads returns the full ledger.

import {
  applyCors, forwardToCrm, insertLead, updateLead, listLeads, CRM_CAMPAIGN,
} from "./_lib/lead.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      const leads = await listLeads();
      return res.status(200).json({ leads });
    }

    if (req.method === "POST") {
      const { name = "", mobile = "", email = "" } = req.body || {};
      if (!name || !mobile) {
        return res.status(400).json({ error: "name and mobile are required" });
      }

      // Save first so the lead is durable even if the CRM forward dies.
      const saved = await insertLead({
        status: "queued",
        name, mobile, email,
        campaign: CRM_CAMPAIGN,
        crmRef: "",
        reason: "Saved — CRM forward pending",
      });

      const result = await forwardToCrm({ name, mobile, email });
      const updated = await updateLead(saved.id, {
        status: result.status,
        crmRef: result.crmRef || "",
        reason: result.reason || saved.reason,
      });

      return res.status(200).json({ ok: true, lead: updated || saved });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[api/leads]", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
