// Dashboard view — sits to the right of the phone frame when "Dashboard" is
// the active module. Surfaces the three things a funeral business cares
// about: spend per burial, coffin stock on hand, and where the fleet is.
//
// This is the screen the funeral-business visitor sees after the demo
// completes — it's what justifies the "we show you what each burial costs
// you" claim from the PRD.

import { useDemo } from "./state.jsx";
import {
  COFFIN_INVENTORY, FLEET, SPEND_BY_CATEGORY, KPI, TRANSFERS,
} from "./data.js";

const TEAL = "#219CD6";
const HAIRLINE = "#e1dfdd";
const PANEL_BG = "#fafafa";

const ZAR = (n) => "R " + Number(n).toLocaleString("en-ZA", { maximumFractionDigits: 0 });
const ZAR_K = (n) => "R " + Math.round(n / 1000).toLocaleString("en-ZA") + "k";

export function Dashboard() {
  const { claim } = useDemo();
  // If a burial is in flight, factor it into the live tally for one beat of
  // realism — the dashboard's "Burials This Month" climbs by 1 once the
  // current claim hits Completed.
  const liveBurials = KPI.burialsThisMonth + (claim.stage === "Completed" ? 1 : 0);
  const liveSpend   = KPI.totalSpend + (claim.quote.totalPayable || 0);
  const liveTransfers = KPI.transfersOut + (claim.burialSummary?.transferOut === "Yes" ? 1 : 0);

  return (
    <div style={{
      flex: 1, minWidth: 0, background: "#f3f3f3",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <DashHeader claim={claim}/>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 32px 24px" }}>
        <PositioningBanner burials={liveBurials}/>
        <KpiRow burials={liveBurials} spend={liveSpend} transfers={liveTransfers}/>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          <SpendByCategoryPanel/>
          <FleetPanel/>
        </div>

        <TransfersPanel claim={claim}/>
        <CoffinInventoryPanel/>
        <ActivityPanel claim={claim}/>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function DashHeader({ claim }) {
  return (
    <div style={{
      background: "#fff", padding: "14px 24px 12px 24px",
      borderBottom: `1px solid ${HAIRLINE}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#2a2a2a" }}>
          Dashboard
        </div>
        <div style={{ fontSize: 12, color: "#666" }}>
          This month
        </div>
        <div style={{ marginLeft: "auto" }}/>
        {claim.stage === "Completed" && (
          <span style={{
            background: "#dff6dd", color: "#107c10",
            fontSize: 10, fontWeight: 700, padding: "3px 10px",
            borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>+1 burial added · {claim.recordId}</span>
        )}
      </div>
    </div>
  );
}

// ─── Positioning banner ───────────────────────────────────────────────────────
// Frames the dashboard as the cumulative view a funeral business sees over
// time — not the result of the single demo burial just logged.
function PositioningBanner({ burials }) {
  return (
    <div className="fade-up" style={{
      background: "linear-gradient(90deg, #f1f8fd 0%, #e8f4fc 100%)",
      border: `1px solid #cde7f7`,
      padding: "12px 16px", borderRadius: 2, marginBottom: 16,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", background: "#fff",
        border: `1px solid ${TEAL}`, color: TEAL,
        display: "grid", placeItems: "center", flexShrink: 0,
        fontSize: 16,
      }}>📈</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#201f1e", marginBottom: 2 }}>
          This is what your funeral home would see — after every burial, in one place.
        </div>
        <div style={{ fontSize: 12, color: "#605e5c" }}>
          Built from {burials} burials over the last month. Every cost, every vehicle, every coffin — visible, not buried in spreadsheets.
        </div>
      </div>
    </div>
  );
}

// ─── KPI row ──────────────────────────────────────────────────────────────────
function KpiRow({ burials, spend, transfers }) {
  const avg = burials ? Math.round(spend / burials) : 0;
  const cards = [
    { label: "Burials this month", value: burials,          sub: "Across all schemes" },
    { label: "Transfers out",      value: transfers,        sub: "To other schemes" },
    { label: "Total spend",        value: ZAR(spend),       sub: "All cost lines" },
    { label: "Average per burial", value: ZAR(avg),         sub: "Spend ÷ count" },
    { label: "Average margin",     value: KPI.avgMarginPct + "%", sub: "Cover minus spend" },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12,
      marginBottom: 16,
    }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: "#fff", border: `1px solid ${HAIRLINE}`,
          padding: "14px 16px", borderRadius: 2,
        }}>
          <div style={{ fontSize: 11, color: "#605e5c", fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.5px",
                        marginBottom: 6 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: TEAL, lineHeight: 1 }}>
            {c.value}
          </div>
          <div style={{ fontSize: 11, color: "#a19f9d", marginTop: 6 }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Spend by category (the headline panel) ───────────────────────────────────
function SpendByCategoryPanel() {
  const max = Math.max(...SPEND_BY_CATEGORY.map(c => c.amount));
  return (
    <Panel title="Spend by category">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SPEND_BY_CATEGORY.map(c => {
          const pct = (c.amount / max) * 100;
          return (
            <div key={c.name} style={{
              display: "grid", gridTemplateColumns: "150px 1fr 90px",
              gap: 10, alignItems: "center", fontSize: 12,
            }}>
              <div style={{ color: "#3b3a39" }}>{c.name}</div>
              <div style={{
                background: "#f3f2f1", height: 16, borderRadius: 2,
                overflow: "hidden",
              }}>
                <div style={{
                  background: TEAL, height: "100%", width: `${pct}%`,
                  transition: "width 0.4s",
                }}/>
              </div>
              <div style={{ color: "#201f1e", fontWeight: 600, textAlign: "right" }}>
                {ZAR_K(c.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ─── Fleet panel ──────────────────────────────────────────────────────────────
function FleetPanel() {
  return (
    <Panel title="Fleet status">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Vehicle", "Type", "Status", "Next"].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FLEET.map(v => (
            <tr key={v.id}>
              <td style={td}><b>{v.id}</b></td>
              <td style={td}>{v.type}</td>
              <td style={td}><FleetPill status={v.status}/></td>
              <td style={{ ...td, color: "#605e5c" }}>{v.nextTrip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function FleetPill({ status }) {
  const map = {
    "Available":   { bg: "#dff6dd", fg: "#107c10" },
    "On Trip":     { bg: "#deecf9", fg: "#005a9e" },
    "Maintenance": { bg: "#fde7e9", fg: "#a4262c" },
  };
  const s = map[status] || { bg: "#f3f3f3", fg: "#605e5c" };
  return (
    <span style={{
      background: s.bg, color: s.fg,
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px",
    }}>{status}</span>
  );
}

// ─── Coffin inventory ─────────────────────────────────────────────────────────
function CoffinInventoryPanel() {
  return (
    <Panel title="Coffin inventory">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Coffin", "Package", "In stock", "Min", "Status"].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COFFIN_INVENTORY.map(c => {
            const low = c.stock <= c.min;
            return (
              <tr key={c.name}>
                <td style={td}><b>{c.name}</b></td>
                <td style={td}>{c.type}</td>
                <td style={{ ...td, fontWeight: 600 }}>{c.stock}</td>
                <td style={{ ...td, color: "#605e5c" }}>{c.min}</td>
                <td style={td}>
                  <span style={{
                    background: low ? "#fde7e9" : "#dff6dd",
                    color:      low ? "#a4262c" : "#107c10",
                    fontSize: 10, fontWeight: 700, padding: "2px 8px",
                    borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>{low ? "Reorder" : "OK"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

// ─── Transfers panel ──────────────────────────────────────────────────────────
function TransfersPanel({ claim }) {
  const rows = [...TRANSFERS];
  if (claim.burialSummary?.transferOut === "Yes" && claim.stage !== "New") {
    rows.push({
      id: `TRF-${Math.floor(100 + Math.random() * 900)}`,
      deceased: claim.burialSummary.deceased || "Current claim",
      fromScheme: "Other scheme (pending)",
      status: "Pending",
      date: new Date().toLocaleDateString("en-GB"),
    });
  }
  return (
    <Panel title="Transfer-out requests">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Reference", "Deceased", "From scheme", "Status", "Date"].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={td}><b>{r.id}</b></td>
              <td style={td}>{r.deceased}</td>
              <td style={td}>{r.fromScheme}</td>
              <td style={td}><TransferPill status={r.status}/></td>
              <td style={{ ...td, color: "#605e5c" }}>{r.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function TransferPill({ status }) {
  const map = {
    "Completed":   { bg: "#dff6dd", fg: "#107c10" },
    "In Progress": { bg: "#deecf9", fg: "#005a9e" },
    "Pending":     { bg: "#fff4ce", fg: "#797673" },
  };
  const s = map[status] || { bg: "#f3f3f3", fg: "#605e5c" };
  return (
    <span style={{
      background: s.bg, color: s.fg,
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px",
    }}>{status}</span>
  );
}

// ─── Live activity (from the audit trail) ─────────────────────────────────────
function ActivityPanel({ claim }) {
  if (!claim.audit.length) return null;
  return (
    <Panel title="Live activity">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {claim.audit.slice(0, 8).map((a, i) => (
          <div key={i} className="fade-up" style={{
            display: "grid", gridTemplateColumns: "70px 1fr",
            gap: 12, fontSize: 12,
            paddingBottom: 6,
            borderBottom: i === Math.min(7, claim.audit.length-1) ? "none" : `1px solid ${HAIRLINE}`,
          }}>
            <div style={{ color: "#a19f9d" }}>{a.t}</div>
            <div style={{ color: "#201f1e" }}>{a.label}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Panel + table styles ─────────────────────────────────────────────────────
function Panel({ title, children }) {
  return (
    <div style={{
      background: PANEL_BG, border: `1px solid ${HAIRLINE}`,
      borderRadius: 2, marginBottom: 16,
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${HAIRLINE}`,
        background: "#f7f6f4",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL }}>{title}</div>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

const th = {
  textAlign: "left", padding: "8px 10px", color: "#605e5c",
  fontWeight: 600, borderBottom: `1px solid ${HAIRLINE}`,
  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px",
};
const td = {
  padding: "8px 10px", color: "#201f1e",
  borderBottom: `1px solid ${HAIRLINE}`,
};
