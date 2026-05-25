// MIB (Ezra360) — booth demo shell. Renders the Ezra360 chrome from the
// reference screenshots, with a phone-frame WhatsApp simulator on the left
// and either the live burial record OR the spend dashboard on the right.
// Both sides read from one shared DemoProvider so they never drift.

import { useState, useEffect } from "react";
import { GlobalStyles } from "../components/globalStyles.jsx";
import { DemoProvider, useDemo } from "./state.jsx";
import { Whatsapp } from "./Whatsapp.jsx";
import { BurialRecord } from "./BurialRecord.jsx";
import { Dashboard } from "./Dashboard.jsx";
import { Transition } from "./Transition.jsx";
import { MODULES } from "./data.js";
import {
  getQueuedLeads, clearQueuedLeads, removeQueuedLead, exportQueuedLeadsCsv,
} from "./crm.js";

const TEAL = "#219CD6";

export default function MIB() {
  return (
    <DemoProvider>
      <GlobalStyles/>
      <ExtraStyles/>
      <MIBChrome/>
    </DemoProvider>
  );
}

// ─── Chrome (inside DemoProvider so it can read claim state) ──────────────────
function MIBChrome() {
  const { phase } = useDemo();
  const [active, setActive] = useState("burials");
  const isMobile = useIsMobile();

  // After the WhatsApp flow closes (email captured), show the transition
  // screen for a beat, then pivot to the Dashboard — the funeral-business
  // view of what their burials have cost.
  useEffect(() => {
    if (phase === "CLOSED") {
      const t1 = setTimeout(() => setActive("transition"), 600);
      const t2 = setTimeout(() => setActive("dashboard"), 4200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase]);

  // On mobile, drop the Ezra360 chrome entirely — just show the WhatsApp
  // pane full-screen, and overlay the confirmation when the flow closes.
  if (isMobile) {
    return (
      <div style={{
        height: "100dvh", width: "100vw", overflow: "hidden",
        fontFamily: "'Segoe UI',system-ui,sans-serif", background: "#000",
      }}>
        <Whatsapp fullscreen/>
        {phase === "CLOSED" && <MobileConfirmation/>}
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh", width: "100vw", display: "flex", flexDirection: "column",
      background: "#f3f3f3", fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <BrandBar/>
      <ModuleSubnav active={active} onSelect={setActive}/>
      <BoothLayout active={active}/>
      <StatusBar/>
    </div>
  );
}

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint}px)`;
  const [match, setMatch] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatch(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return match;
}

function MobileConfirmation() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "stretch", justifyContent: "center",
      zIndex: 2000, padding: 12,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, overflow: "auto",
        width: "100%", maxWidth: 520, alignSelf: "stretch",
        display: "flex", flexDirection: "column",
      }}>
        <Transition/>
      </div>
    </div>
  );
}

// ─── Brand bar (teal) ─────────────────────────────────────────────────────────
function BrandBar() {
  return (
    <div style={{
      background: TEAL, color: "#fff", height: 44,
      display: "flex", alignItems: "center", padding: "0 14px", gap: 14,
      flexShrink: 0,
    }}>
      <EzraLogo height={26}/>
      <div style={{
        background: "rgba(255,255,255,0.18)", padding: "3px 10px", borderRadius: 2,
        fontSize: 11, fontWeight: 700, letterSpacing: "1px",
      }}>MIB</div>
      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.3)" }}/>
      <button style={iconBtn}>☰</button>
      <button style={{ ...iconBtn, fontSize: 13, fontWeight: 500, padding: "0 8px", width: "auto", gap: 4 }}>
        Burial Services <span style={{ fontSize: 10 }}>▾</span>
      </button>

      <div style={{ flex: 1 }}/>

      <button style={{
        ...iconBtn, width: 26, height: 26, fontSize: 16,
        border: "1px solid rgba(255,255,255,0.6)", borderRadius: "50%",
      }}>+</button>

      <div style={{
        background: "rgba(255,255,255,0.16)", borderRadius: 2,
        display: "flex", alignItems: "center", padding: "0 8px",
        width: 240, height: 28,
      }}>
        <input placeholder="Search..." style={{
          flex: 1, background: "transparent", border: "none", color: "#fff",
          fontSize: 12, padding: "0 6px",
        }}/>
        <span style={{ opacity: 0.8 }}>🔍</span>
      </div>

      <button style={{ ...iconBtn, fontSize: 12, fontWeight: 500, padding: "0 8px", width: "auto", gap: 6 }}>
        <span style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", color: TEAL, fontSize: 10,
          display: "grid", placeItems: "center", fontWeight: 700,
        }}>M</span>
        Mlu Manda <span style={{ fontSize: 9 }}>▾</span>
      </button>
    </div>
  );
}

const iconBtn = {
  background: "transparent", border: "none", color: "#fff",
  width: 28, height: 28, fontSize: 14, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontFamily: "inherit",
};

// Ezra logo, inlined so we can recolor every path to white for the teal bar.
function EzraLogo({ height = 24 }) {
  return (
    <svg height={height} viewBox="0 0 232 69" fill="none"
         xmlns="http://www.w3.org/2000/svg"
         style={{ display: "block", flexShrink: 0 }}>
      <path d="M23.6563 37.0755C23.6563 37.7629 22.5705 38.3196 21.2307 38.3196C19.8909 38.3196 18.8051 37.7629 18.8051 37.0755C18.8051 36.3881 19.8909 35.8307 21.2307 35.8307C22.5705 35.8307 23.6563 36.3881 23.6563 37.0755ZM56.1688 42.8516C54.4293 46.8889 51.3038 49.2299 46.9996 49.6771C42.191 50.1767 38.2219 48.2809 35.0331 44.6841C33.6438 43.1172 32.5751 41.3391 31.4948 39.5624C30.0724 37.2235 28.4746 35.0215 26.1996 33.4216C24.0527 31.9118 21.711 31.5581 19.2537 32.5105C15.8998 33.8104 13.8162 37.6233 14.8394 41.3495C15.5323 43.8714 17.9889 46.2936 20.8557 46.6783C23.2703 47.0024 25.3257 46.284 27.1135 44.682C27.8491 44.0242 28.6941 44.0091 29.2866 44.6318C29.9203 45.2993 29.8832 46.1106 29.1317 46.8311C27.1307 48.7502 24.725 49.6916 21.5025 49.7735C20.8983 49.8443 19.8744 49.5904 18.8938 49.2718C16.109 48.3669 14.0033 46.6219 12.6973 43.9685C11.8626 42.2736 11.4036 40.479 11.6135 38.5956C11.9906 35.219 13.5382 32.5009 16.4407 30.6471C18.8725 29.0933 21.5273 28.6783 24.3224 29.3265C26.4591 29.822 28.231 31.0214 29.7848 32.5236C31.5072 34.1875 32.893 36.1273 34.1241 38.1724C35.4432 40.3627 36.7624 42.5399 38.7806 44.1942C41.5111 46.4313 44.5705 47.2763 48.0331 46.4416C51.6217 45.5766 54.463 41.9103 54.0357 37.8091C53.5471 33.114 49.4713 29.7697 44.4989 30.495C42.8192 30.7393 41.4031 31.5437 40.1576 32.675C39.7874 33.0114 39.3986 33.3039 38.8446 33.1883C38.29 33.072 37.8393 32.8016 37.6569 32.2524C37.4587 31.6545 37.5688 31.0847 38.0347 30.6298C39.3263 29.3671 40.8299 28.4395 42.5646 27.9276C43.1103 27.7666 43.1543 27.5519 42.9142 27.0853C41.4898 24.3184 39.2658 22.5458 36.2119 22.009C34.1798 21.6519 32.1471 21.8638 30.2603 22.8761C28.69 23.719 27.4307 24.8654 26.5114 26.3951C25.9251 27.3723 24.7161 27.4824 24.0383 26.6477C23.6309 26.146 23.6329 25.4641 24.0823 24.7395C25.5005 22.4508 27.4582 20.8096 29.9568 19.7864C32.6371 18.6881 35.3772 18.5712 38.0966 19.432C41.9474 20.6507 44.6132 23.2181 46.0713 27.0021C46.1904 27.3117 46.3452 27.4659 46.6824 27.4672C47.8714 27.4727 49 27.781 50.0886 28.2297C52.5968 29.2639 54.5311 30.9822 55.7608 33.3837C57.3311 36.4493 57.5554 39.6346 56.1688 42.8516ZM50.4498 5.14414e-05H18.1995C8.14877 5.14414e-05 0 8.14882 0 18.2003V50.4492C0 60.5006 8.14877 68.6494 18.1995 68.6494H50.4498C60.5006 68.6494 68.6494 60.5006 68.6494 50.4492V18.2003C68.6494 8.14882 60.5006 5.14414e-05 50.4498 5.14414e-05Z" fill="#fff"/>
      <path d="M83.1998 48.8242V19.5386H101.561V23.3423H87.6184V32.2652H100.602V36.0546H87.6184V45.0205H101.732V48.8242H83.1998ZM106.219 48.8242V45.8928L118.116 30.7781V30.5779H106.605V26.86H123.45V29.9773L112.01 44.9061V45.1063H123.85V48.8242H106.219ZM128.452 48.8242V26.86H132.584V30.3491H132.813C133.213 29.167 133.919 28.2375 134.929 27.5607C135.949 26.8743 137.103 26.5311 138.39 26.5311C138.657 26.5311 138.971 26.5406 139.334 26.5597C139.706 26.5788 139.996 26.6026 140.206 26.6312V30.7209C140.034 30.6732 139.729 30.6208 139.291 30.5636C138.852 30.4969 138.414 30.4635 137.975 30.4635C136.965 30.4635 136.064 30.678 135.273 31.107C134.491 31.5264 133.871 32.1127 133.414 32.8658C132.956 33.6094 132.727 34.4579 132.727 35.4112V48.8242H128.452ZM149.658 49.3104C148.267 49.3104 147.008 49.053 145.883 48.5382C144.758 48.0139 143.867 47.256 143.209 46.2646C142.561 45.2731 142.237 44.0577 142.237 42.6182C142.237 41.3789 142.475 40.3588 142.952 39.5581C143.429 38.7573 144.072 38.1233 144.882 37.6562C145.693 37.1891 146.598 36.8364 147.599 36.598C148.6 36.3597 149.62 36.1786 150.659 36.0546C151.975 35.9021 153.043 35.7782 153.862 35.6829C154.682 35.578 155.278 35.4112 155.65 35.1824C156.022 34.9536 156.208 34.5818 156.208 34.067V33.9669C156.208 32.7181 155.855 31.7505 155.149 31.0641C154.454 30.3777 153.414 30.0345 152.032 30.0345C150.593 30.0345 149.458 30.3539 148.629 30.9926C147.809 31.6218 147.242 32.3224 146.927 33.0946L142.909 32.1795C143.386 30.8448 144.082 29.7676 144.997 28.9477C145.921 28.1184 146.984 27.5178 148.186 27.146C149.387 26.7647 150.65 26.574 151.975 26.574C152.852 26.574 153.781 26.6789 154.763 26.8886C155.755 27.0888 156.68 27.4606 157.537 28.004C158.405 28.5473 159.115 29.3243 159.668 30.3348C160.221 31.3358 160.498 32.637 160.498 34.2386V48.8242H156.322V45.8213H156.15C155.874 46.3742 155.459 46.9176 154.906 47.4515C154.353 47.9853 153.643 48.4286 152.776 48.7813C151.908 49.134 150.869 49.3104 149.658 49.3104ZM150.588 45.8785C151.77 45.8785 152.78 45.6449 153.619 45.1778C154.468 44.7107 155.111 44.1006 155.55 43.3475C155.998 42.5848 156.222 41.7697 156.222 40.9022V38.0709C156.069 38.2234 155.774 38.3664 155.335 38.4999C154.906 38.6238 154.415 38.7334 153.862 38.8288C153.31 38.9146 152.771 38.9956 152.247 39.0719C151.722 39.1386 151.284 39.1958 150.931 39.2435C150.102 39.3483 149.344 39.5247 148.657 39.7726C147.981 40.0204 147.437 40.3779 147.027 40.845C146.627 41.3026 146.427 41.9127 146.427 42.6754C146.427 43.7336 146.818 44.5343 147.599 45.0777C148.381 45.6116 149.377 45.8785 150.588 45.8785Z" fill="#fff"/>
      <path d="M173.163 49.4282C172.439 49.4282 171.674 49.3745 170.868 49.2672C170.063 49.1866 169.284 49.0658 168.533 48.9048C167.781 48.7437 167.096 48.5692 166.479 48.3813C165.862 48.1934 165.378 48.0189 165.029 47.8578L166.197 42.8646C166.895 43.1599 167.781 43.482 168.855 43.831C169.955 44.1532 171.311 44.3142 172.922 44.3142C174.774 44.3142 176.13 43.9652 176.989 43.2673C177.848 42.5693 178.277 41.6297 178.277 40.4485C178.277 39.7237 178.116 39.1197 177.794 38.6365C177.499 38.1264 177.083 37.7237 176.546 37.4284C176.009 37.1063 175.365 36.8915 174.613 36.7842C173.888 36.6499 173.11 36.5828 172.278 36.5828H169.942V31.7507H172.6C173.19 31.7507 173.754 31.697 174.291 31.5896C174.855 31.4822 175.351 31.3077 175.781 31.0661C176.21 30.7977 176.546 30.4487 176.788 30.0192C177.056 29.5628 177.19 28.9991 177.19 28.3279C177.19 27.8179 177.083 27.3749 176.868 26.9991C176.653 26.6233 176.371 26.3145 176.022 26.0729C175.7 25.8313 175.311 25.6568 174.855 25.5495C174.425 25.4152 173.982 25.3481 173.526 25.3481C172.372 25.3481 171.298 25.5226 170.304 25.8716C169.338 26.2206 168.452 26.6501 167.647 27.1602L165.513 22.771C165.942 22.5025 166.439 22.2207 167.003 21.9254C167.593 21.6301 168.237 21.3616 168.935 21.12C169.633 20.8784 170.372 20.6771 171.15 20.516C171.955 20.3549 172.801 20.2744 173.687 20.2744C175.325 20.2744 176.734 20.4757 177.915 20.8784C179.123 21.2542 180.116 21.8046 180.895 22.5294C181.673 23.2273 182.251 24.0595 182.626 25.026C183.002 25.9656 183.19 26.9991 183.19 28.1266C183.19 29.2272 182.881 30.3011 182.264 31.348C181.647 32.3681 180.814 33.1466 179.767 33.6835C181.217 34.2741 182.331 35.16 183.11 36.3412C183.915 37.4956 184.318 38.8915 184.318 40.5291C184.318 41.8176 184.103 43.0122 183.673 44.1129C183.244 45.1867 182.573 46.1263 181.66 46.9316C180.747 47.7101 179.579 48.3276 178.157 48.784C176.761 49.2135 175.096 49.4282 173.163 49.4282ZM197.459 35.6969C196.869 35.6969 196.238 35.7506 195.567 35.858C194.896 35.9654 194.372 36.113 193.996 36.3009C193.996 36.4083 193.983 36.5694 193.956 36.7842C193.956 36.9989 193.956 37.1868 193.956 37.3479C193.956 38.3143 194.023 39.2271 194.157 40.0861C194.292 40.9452 194.52 41.6968 194.842 42.3411C195.164 42.9854 195.594 43.4955 196.131 43.8713C196.667 44.2203 197.339 44.3948 198.144 44.3948C198.815 44.3948 199.379 44.2605 199.835 43.9921C200.318 43.6968 200.708 43.3344 201.003 42.9049C201.325 42.4753 201.553 42.0055 201.688 41.4955C201.849 40.9586 201.929 40.4485 201.929 39.9653C201.929 38.5962 201.58 37.5492 200.882 36.8244C200.211 36.0728 199.07 35.6969 197.459 35.6969ZM198.224 31.0259C199.969 31.0259 201.446 31.2675 202.654 31.7507C203.889 32.2071 204.896 32.8379 205.674 33.6433C206.453 34.4486 207.016 35.3882 207.365 36.462C207.714 37.5358 207.889 38.6767 207.889 39.8848C207.889 40.9586 207.687 42.0592 207.285 43.1867C206.909 44.3142 206.318 45.3343 205.513 46.2471C204.734 47.1598 203.728 47.9115 202.493 48.5021C201.285 49.0927 199.849 49.388 198.184 49.388C194.829 49.388 192.278 48.3276 190.533 46.2068C188.788 44.086 187.916 41.1599 187.916 37.4284C187.916 34.7439 188.332 32.3681 189.164 30.3011C189.996 28.234 191.178 26.5025 192.708 25.1065C194.265 23.6837 196.131 22.6099 198.305 21.8851C200.506 21.1334 202.976 20.7442 205.714 20.7173C205.768 21.5495 205.822 22.3683 205.875 23.1737C205.929 23.9522 205.983 24.7709 206.036 25.63C204.667 25.6568 203.379 25.7911 202.171 26.0327C200.99 26.2474 199.902 26.5964 198.909 27.0796C197.943 27.5628 197.097 28.1937 196.372 28.9722C195.647 29.7239 195.084 30.65 194.681 31.7507C195.272 31.4822 195.876 31.2943 196.493 31.1869C197.11 31.0796 197.688 31.0259 198.224 31.0259ZM230.373 34.811C230.373 39.5089 229.473 43.1196 227.675 45.6431C225.903 48.1397 223.447 49.388 220.306 49.388C217.165 49.388 214.695 48.1397 212.896 45.6431C211.125 43.1196 210.239 39.5089 210.239 34.811C210.239 32.4755 210.467 30.4084 210.923 28.6098C211.407 26.8112 212.091 25.2944 212.977 24.0595C213.863 22.8247 214.923 21.8851 216.158 21.2408C217.393 20.5965 218.776 20.2744 220.306 20.2744C223.447 20.2744 225.903 21.5361 227.675 24.0595C229.473 26.5562 230.373 30.14 230.373 34.811ZM224.252 34.811C224.252 33.4151 224.185 32.1534 224.051 31.0259C223.916 29.8715 223.702 28.8783 223.406 28.0461C223.111 27.2139 222.708 26.5696 222.198 26.1132C221.688 25.6568 221.057 25.4287 220.306 25.4287C219.554 25.4287 218.923 25.6568 218.413 26.1132C217.93 26.5696 217.527 27.2139 217.205 28.0461C216.91 28.8783 216.695 29.8715 216.561 31.0259C216.427 32.1534 216.359 33.4151 216.359 34.811C216.359 36.207 216.427 37.4821 216.561 38.6365C216.695 39.7908 216.91 40.7841 217.205 41.6163C217.527 42.4485 217.93 43.0928 218.413 43.5491C218.923 44.0055 219.554 44.2337 220.306 44.2337C221.057 44.2337 221.688 44.0055 222.198 43.5491C222.708 43.0928 223.111 42.4485 223.406 41.6163C223.702 40.7841 223.916 39.7908 224.051 38.6365C224.185 37.4821 224.252 36.207 224.252 34.811Z" fill="#fff"/>
    </svg>
  );
}

// ─── Module sub-nav (clickable) ───────────────────────────────────────────────
function ModuleSubnav({ active, onSelect }) {
  const { claim } = useDemo();
  const all = [
    { key: "dashboard", label: "Dashboard" },
    ...MODULES,
  ];

  return (
    <div style={{
      background: "#ebebe9", borderBottom: "1px solid #d4d2d0",
      padding: "0 18px", height: 32, display: "flex", alignItems: "center",
      gap: 22, flexShrink: 0,
    }}>
      {all.map(m => {
        const isActive = m.key === active;
        const touched = claim.modulesTouched.includes(m.key);
        return (
          <button key={m.key}
            onClick={() => onSelect(m.key)}
            style={{
              position: "relative", fontSize: 12,
              color: isActive ? TEAL : "#3b3a39",
              fontWeight: isActive ? 600 : 400,
              padding: "8px 0",
              borderBottom: isActive ? `2px solid ${TEAL}` : "2px solid transparent",
              transition: "all 0.2s",
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "inherit",
            }}>
            {m.label}
            {touched && !isActive && (
              <span style={{
                position: "absolute", top: 4, right: -10, width: 6, height: 6,
                borderRadius: "50%", background: "#107c10",
              }}/>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Two-pane booth layout ────────────────────────────────────────────────────
function BoothLayout({ active }) {
  return (
    <div style={{
      flex: 1, minHeight: 0, display: "flex",
      background: "#f3f3f3",
    }}>
      {/* Left: phone frame */}
      <div style={{
        width: 380, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(180deg, #f7f7f6 0%, #ececec 100%)",
        borderRight: "1px solid #d4d2d0",
      }}>
        <Whatsapp/>
      </div>

      {/* Right: transition screen, dashboard, or burial record */}
      {active === "transition" ? <Transition/>
        : active === "dashboard" ? <Dashboard/>
        : <BurialRecord/>}
    </div>
  );
}

// ─── Status bar (mimics the Ezra360 bottom strip) ─────────────────────────────
function StatusBar() {
  const { claim } = useDemo();
  return (
    <div style={{
      background: "#ebebe9", borderTop: "1px solid #d4d2d0",
      padding: "4px 14px", fontSize: 11, color: "#3b3a39",
      display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
    }}>
      <span style={{
        background: "#fff", border: "1px solid #c8c6c4",
        padding: "2px 8px", borderRadius: 2, fontWeight: 600,
      }}>{claim.stage === "Completed" ? "Spend dashboard" : "New Burial"}</span>
      <span style={{ color: "#888" }}>
        {claim.recordId ? `Editing ${claim.recordId}` : "Awaiting WhatsApp inbound…"}
      </span>
      <div style={{ flex: 1 }}/>
      <PendingLeads/>
      <span style={{ color: "#888" }}>
        Burials handled today · {claim.stage === "Completed" ? "1" : "0"}
      </span>
    </div>
  );
}

// ─── Pending leads — failed CRM submissions queued in localStorage ────────────
function PendingLeads() {
  const [queue, setQueue] = useState(() => getQueuedLeads());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setQueue(getQueuedLeads());
    window.addEventListener("crm-queue-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("crm-queue-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const count = queue.length;
  const hasFailures = count > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={hasFailures ? "Submissions that failed to reach the CRM" : "No pending leads"}
        style={{
          background: hasFailures ? "#fff4ce" : "transparent",
          border: `1px solid ${hasFailures ? "#d8b740" : "transparent"}`,
          color: hasFailures ? "#3b3a39" : "#888",
          padding: "1px 8px", borderRadius: 2, fontSize: 11,
          cursor: "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: hasFailures ? "#d83b01" : "#888",
        }}/>
        Pending leads · {count}
      </button>

      {open && (
        <PendingLeadsModal
          queue={queue}
          onClose={() => setOpen(false)}
          onExport={() => exportQueuedLeadsCsv()}
          onClear={() => { clearQueuedLeads(); setQueue([]); }}
          onRemove={(ts) => { removeQueuedLead(ts); setQueue(getQueuedLeads()); }}
        />
      )}
    </>
  );
}

function PendingLeadsModal({ queue, onClose, onExport, onClear, onRemove }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "grid", placeItems: "center", zIndex: 1000,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "min(900px, 92vw)", maxHeight: "82vh",
          borderRadius: 4, boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "'Segoe UI',system-ui,sans-serif",
        }}>
        <div style={{
          padding: "14px 18px", borderBottom: "1px solid #e6e4e2",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", flex: 1 }}>
            Pending CRM leads <span style={{ color: "#888", fontWeight: 400 }}>· {queue.length}</span>
          </div>
          <button onClick={onExport} disabled={queue.length === 0} style={btnPrimary(queue.length === 0)}>
            Export CSV
          </button>
          <button onClick={onClear} disabled={queue.length === 0} style={btnGhost(queue.length === 0)}>
            Clear all
          </button>
          <button onClick={onClose} style={{ ...btnGhost(false), padding: "4px 8px" }}>
            ✕
          </button>
        </div>

        <div style={{ overflow: "auto", flex: 1 }}>
          {queue.length === 0 ? (
            <div style={{ padding: "40px 18px", textAlign: "center", color: "#888", fontSize: 13 }}>
              No pending leads. Anything that fails to reach the CRM will land here.
            </div>
          ) : (
            <table style={{
              width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#1a1a1a",
            }}>
              <thead>
                <tr style={{ background: "#f7f7f6", textAlign: "left" }}>
                  <th style={th}>When</th>
                  <th style={th}>Name</th>
                  <th style={th}>Mobile</th>
                  <th style={th}>Email</th>
                  <th style={th}>Campaign</th>
                  <th style={th}>Reason</th>
                  <th style={{ ...th, width: 40 }}/>
                </tr>
              </thead>
              <tbody>
                {queue.map((e) => (
                  <tr key={e.timestamp} style={{ borderTop: "1px solid #ececea" }}>
                    <td style={td}>{new Date(e.timestamp).toLocaleString()}</td>
                    <td style={td}>{e.name}</td>
                    <td style={td}>{e.mobile}</td>
                    <td style={td}>{e.email}</td>
                    <td style={td}>{e.campaign}</td>
                    <td style={{ ...td, color: "#a4262c", maxWidth: 260, whiteSpace: "normal" }}>
                      {e.reason}
                    </td>
                    <td style={td}>
                      <button onClick={() => onRemove(e.timestamp)}
                        title="Remove this entry"
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          color: "#888", fontSize: 13, padding: 2,
                        }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const th = { padding: "8px 12px", fontWeight: 600, fontSize: 11, color: "#3b3a39", whiteSpace: "nowrap" };
const td = { padding: "8px 12px", whiteSpace: "nowrap" };

const btnPrimary = (disabled) => ({
  background: disabled ? "#d4d2d0" : TEAL, color: "#fff",
  border: "none", borderRadius: 2, padding: "5px 12px", fontSize: 12,
  cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
});
const btnGhost = (disabled) => ({
  background: "transparent", color: disabled ? "#bbb" : "#3b3a39",
  border: "1px solid #c8c6c4", borderRadius: 2, padding: "5px 10px",
  fontSize: 12, cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
});

// ─── Extra animation styles for newly populated fields ────────────────────────
function ExtraStyles() {
  return (
    <style>{`
      @keyframes fieldPop {
        0%   { background: #fff4ce; }
        100% { background: #ffffff; }
      }
      .field-pop {
        animation: fieldPop 1.2s ease-out;
      }
    `}</style>
  );
}
