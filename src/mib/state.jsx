// Single source of truth for the WhatsApp ⇄ MIB demo.
// Both the phone-frame chat (left) and the Ezra360 burial record (right)
// read from this. They never communicate directly.
//
// All bot copy is kept Grade-4 reading level — short sentences, common
// words, one idea per line.

import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from "react";
import {
  AUDIENCE, RELATIONS, PACKAGES, DEFAULT_PACKAGE_KEY,
  COST_LINES, MODULES, CLOSE,
} from "./data.js";

const ts = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const emptyClaim = () => ({
  stage: "New",
  informant: {
    name: "", contactNumber: "",
    firstName: "", lastName: "",
    email: "", altNumber: "", branch: "",
    client: "",
  },
  burialSummary: {
    deceased: "", pickup: "", burialReference: "",
    burialFundType: "", cover: "", policyNumber: "",
    relation: "",       // main / spouse / parent / child
    coverAmount: 0,
  },
  burialDetails: {
    burialStatus: "", burialDate: "", postmortem: "No", burialType: "",
    placeOfDelivery: "", placeOfService: "", placeOfBurial: "",
    mortuaryDepartureTime: "", serviceTime: "",
    graveNumber: "", isThereViewing: "", viewingVenue: "", viewingDate: "",
    burialPackage: "", schemePackage: "", packageCoffin: "",
    upgradeCoffin: "", programByTm: "Yes", graveMarker: "Yes",
    tombstone: "Yes", tombstoneOrder: "",
    notes: "",
  },
  quote: {
    package: 0, extras: 0, services: 0, upgrade: 0,
    discountPct: 0, discountStatus: "None",
    quote: 0, totalPayable: 0, salesOrder: "",
  },
  payment: {
    schemeApproved: "No", amountDueByScheme: 0,
    amountOutstanding: 0, creditValue: 0,
    amountPaid: 0, paymentStatus: "Pending",
    datePaid: "", invoice: "",
  },
  packageKey: DEFAULT_PACKAGE_KEY,
  modulesTouched: [],
  audit: [],
  audienceTag: "",
  createdOn: "",
  createdBy: "WhatsApp Bot",
  recordId: "",
});

const emptyChat = () => ([
  { from: "bot", text: "Hi. Send DEMO to start.", t: ts() },
]);

const initial = {
  phase: "IDLE",
  claim: emptyClaim(),
  chat: emptyChat(),
  awaitingEmailBadge: false,
};

// ─── reducer ──────────────────────────────────────────────────────────────────
function reducer(s, a) {
  switch (a.type) {
    case "BOT_SAY":
      return { ...s, chat: [...s.chat, { from: "bot", text: a.text, t: ts() }] };
    case "USER_SAY":
      return { ...s, chat: [...s.chat, { from: "user", text: a.text, t: ts() }] };
    case "SET_PHASE":
      return { ...s, phase: a.phase };
    case "PATCH_CLAIM":
      return { ...s, claim: deepMerge(s.claim, a.patch) };
    case "TOUCH_MODULE":
      return { ...s, claim: { ...s.claim, modulesTouched: addUnique(s.claim.modulesTouched, a.key) } };
    case "AUDIT":
      return { ...s, claim: { ...s.claim, audit: [{ t: ts(), label: a.label }, ...s.claim.audit] } };
    case "AWAIT_EMAIL":
      return { ...s, awaitingEmailBadge: a.on };
    case "RESET":
      return { ...initial, claim: emptyClaim(), chat: emptyChat() };
    default:
      return s;
  }
}

function deepMerge(a, b) {
  if (!b || typeof b !== "object") return b ?? a;
  const out = { ...a };
  for (const k of Object.keys(b)) {
    const v = b[k];
    out[k] = (v && typeof v === "object" && !Array.isArray(v))
      ? deepMerge(a[k] || {}, v)
      : v;
  }
  return out;
}
const addUnique = (arr, k) => arr.includes(k) ? arr : [...arr, k];

// ─── context ──────────────────────────────────────────────────────────────────
const Ctx = createContext(null);

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const say = useCallback((text) => dispatch({ type: "BOT_SAY", text }), []);
  const sayUser = useCallback((text) => dispatch({ type: "USER_SAY", text }), []);
  const audit = useCallback((label) => dispatch({ type: "AUDIT", label }), []);

  // Visitor types a reply — drives the state machine.
  const submit = useCallback((raw) => {
    const text = (raw || "").trim();
    if (!text) return;
    const s = stateRef.current;
    sayUser(text);

    const advance = (phase, fn) => {
      dispatch({ type: "SET_PHASE", phase });
      setTimeout(fn, 450);
    };

    switch (s.phase) {
      case "IDLE": {
        if (text.toUpperCase().includes("DEMO")) {
          advance("ASK_NAME", () => say("Hi. What's your name?"));
        } else {
          say("Send DEMO to start.");
        }
        break;
      }
      case "ASK_NAME": {
        dispatch({ type: "PATCH_CLAIM", patch: { informant: {
          name: text,
          firstName: text.split(" ")[0] || text,
          lastName: text.split(" ").slice(1).join(" "),
        } } });
        audit(`WhatsApp inbound — visitor name: ${text}`);
        advance("ASK_NUMBER", () => say(`Hi ${text.split(" ")[0]}. What's your phone number?`));
        break;
      }
      case "ASK_NUMBER": {
        dispatch({ type: "PATCH_CLAIM", patch: { informant: { contactNumber: text } } });
        audit(`Contact number captured: ${text}`);
        dispatch({ type: "PATCH_CLAIM", patch: {
          stage: "Received",
          createdOn: ts(),
          recordId: `BUR-${Math.floor(100000 + Math.random()*900000)}`,
        }});
        advance("ASK_AUDIENCE", () => {
          say("Thanks. Who is this for?\n1. You\n2. Your team\n3. Your clients\n4. Your funeral home\n\nReply 1, 2, 3 or 4.");
        });
        break;
      }
      case "ASK_AUDIENCE": {
        const key = text.match(/[1-4]/)?.[0];
        if (!key) { say("Reply 1, 2, 3 or 4."); break; }
        const aud = AUDIENCE[key];
        dispatch({ type: "PATCH_CLAIM", patch: {
          audienceTag: aud.tag,
          burialSummary: { cover: aud.cover, burialFundType: aud.fund },
          informant: { client: aud.label },
        }});
        audit(`Audience tagged: ${aud.tag}`);
        advance("ASK_DECEASED", () => {
          say("This is a safe demo. Nothing is real.\n\nGive us a pretend name. Who passed away?");
        });
        break;
      }
      case "ASK_DECEASED": {
        const ref = `EZR-${Math.floor(10000 + Math.random()*90000)}`;
        const policy = `POL-${Math.floor(1000000 + Math.random()*9000000)}`;
        dispatch({ type: "PATCH_CLAIM", patch: {
          burialSummary: { deceased: text, burialReference: ref, policyNumber: policy, pickup: "Scheduled" },
          stage: "Confirmed",
        }});
        audit(`Deceased registered: ${text}`);
        advance("ASK_RELATION", () => {
          say(`Sorry to hear about ${text}.\n\nWas ${text} the main member on the policy?\n1. Yes — main member\n2. No — spouse\n3. No — parent\n4. No — child\n\nReply 1, 2, 3 or 4.`);
        });
        break;
      }
      case "ASK_RELATION": {
        const map = { "1": "main", "2": "spouse", "3": "parent", "4": "child" };
        const key = text.match(/[1-4]/)?.[0];
        if (!key) { say("Reply 1, 2, 3 or 4."); break; }
        const rel = RELATIONS[map[key]];
        const deceased = s.claim.burialSummary.deceased;
        dispatch({ type: "PATCH_CLAIM", patch: {
          burialSummary: {
            relation: map[key],
            cover: rel.label,
            coverAmount: rel.coverAmount,
          },
        }});
        audit(`Relation: ${rel.label} — cover R${rel.coverAmount.toLocaleString("en-ZA")}`);
        advance("ASK_OTHER_SCHEME", () => {
          say(`Got it. ${rel.label} cover is R${rel.coverAmount.toLocaleString("en-ZA")}.\n\nDoes the deceased have a policy with another scheme?\nReply Yes or No.`);
        });
        break;
      }
      case "ASK_OTHER_SCHEME": {
        const answer = text.toLowerCase();
        if (answer !== "yes" && answer !== "no") { say("Reply Yes or No."); break; }
        const deceased = s.claim.burialSummary.deceased;
        if (answer === "yes") {
          audit("Deceased has a policy with another scheme");
          advance("ASK_TRANSFER_OUT", () => {
            say("Would you like to do a transfer out?\nReply Yes or No.");
          });
        } else {
          audit("No policy with another scheme");
          advance("ASK_REPORT", () => {
            say(`To report ${deceased}'s passing, type REPORT.`);
          });
        }
        break;
      }
      case "ASK_TRANSFER_OUT": {
        const answer = text.toLowerCase();
        if (answer !== "yes" && answer !== "no") { say("Reply Yes or No."); break; }
        const deceased = s.claim.burialSummary.deceased;
        if (answer === "yes") {
          audit("Transfer out requested");
          dispatch({ type: "PATCH_CLAIM", patch: { burialSummary: { transferOut: "Yes" } } });
          say("Noted. We will process a transfer out.");
        } else {
          audit("Transfer out declined");
          dispatch({ type: "PATCH_CLAIM", patch: { burialSummary: { transferOut: "No" } } });
        }
        advance("ASK_REPORT", () => {
          say(`To report ${deceased}'s passing, type REPORT.`);
        });
        break;
      }
      case "ASK_REPORT": {
        if (!/report/i.test(text)) { say("Type REPORT when ready."); break; }
        dispatch({ type: "SET_PHASE", phase: "REPORTING" });
        runConfirmation({ say, audit, dispatch, packageKey: s.claim.packageKey });
        break;
      }
      case "AWAIT_CONFIRM": {
        if (/^confirm\b/i.test(text) || text.toLowerCase() === "yes") {
          dispatch({ type: "SET_PHASE", phase: "FULFILLING" });
          runFulfilment({ say, audit, dispatch, packageKey: s.claim.packageKey });
        } else if (/^change\b/i.test(text) || /^edit\b/i.test(text)) {
          dispatch({ type: "SET_PHASE", phase: "AWAIT_PACKAGE" });
          const lines = [
            "Pick a new package:",
            ...Object.entries(PACKAGES).map(([k, p]) =>
              `${k}. ${p.name} — R${p.price.toLocaleString("en-ZA")} (${p.coffin})`),
            "",
            "Reply 1, 2 or 3.",
          ];
          say(lines.join("\n"));
        } else {
          say("Reply CONFIRM to go ahead.\nReply CHANGE to pick a different package.");
        }
        break;
      }
      case "AWAIT_PACKAGE": {
        const key = text.match(/[1-3]/)?.[0];
        if (!key) { say("Reply 1, 2 or 3."); break; }
        const pkg = PACKAGES[key];
        dispatch({ type: "PATCH_CLAIM", patch: {
          packageKey: key,
          burialDetails: {
            burialPackage: pkg.name,
            packageCoffin: pkg.coffin,
            schemePackage: `Family Scheme — ${pkg.name}`,
          },
        }});
        audit(`Package changed to ${pkg.name} (R${pkg.price.toLocaleString("en-ZA")})`);
        say(`Package set to ${pkg.name} — R${pkg.price.toLocaleString("en-ZA")}.`);
        setTimeout(() => {
          dispatch({ type: "SET_PHASE", phase: "AWAIT_CONFIRM" });
          say("Ready? Reply CONFIRM to go ahead.\nReply CHANGE to pick again.");
        }, 700);
        break;
      }
      case "ASK_EMAIL": {
        const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
        if (!emailLike) { say("That doesn't look like an email. Try again?"); break; }
        dispatch({ type: "PATCH_CLAIM", patch: { informant: { email: text } } });
        dispatch({ type: "AWAIT_EMAIL", on: false });
        audit(`Email captured: ${text}`);
        const tag = stateRef.current.claim.audienceTag;
        advance("CLOSED", () => {
          say(`Got it. Sending your summary to ${text} now.`);
          setTimeout(() => say(CLOSE[tag] || CLOSE.consumer), 800);
        });
        break;
      }
      case "CLOSED": {
        say("Your demo is saved here. Tap RESET on the booth screen to run it again.");
        break;
      }
      default:
        say("Try again. Or reply MENU to start over.");
    }
  }, [say, sayUser, audit]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <Ctx.Provider value={{ ...state, submit, reset, say }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDemo = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo must be used inside <DemoProvider>");
  return v;
};

// ─── REPORT phase 1 — propose details for confirmation ────────────────────────
function runConfirmation({ say, audit, dispatch, packageKey }) {
  const sat = nextSat();
  const pkg = PACKAGES[packageKey] || PACKAGES[DEFAULT_PACKAGE_KEY];
  const details = {
    burialStatus: "Active",
    burialDate: sat,
    burialType: "Burial",
    placeOfDelivery: "City Mortuary",
    placeOfService: "Mt. Hope Chapel",
    placeOfBurial: "Mt. Hope Memorial Park",
    mortuaryDepartureTime: "08:30",
    serviceTime: "10:00",
    graveNumber: "C-117",
    isThereViewing: "Yes",
    viewingVenue: "Mt. Hope Chapel",
    viewingDate: sat,
    burialPackage: pkg.name,
    schemePackage: `Family Scheme — ${pkg.name}`,
    packageCoffin: pkg.coffin,
    upgradeCoffin: "Mahogany Premium",
    tombstoneOrder: `TS-${Math.floor(1000+Math.random()*9000)}`,
  };

  const steps = [
    () => {
      dispatch({ type: "TOUCH_MODULE", key: "burials" });
      audit("Burial record opened from WhatsApp report");
      say("✅ Request received.");
    },
    () => {
      dispatch({ type: "PATCH_CLAIM", patch: { burialDetails: details } });
      audit("Burial details drafted — awaiting confirmation");
      say("Here is what we have:");
    },
    () => {
      say([
        `• Date: ${sat}`,
        `• Service: ${details.placeOfService} at ${details.serviceTime}`,
        `• Burial: ${details.placeOfBurial}`,
        `• Grave: ${details.graveNumber}`,
        `• Package: ${pkg.name} — R${pkg.price.toLocaleString("en-ZA")}`,
        `• Coffin: ${pkg.coffin}`,
      ].join("\n"));
    },
    () => {
      dispatch({ type: "SET_PHASE", phase: "AWAIT_CONFIRM" });
      say("Ready?\nReply CONFIRM to go ahead.\nReply CHANGE to pick a different package.");
    },
  ];

  steps.forEach((fn, i) => setTimeout(fn, 900 + i * 1300));
}

// ─── REPORT phase 2 — fulfilment (post-confirmation) ──────────────────────────
function runFulfilment({ say, audit, dispatch, packageKey }) {
  const pkg = PACKAGES[packageKey] || PACKAGES[DEFAULT_PACKAGE_KEY];
  const steps = [];

  audit("Visitor confirmed the burial details");

  const remaining = MODULES.filter(m => m.key !== "burials");
  remaining.forEach((m, i) => {
    steps.push(() => {
      dispatch({ type: "TOUCH_MODULE", key: m.key });
      audit(m.crumb);
      if (i === 0) say("✅ Policy checked.");
      if (i === 1) say("✅ Money sent.");
      if (i === 2) say("✅ Trips booked.");
      if (i === 3) say("✅ Records linked.");
    });
  });

  steps.push(() => {
    dispatch({ type: "PATCH_CLAIM", patch: { stage: "In Progress" } });
  });

  // Stream cost lines — amounts depend on the chosen package.
  const amounts = {
    package:  pkg.price,
    extras:   pkg.extras,
    services: pkg.services,
    upgrade:  2500,
  };

  let running = 0;
  COST_LINES.forEach((c) => {
    const amount = amounts[c.key] ?? c.fixed ?? 0;
    steps.push(() => {
      running += amount;
      const total = running;
      dispatch({ type: "PATCH_CLAIM", patch: {
        quote: {
          [c.key]: amount,
          quote: total, totalPayable: total,
          salesOrder: `SO-${Math.floor(10000+Math.random()*90000)}`,
        },
      }});
      say(`${c.waLabel} — R${amount.toLocaleString("en-ZA")}`);
    });
  });

  // Payment settles
  steps.push(() => {
    const total = Object.values(amounts).reduce((a, b) => a + b, 0);
    dispatch({ type: "PATCH_CLAIM", patch: {
      payment: {
        schemeApproved: "Yes",
        amountDueByScheme: total,
        amountPaid: total,
        amountOutstanding: 0,
        paymentStatus: "Paid",
        datePaid: ts(),
        invoice: `INV-${Math.floor(10000+Math.random()*90000)}`,
      },
      stage: "Completed",
    }});
    audit("Funds released & invoice generated");
    say("Done.\nThis took 4 hours.\nNot days. Not weeks.");
  });

  // Ask for email
  steps.push(() => {
    dispatch({ type: "SET_PHASE", phase: "ASK_EMAIL" });
    dispatch({ type: "AWAIT_EMAIL", on: true });
    say("Where do we send your summary?\nReply with your email.");
  });

  steps.forEach((fn, i) => setTimeout(fn, 700 + i * 1300));
}

function nextSat() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d.toLocaleDateString("en-GB");
}
