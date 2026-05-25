// Thin client for the Daystar CRM (Frappe). Used by the WhatsApp demo to log
// a CRM Lead after the visitor finishes the booth flow.
//
// Configure via Vite env vars in `.env.local`:
//   VITE_CRM_BASE_URL=https://crm.thedaystar.co.za
//   VITE_CRM_API_KEY=xxx
//   VITE_CRM_API_SECRET=yyy
//   VITE_CRM_CAMPAIGN=SAFPA            (optional, defaults to "SAFPA")
//   VITE_CRM_LEAD_DOCTYPE=CRM Lead     (optional, defaults to "CRM Lead")

const BASE      = import.meta.env.VITE_CRM_BASE_URL || "https://crm.thedaystar.co.za";
const API_KEY   = import.meta.env.VITE_CRM_API_KEY;
const API_SEC   = import.meta.env.VITE_CRM_API_SECRET;
const CAMPAIGN  = import.meta.env.VITE_CRM_CAMPAIGN || "SAFPA";
const DOCTYPE   = import.meta.env.VITE_CRM_LEAD_DOCTYPE || "CRM Lead";

export const crmConfigured = () => Boolean(API_KEY && API_SEC);

export async function createLead({ name, mobile, email }) {
  if (!crmConfigured()) {
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
      return { ok: false, status: res.status, error: body.slice(0, 500) };
    }
    const data = await res.json();
    return { ok: true, name: data?.data?.name, data };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}
