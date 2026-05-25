// Right-side panel: the Ezra360 "New Record: Burial" form. Field names and
// layout are taken from the reference screenshots — Summary / Burial Details
// / Quote Information / Related Trips / Invoices / Related Documents / Audit
// History. Values are pulled from the shared demo state.

import { useState } from "react";
import { useDemo } from "./state.jsx";
import { C } from "../components/tokens.js";
import { MODULES } from "./data.js";

const TABS = [
  "Summary", "Burial Details", "Quote Information",
  "Related Trips", "Invoices", "Related Documents", "Audit History",
];

const HEADER_TEAL = "#219CD6";
const FIELD_BG = "#fafafa";
const PANEL_BG = "#fafafa";
const HAIRLINE = "#e1dfdd";

export function BurialRecord() {
  const [tab, setTab] = useState("Summary");
  const { claim, awaitingEmailBadge } = useDemo();

  return (
    <div style={{
      flex: 1, minWidth: 0, background: "#f3f3f3",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <RecordHeader claim={claim} awaitingEmailBadge={awaitingEmailBadge} />
      <RecordTabs tab={tab} onTab={setTab} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 32px 24px" }}>
        {tab === "Summary"           && <SummaryTab claim={claim} />}
        {tab === "Burial Details"    && <BurialDetailsTab claim={claim} />}
        {tab === "Quote Information" && <QuoteTab claim={claim} />}
        {tab === "Related Trips"     && <RelatedTripsTab claim={claim} />}
        {tab === "Invoices"          && <InvoicesTab claim={claim} />}
        {tab === "Related Documents" && <RelatedDocsTab claim={claim} />}
        {tab === "Audit History"     && <AuditTab claim={claim} />}
      </div>
    </div>
  );
}

// ─── Record header (title + Save / Save & Close / X) ──────────────────────────
function RecordHeader({ claim, awaitingEmailBadge }) {
  return (
    <div style={{ background: "#fff", padding: "14px 24px 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#2a2a2a" }}>
          New Record: Burial
        </div>
        {claim.recordId && (
          <div style={{ fontSize: 12, color: "#666" }}>{claim.recordId}</div>
        )}
        <div style={{ marginLeft: "auto" }}/>
        <StageBadge stage={claim.stage} />
        {awaitingEmailBadge && (
          <span style={{
            background: "#fff4ce", color: "#7a5700",
            fontSize: 10, fontWeight: 700, padding: "3px 10px",
            borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>Awaiting email</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button style={topBtn("#2a2a2a")}>Save</button>
        <button style={topBtn("#2a2a2a")}>Save &amp; Close</button>
        <div style={{ flex: 1 }}/>
        <button style={{ ...topBtn("#a4262c"), width: 32 }}>X</button>
      </div>
    </div>
  );
}

function topBtn(bg) {
  return {
    background: bg, color: "#fff", border: "none",
    fontSize: 12, fontWeight: 600, padding: "6px 16px",
    cursor: "pointer", borderRadius: 0,
  };
}

function StageBadge({ stage }) {
  const map = {
    New:         { bg: "#f3f3f3", fg: "#605e5c" },
    Received:    { bg: "#deecf9", fg: "#005a9e" },
    Confirmed:   { bg: "#cce4f6", fg: "#0078d4" },
    "In Progress": { bg: "#fff4ce", fg: "#7a5700" },
    Completed:   { bg: "#dff6dd", fg: "#107c10" },
  };
  const s = map[stage] || map.New;
  return (
    <span style={{
      background: s.bg, color: s.fg,
      fontSize: 11, fontWeight: 700, padding: "4px 12px",
      borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px",
    }}>{stage}</span>
  );
}

// ─── Record-level tabs ────────────────────────────────────────────────────────
function RecordTabs({ tab, onTab }) {
  return (
    <div style={{
      background: "#f3f3f3", padding: "0 24px",
      borderBottom: `1px solid ${HAIRLINE}`,
      display: "flex", gap: 18,
    }}>
      {TABS.map(t => {
        const active = t === tab;
        return (
          <button key={t} onClick={() => onTab(t)} style={{
            background: "transparent", border: "none",
            padding: "10px 0 8px 0",
            fontSize: 13, color: active ? HEADER_TEAL : "#444",
            fontWeight: active ? 600 : 400,
            borderBottom: active ? `2px solid ${HEADER_TEAL}` : "2px solid transparent",
            cursor: "pointer", fontFamily: "inherit",
          }}>{t}</button>
        );
      })}
    </div>
  );
}

// ─── Panel + Field ────────────────────────────────────────────────────────────
function Panel({ title, children }) {
  return (
    <div style={{
      background: PANEL_BG, border: `1px solid ${HAIRLINE}`,
      borderRadius: 2, marginBottom: 16,
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${HAIRLINE}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#f7f6f4",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: HEADER_TEAL }}>{title}</div>
        <span style={{ color: "#999", fontSize: 12 }}>▲</span>
      </div>
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, required, muted, placeholder }) {
  const v = value === 0 ? "0.00" : (value ?? "");
  const empty = !v;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "150px 1fr", alignItems: "center",
      gap: 12, marginBottom: 10,
    }}>
      <div style={{ fontSize: 12, color: "#444" }}>
        {label} {required && <span style={{ color: "#a4262c" }}>*</span>}
      </div>
      <div style={{
        background: muted ? "#ececec" : "#fff",
        border: `1px solid ${HAIRLINE}`,
        padding: "6px 10px", fontSize: 12, color: empty ? "#a19f9d" : "#201f1e",
        minHeight: 28, display: "flex", alignItems: "center",
        transition: "background 0.4s",
      }}
      className={!empty ? "field-pop" : ""}>
        {empty ? (placeholder || label) : v}
      </div>
    </div>
  );
}

const ZAR = (n) => n ? `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "0.00";

// ─── Summary tab ──────────────────────────────────────────────────────────────
function SummaryTab({ claim }) {
  const { informant, burialSummary, createdOn, createdBy } = claim;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Informant Details">
          <Field label="Name" value={informant.name} />
          <Field label="Client" value={informant.client} />
          <Field label="First Name" value={informant.firstName} />
          <Field label="Last Name" value={informant.lastName} />
          <Field label="Contact Number" value={informant.contactNumber} />
          <Field label="Email Address" value={informant.email} />
          <Field label="Alternative Number" value={informant.altNumber} />
          <Field label="Branch" value={informant.branch} muted />
        </Panel>

        <Panel title="Burial Summary">
          <Field label="Stage" value={claim.stage} />
          <Field label="Deceased" value={burialSummary.deceased} muted />
          <Field label="Relation" value={burialSummary.cover} />
          <Field label="Cover Amount" value={burialSummary.coverAmount ? `R ${burialSummary.coverAmount.toLocaleString("en-ZA")}` : ""} />
          <Field label="PickUp" value={burialSummary.pickup} muted />
          <Field label="Burial Reference" value={burialSummary.burialReference} />
          <Field label="Burial Fund Type" value={burialSummary.burialFundType} required />
          <Field label="Policy Number(s)" value={burialSummary.policyNumber} />
        </Panel>
      </div>

      <Panel title="Additional Info">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <Field label="Created On" value={createdOn} muted />
          <Field label="Created By" value={createdBy} muted />
        </div>
      </Panel>
    </>
  );
}

// ─── Burial Details tab ───────────────────────────────────────────────────────
function BurialDetailsTab({ claim }) {
  const d = claim.burialDetails;
  return (
    <Panel title="Burial Details">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <Field label="Burial Status" value={d.burialStatus} placeholder="Choose option" />
          <Field label="Burial Date" value={d.burialDate} />
          <Field label="Postmortem" value={d.postmortem} placeholder="Choose option" />
          <Field label="Burial Type" value={d.burialType} placeholder="Choose option" />
          <Field label="Place Of Delivery" value={d.placeOfDelivery} />
          <Field label="Place Of Service" value={d.placeOfService} />
          <Field label="Place Of Burial" value={d.placeOfBurial} />
          <Field label="Mortuary Departure Time" value={d.mortuaryDepartureTime} />
          <Field label="Service Time" value={d.serviceTime} />
          <Field label="Grave Number" value={d.graveNumber} />
          <Field label="Is There Viewing" value={d.isThereViewing} placeholder="Choose option" />
          <Field label="Viewing Venue" value={d.viewingVenue} />
          <Field label="Viewing Date" value={d.viewingDate} />
        </div>
        <div>
          <Field label="Burial Package" value={d.burialPackage} />
          <Field label="Scheme Package" value={d.schemePackage} />
          <Field label="Package Coffin" value={d.packageCoffin} />
          <Field label="Upgrade Coffin" value={d.upgradeCoffin} />
          <Field label="Program By TM" value={d.programByTm} placeholder="Choose option" />
          <Field label="Grave Marker" value={d.graveMarker} placeholder="Choose option" />
          <Field label="Tombstone" value={d.tombstone} placeholder="Choose option" />
          <Field label="Tombstone Order#" value={d.tombstoneOrder} />
          <Field label="Notes" value={d.notes} placeholder="Notes" />
          <Field label="Captured By" value={claim.createdBy} muted />
          <Field label="Created On" value={claim.createdOn} muted />
          <Field label="Button Clicked" value="" />
          <Field label="Owner" value={claim.createdBy} />
        </div>
      </div>
    </Panel>
  );
}

// ─── Quote Information tab (the differentiator) ───────────────────────────────
function QuoteTab({ claim }) {
  const q = claim.quote, p = claim.payment;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Quote Information">
          <Field label="Package Price" value={ZAR(q.package)} muted />
          <Field label="Total Additional Extras" value={ZAR(q.extras)} muted />
          <Field label="Total For Burial Services" value={ZAR(q.services)} muted />
          <Field label="Amount Of Upgrade" value={ZAR(q.upgrade)} muted />
          <Field label="Discount Percentage" value={q.discountPct ? `${q.discountPct}%` : ""} placeholder="Discount Percentage" />
          <Field label="Discount Status" value={q.discountStatus} placeholder="Choose option" />
          <Field label="Quote" value={ZAR(q.quote)} muted />
          <Field label="Total Payable By Client" value={ZAR(q.totalPayable)} muted />
          <Field label="Sales Order" value={q.salesOrder} />
        </Panel>

        <Panel title="Payment Details">
          <Field label="Scheme Application Approved" value={p.schemeApproved} placeholder="Choose option" />
          <Field label="Amount Due By Scheme" value={ZAR(p.amountDueByScheme)} muted />
          <Field label="Amount Outstanding" value={ZAR(p.amountOutstanding)} muted />
          <Field label="Credit Value" value={ZAR(p.creditValue)} muted />
          <Field label="Amount Paid" value={ZAR(p.amountPaid)} muted />
          <Field label="Payment Status" value={p.paymentStatus} placeholder="Choose option" />
          <Field label="Date Paid" value={p.datePaid} />
          <Field label="Invoice" value={p.invoice} />
        </Panel>
      </div>

      <Panel title="Additional Details">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <Field label="Currency" value="ZAR" muted />
          <Field label="Business Unit" value="Burial Services" />
        </div>
      </Panel>
    </>
  );
}

// ─── Related Trips ────────────────────────────────────────────────────────────
function RelatedTripsTab({ claim }) {
  const has = claim.modulesTouched.includes("trips");
  const rows = has ? [
    { id: "T-001", type: "Hearse",            from: "City Mortuary", to: "Mt. Hope Chapel",         when: claim.burialDetails.mortuaryDepartureTime || "08:30" },
    { id: "T-002", type: "Family transport",  from: "Residence",     to: "Mt. Hope Chapel",         when: "09:00" },
    { id: "T-003", type: "Procession",        from: "Mt. Hope Chapel", to: "Mt. Hope Memorial Park", when: "11:15" },
  ] : [];
  return (
    <Panel title="Related Trips">
      <TableSlim cols={["#", "Type", "From", "To", "Time"]}
                 rows={rows.map(r => [r.id, r.type, r.from, r.to, r.when])}
                 empty="No trips related yet." />
    </Panel>
  );
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
function InvoicesTab({ claim }) {
  const p = claim.payment;
  const rows = p.invoice ? [[p.invoice, claim.burialSummary.deceased || "—", claim.createdOn, ZAR(claim.quote.totalPayable), p.paymentStatus]] : [];
  return (
    <Panel title="Invoices">
      <TableSlim cols={["Invoice", "Client", "Issued", "Amount", "Status"]}
                 rows={rows} empty="No invoices issued yet." />
    </Panel>
  );
}

// ─── Related Documents ────────────────────────────────────────────────────────
function RelatedDocsTab({ claim }) {
  const done = claim.stage === "Completed";
  const docs = done ? [
    ["Burial Pack",     "PDF", claim.createdOn],
    ["Death Notice",    "PDF", claim.createdOn],
    ["Scheme Approval", "PDF", claim.createdOn],
    ["Invoice " + claim.payment.invoice, "PDF", claim.createdOn],
  ] : [];
  return (
    <Panel title="Related Documents">
      <TableSlim cols={["Document", "Type", "Generated"]} rows={docs}
                 empty="Documents are generated once the burial completes." />
    </Panel>
  );
}

// ─── Audit History ────────────────────────────────────────────────────────────
function AuditTab({ claim }) {
  return (
    <Panel title="Audit History">
      <TableSlim cols={["Time", "Event"]}
                 rows={claim.audit.map(a => [a.t, a.label])}
                 empty="No audit events yet." />
    </Panel>
  );
}

// ─── Slim table primitive ─────────────────────────────────────────────────────
function TableSlim({ cols, rows, empty }) {
  if (!rows || rows.length === 0) {
    return <div style={{ color: "#888", fontSize: 12, padding: "8px 0" }}>{empty}</div>;
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>
          {cols.map(c => (
            <th key={c} style={{
              textAlign: "left", padding: "8px 10px", color: "#605e5c",
              fontWeight: 600, borderBottom: `1px solid ${HAIRLINE}`,
              fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px",
            }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="fade-up">
            {r.map((cell, j) => (
              <td key={j} style={{
                padding: "8px 10px", color: "#201f1e",
                borderBottom: `1px solid ${HAIRLINE}`,
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Exported so MIB.jsx can wire the sub-nav highlight to which modules have
// been touched.
export { MODULES };
