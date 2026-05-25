// Transition screen — shown for ~3.5s after the WhatsApp flow completes
// (i.e. once the visitor has given their email). Replaces the burial record
// on the right pane, then yields to the Dashboard.
//
// Purpose: give the demo a defined "close" beat before pivoting to the
// funeral-business view. Without this, the dashboard appears mid-celebration
// and the moment is lost.

import { useDemo } from "./state.jsx";

const TEAL = "#219CD6";
const GREEN = "#107c10";

export function Transition() {
  const { claim } = useDemo();
  const total = claim.quote.totalPayable;
  return (
    <div style={{
      flex: 1, minWidth: 0, background: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", padding: 40, overflow: "hidden",
    }}>
      <div style={{
        position: "relative",
        width: 120, height: 120, borderRadius: "50%",
        background: "#dff6dd",
        display: "grid", placeItems: "center",
        marginBottom: 28,
      }} className="check-pop">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5"
                stroke={GREEN} strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                className="check-stroke"/>
        </svg>
        <RippleRing/>
      </div>

      <div style={{
        fontSize: 28, fontWeight: 700, color: "#201f1e", marginBottom: 8,
        textAlign: "center",
      }} className="fade-up">
        Claim successfully logged
      </div>

      <div style={{
        fontSize: 14, color: "#605e5c", marginBottom: 28, textAlign: "center",
        maxWidth: 420, lineHeight: 1.5,
      }} className="fade-up">
        Your records are saved. The summary is on its way to{" "}
        <b style={{ color: "#201f1e" }}>{claim.informant.email || "your email"}</b>.
      </div>

      <div style={{
        background: "#fafafa", border: "1px solid #e1dfdd",
        padding: "16px 24px", borderRadius: 4, minWidth: 360,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
      }} className="fade-up">
        <Row label="Burial reference" value={claim.recordId}/>
        <Row label="Deceased"         value={claim.burialSummary.deceased}/>
        <Row label="Package"          value={claim.burialDetails.burialPackage}/>
        <Row label="Total"            value={total ? `R ${total.toLocaleString("en-ZA")}` : "—"}/>
      </div>

      <div style={{
        marginTop: 36, fontSize: 12, color: "#a19f9d",
        display: "flex", alignItems: "center", gap: 8,
      }} className="fade-up">
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: TEAL,
          animation: "pulse2 1.4s infinite",
        }}/>
        Loading your business view…
      </div>

      <style>{`
        @keyframes checkPop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .check-pop { animation: checkPop 0.5s cubic-bezier(.2,.7,.3,1.4) both; }

        @keyframes drawCheck {
          from { stroke-dasharray: 40; stroke-dashoffset: 40; }
          to   { stroke-dasharray: 40; stroke-dashoffset: 0;  }
        }
        .check-stroke {
          stroke-dasharray: 40; stroke-dashoffset: 40;
          animation: drawCheck 0.45s 0.35s ease forwards;
        }

        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.45; }
          100% { transform: scale(1.9); opacity: 0;    }
        }
        .ripple { animation: ripple 1.6s ease-out infinite; }
      `}</style>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <div style={{
        fontSize: 10, color: "#a19f9d", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4,
      }}>{label}</div>
      <div style={{ fontSize: 13, color: "#201f1e", fontWeight: 600 }}>
        {value || "—"}
      </div>
    </div>
  );
}

function RippleRing() {
  return (
    <span className="ripple" style={{
      position: "absolute", inset: 0, borderRadius: "50%",
      border: `2px solid ${GREEN}`,
    }}/>
  );
}
