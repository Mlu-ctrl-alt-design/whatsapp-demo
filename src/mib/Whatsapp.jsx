// Left-side phone-frame WhatsApp simulator. Reads + writes the shared demo
// state. Renders a phone shell, conversation, and the visitor's input.

import { useState, useEffect, useRef } from "react";
import { useDemo } from "./state.jsx";

const WA_GREEN_HEADER = "#075e54";
const WA_GREEN_BUBBLE = "#dcf8c6";
const WA_BG = "#ece5dd";
const WA_BG_TILE = "linear-gradient(135deg, #ece5dd 0%, #d9d2c8 100%)";

export function Whatsapp() {
  const { chat, submit, reset, phase, typing } = useDemo();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.length, typing]);

  const send = () => {
    if (!draft.trim()) return;
    submit(draft);
    setDraft("");
  };

  // Quick-reply chips depending on phase
  const quickReplies = (() => {
    if (phase === "IDLE") return ["DEMO"];
    if (phase === "ASK_AUDIENCE") return ["1", "2", "3", "4"];
    if (phase === "ASK_RELATION") return ["1", "2", "3", "4"];
    if (phase === "ASK_OTHER_SCHEME") return ["Yes", "No"];
    if (phase === "ASK_TRANSFER_OUT") return ["Yes", "No"];
    if (phase === "ASK_REPORT") return ["REPORT"];
    if (phase === "AWAIT_CONFIRM") return ["CONFIRM", "CHANGE"];
    if (phase === "AWAIT_PACKAGE") return ["1", "2", "3"];
    return [];
  })();

  return (
    <div style={{
      width: 340, height: 680, background: "#000", borderRadius: 36,
      padding: 8, boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
      position: "relative",
    }}>
      {/* speaker notch */}
      <div style={{
        position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
        width: 80, height: 6, background: "#1a1a1a", borderRadius: 4,
      }}/>
      <div style={{
        height: "100%", width: "100%", borderRadius: 28, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          background: WA_GREEN_HEADER, color: "#fff",
          padding: "32px 14px 10px 14px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#25d366", display: "grid", placeItems: "center",
            fontSize: 14, fontWeight: 700,
          }}>E</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ezra360 Burials</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>online · typically replies instantly</div>
          </div>
          <button
            onClick={reset}
            title="Reset the demo"
            style={{
              background: "rgba(255,255,255,0.16)", border: "none", color: "#fff",
              fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 4,
              cursor: "pointer",
            }}>RESET</button>
        </div>

        {/* Chat scroll */}
        <div ref={scrollRef} style={{
          flex: 1, background: WA_BG, backgroundImage: WA_BG_TILE,
          padding: 14, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {chat.map((m, i) => (
            <Bubble key={i} from={m.from} text={m.text} t={m.t} />
          ))}
          {typing && <TypingBubble/>}
        </div>

        {/* Quick replies */}
        {quickReplies.length > 0 && (
          <div style={{
            background: "#f6f6f6", padding: "6px 8px",
            display: "flex", gap: 6, flexWrap: "wrap",
            borderTop: "1px solid #e0e0e0",
          }}>
            {quickReplies.map(q => (
              <button key={q} onClick={() => submit(q)} style={{
                background: "#fff", border: "1px solid #25d366",
                color: "#075e54", borderRadius: 100, padding: "4px 12px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          background: "#f0f0f0", padding: 8,
          display: "flex", gap: 6, alignItems: "center",
        }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            placeholder="Type a message"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 20,
              border: "none", background: "#fff", fontSize: 13,
            }}
          />
          <button onClick={send} style={{
            width: 40, height: 40, borderRadius: "50%", border: "none",
            background: "#25d366", color: "#fff", fontSize: 18,
            cursor: "pointer", display: "grid", placeItems: "center",
          }}>➤</button>
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{
      alignSelf: "flex-start", maxWidth: "82%",
      background: "#fff", borderRadius: 8, padding: "8px 12px",
      boxShadow: "0 1px 0.5px rgba(0,0,0,0.08)",
      display: "inline-flex", alignItems: "center", gap: 4,
    }} className="fade-up">
      <Dot delay="0s"/>
      <Dot delay="0.15s"/>
      <Dot delay="0.3s"/>
      <style>{`
        @keyframes wa-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%           { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: "50%", background: "#7d8186",
      display: "inline-block",
      animation: `wa-typing 1s ease-in-out ${delay} infinite`,
    }}/>
  );
}

function Bubble({ from, text, t }) {
  const mine = from === "user";
  return (
    <div style={{
      alignSelf: mine ? "flex-end" : "flex-start",
      maxWidth: "82%",
      background: mine ? WA_GREEN_BUBBLE : "#fff",
      borderRadius: 8, padding: "6px 10px 4px 10px",
      fontSize: 13, lineHeight: 1.35, color: "#111",
      boxShadow: "0 1px 0.5px rgba(0,0,0,0.08)",
      whiteSpace: "pre-wrap",
    }} className="fade-up">
      {text}
      <div style={{ fontSize: 9, color: "#7d8186", textAlign: "right", marginTop: 2 }}>
        {t}
      </div>
    </div>
  );
}
