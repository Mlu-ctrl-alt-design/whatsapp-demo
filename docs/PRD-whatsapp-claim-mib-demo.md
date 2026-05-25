# PRD — WhatsApp → MIB (Ezra360) Burial Claim Demo

**Owner:** Mlu
**Status:** Draft v1
**Target:** Conference booth demo (live)
**Branch:** `Mlu-ctrl-alt-design/whatsapp-claim-mib-demo-prd`

---

## 1. One-liner

A **two-sided live demo**: on one side the visitor lodges a burial claim on
their own WhatsApp; on the other side the booth screen shows that same claim
landing inside our MIB (Ezra360) and walking through every stage of the
burial process — verified, funded, dispatched, itemised down to the rand.
At the close we capture the visitor's email so the warm thread carries off
the floor.

The two claims this demo exists to prove:

1. We run the **burial process end-to-end** — visible in the Ezra360
   sub-nav as the claim threads through Burials → Pick-Ups → Removal → Trips
   → Deceased.
2. We show funeral businesses **what each burial actually costs them** —
   visible on the Quote Information + Payment Details tabs as line items fill
   in live.

## 2. Why we are building this

The booth has 30 seconds to land two claims that no other insurer on the floor
can make:

1. **End-to-end burial.** We do not just pay out — we run the burial process
   from claim intake through funds release and logistics dispatch.
2. **Spend visibility per burial.** Funeral businesses currently guess what a
   burial costs them. MIB shows the actual, line-itemised spend per burial in
   real time.

Everything in this demo exists to make those two claims feel undeniable, in
under a minute, on a phone the visitor already owns.

## 3. Audiences (and what each one needs to feel)

Routing tag is captured by the WhatsApp flow's first question.

| Tag | Who | What they need to feel by the end |
|---|---|---|
| **Consumer** | A walk-up curious about cover for their own family | "My family would be handled, not processed." |
| **Corporate** | HR / benefits buyer for a workforce | "I could run this for my whole team with no admin load." |
| **Broker** | An intermediary evaluating products to sell | "The burial side actually works — I can put my name behind this." |
| **Funeral business** *(new — primary audience for the spend claim)* | Owner/ops of a funeral parlour | "I would finally see what each burial costs me." |

The fourth audience is the one the spend-visibility claim is built for and
should be added as **option 4** ("Your funeral business") in the WhatsApp
routing question.

## 4. Scope

### In scope

- A **two-sided booth setup**: the visitor's own phone runs WhatsApp on one
  side; the booth's screen renders MIB (Ezra360) on the other. The two are
  driven by a single shared state so they always agree on what is happening.
  This is the core construct of the demo, not a presentation aid.
- A WhatsApp flow that matches the message tree in `whatsapp-message-tree.pdf`,
  extended with: (a) explicit **name + number capture at the start**,
  (b) a **funeral-business** routing branch, (c) an **email capture** step at
  the close.
- A MIB (Ezra360) prototype that **reproduces the real Ezra360 MIB shell**
  shown in the reference screenshots — same teal `#219CD6` header, same module
  sub-nav (`Dashboard · Burials · Pick-Ups · Removal · Trips · Deceased`),
  same `New Record: Burial` tab structure (`Summary · Burial Details · Quote
  Information · Related Trips · Invoices · Related Documents · Audit
  History`), same `Save / Save & Close` action bar. **MIB is the only app
  the booth sees** — the floating `AppSwitcher` chip is removed from
  `AppRouter.jsx`. `AppRouter` now renders `<MIB/>` unconditionally. DMS and
  mSCOA still exist in the codebase but are not reachable from the running
  app; if we need them back we re-add the switcher behind a flag.
- A live, on-screen burial record that is **created** by the WhatsApp `REPORT`
  message and then progresses through the **Burials → Pick-Ups → Removal →
  Trips → Deceased** module flow — the existing Ezra360 sub-nav IS the
  end-to-end story, so the demo just walks it.
- A real-time Stage field on the Summary tab that ticks through
  `Received → Confirmed → In Progress → Completed` as the demo runs.
- Live population of the **Quote Information** tab (Package Price, Total
  Additional Extras, Total For Burial Services, Total Payable By Client) and
  **Payment Details** panel (Amount Due By Scheme, Amount Outstanding, Amount
  Paid, Payment Status) — this is where the spend-visibility claim is sold.
- A live counter ("Burials handled to date: N") visible on the booth screen.
- Demo-mode safeguards so nothing here can be mistaken for, or leak into, a
  real Ezra360 instance.

### Out of scope (for the booth demo)

- Real WhatsApp Business API integration. A scripted/simulated chat that
  produces the same screen output is acceptable for the booth and removes a
  whole class of conference-floor failure modes. (If a real WA number is
  wired, see §10.)
- Real payments, real policy lookups, real dispatch.
- Authentication, multi-tenant separation, audit, compliance.
- Mobile-app version of MIB. Desktop-only on the booth screen.
- Anything that needs the visitor to install or sign up for something.

## 5. The booth experience, end to end

This is the canonical script the build must support. The demo is **two-sided
throughout**: the visitor's WhatsApp on the left, the MIB (Ezra360) screen
on the right, both driven by one shared state. Times are wall-clock from the
visitor's first message.

| t | Left side — visitor's WhatsApp | Right side — MIB on booth screen |
|---|---|---|
| 0s | Sends `DEMO` | MIB lands on the **Burials** module; an empty `New Record: Burial` opens on the **Summary** tab; Stage = `New`. |
| 5s | "Welcome. Before we start — what's your name?" → visitor replies | (no change yet — we're capturing the lead, not the claim) |
| 10s | "Best number to reach you on?" → visitor replies | (no change) |
| 15s | "Got it. Is this for: 1. Yourself 2. Your team 3. Your clients 4. Your funeral business?" | Stage = `Received`. Informant Details populate (Name, Contact Number from what they just typed). Burial Fund Type / Cover fields hint at the audience tag. |
| 25s | "Name our pretend policyholder" → visitor replies | Burial Summary fills in: Deceased, Burial Reference, Policy Number(s). Stage flips to `Confirmed`. |
| 35s | Types `REPORT` | Demo auto-walks the sub-nav: **Burials → Pick-Ups → Removal → Trips → Deceased**, each module showing a row being created/updated. On the Burial record, the **Burial Details** tab populates (Burial Type, Place Of Service, Place Of Burial, Mortuary Departure Time, Service Time, Package Coffin). |
| 45s | (cost lines start streaming) | **Quote Information** tab fills in: Package Price, Total Additional Extras, Total For Burial Services, Total Payable By Client. **Payment Details** ticks: Scheme Application Approved → Amount Due By Scheme → Amount Paid → Payment Status = `Paid`. |
| 55s | "That's it." | Stage = `Completed`. **Invoices** tab shows a generated invoice; **Related Documents** shows the burial pack; **Audit History** shows the full timeline including the WhatsApp inbound at the top. |
| 65s | "Where should I send your demo summary + the per-burial cost breakdown? Reply with your email." | A small "Awaiting email" badge appears on the record. |
| 75s | Visitor sends email | Email captured on the record (Email Address on Informant Details if blank, plus saved on the lead). Acknowledgement message fires, tag-matched to audience. |

The build must complete this without a human in the loop. Staff augment;
they are not required. The right-side screen and the left-side phone must
never disagree about state.

## 6. The MIB (Ezra360) screen — what it must contain

The MIB prototype lives at `src/mib/MIB.jsx` and is wired through
`AppRouter.jsx` as a third app alongside DMS and mSCOA. It must reproduce the
shell from the three reference screenshots — not approximate it.

### 6.1 Chrome (top to bottom)

- **Brand bar** (teal `#219CD6`, full width): `Ezra360` lockup · `MIB` pill ·
  hamburger · `Burial Services ▾` · spacer · `+` · search · user menu
  (`Mlu Manda ▾`). Matches our existing brand token — no new palette.
- **Module sub-nav** (light grey strip): `Dashboard · Burials · Pick-Ups ·
  Removal · Trips · Deceased`. Active item underlined in teal. This sub-nav
  IS the end-to-end burial process and is the visual centrepiece of the
  end-to-end claim.
- **Record header**: `New Record: Burial` (h1) with `Save`, `Save & Close`
  (dark buttons) and a red `X` close button right-aligned.
- **Record tabs**: `Summary · Burial Details · Quote Information · Related
  Trips · Invoices · Related Documents · Audit History`. Active tab
  underlined in teal.

### 6.2 Record tabs — fields to render

Field names below are taken directly from the reference screenshots. The
demo should not invent fields; it should populate these.

**Summary tab** — two card panels side-by-side:

- *Informant Details*: Name, Client, First Name, Last Name, Contact Number,
  Email Address, Alternative Number, Branch.
- *Burial Summary*: Stage (dropdown — `Received / Confirmed / In Progress /
  Completed`), Deceased, PickUp, Burial Reference, Burial Fund Type \*
  (Scheme / Cash / Corporate), Cover (Main Member / Spouse / Child /
  Extended), Policy Number(s).
- *Additional Info*: Created On, Created By.

**Burial Details tab** — two columns:

- Left: Burial Status, Burial Date, Postmortem, Burial Type, Place Of
  Delivery, Place Of Service, Place Of Burial, Mortuary Departure Time,
  Service Time, Grave Number, Is There Viewing, Viewing Venue, Viewing Date.
- Right: Burial Package, Scheme Package, Package Coffin, Upgrade Coffin,
  Program By TM, Grave Marker, Tombstone, Tombstone Order#, Notes, Captured
  By, Created On, Button Clicked, Owner.

**Quote Information tab** — this is where the spend-visibility claim lives:

- *Quote Information*: Package Price, Total Additional Extras, Total For
  Burial Services, Amount Of Upgrade, Discount Percentage, Discount Status,
  Quote, Total Payable By Client, Sales Order.
- *Payment Details*: Scheme Application Approved, Amount Due By Scheme,
  Amount Outstanding, Credit Value, Amount Paid, Payment Status, Date Paid,
  Invoice.
- *Additional Details*: Currency, Business Unit.

**Related Trips / Invoices / Related Documents / Audit History** — render the
tabs and a representative populated row each. Audit History must show the
inbound WhatsApp event as the first audit entry — that is the seam between
WhatsApp and MIB and visitors will look for it.

### 6.3 Module sub-nav behaviour (the end-to-end story)

The five sub-nav items below `Dashboard` are not decoration — they are the
end-to-end burial process. During the demo, each one must be reachable and
must show a row tied to the live claim:

| Module | Demo row content |
|---|---|
| Burials | The new burial record (auto-opens on the Summary tab) |
| Pick-Ups | Pick-up scheduled, vehicle assigned, ETA |
| Removal | Body removed from place of death, mortuary handover stamped |
| Trips | Hearse + family transport legs with times |
| Deceased | Deceased record cross-linked to policyholder + family |

A staffer can click through these mid-demo to show the visitor that the same
claim threads through every stage. This is the visual proof of the
end-to-end claim — far more convincing than narration.

## 7. The WhatsApp flow — deltas from the existing message tree

The message tree in `whatsapp-message-tree.pdf` is the baseline. Apply these
deltas:

- **Explicit name + number capture at the start** (new — overrides the cheat
  sheet's "don't ask for details" rule). Trigger is now just `DEMO`. The bot
  asks:
  1. "What's your name?"
  2. "Best number to reach you on?"
  Reason for asking despite WhatsApp giving us the profile number: an
  intentional, confirmed capture moment beats inferred data, and the typed
  number is the one they actually want us to use.
- **Routing question:** add option `4. Your funeral business` and a matching
  `funeral-business` tag.
- **Funeral-business close** (new): "That's what running a burial through MIB
  looks like. The screen at the booth shows the cost of that burial line by
  line — actual spend, not estimates."
- **After REPORT:** between each backend tick, emit a short cost line so the
  WhatsApp side mirrors the figures on the right-side screen, e.g. "Coffin
  booked — R4,200". This is what makes the spend claim survive the visitor
  walking away from the booth.
- **Email capture at the close** (new — final step before audience-specific
  CTA): "Where should I send your demo summary + the per-burial cost
  breakdown? Reply with your email." The audience-specific close (consumer /
  corporate / broker / funeral-business) fires *after* the email is captured,
  acknowledging it.
- **Catch-alls, after-hours, TALK behaviour** stay as written.

## 8. Success criteria

The demo is successful at the conference if, by close of the day:

- **≥ 60%** of booth visitors who stop send the WhatsApp message themselves
  (we measure: messages received / staff stop count).
- **≥ 90%** of those who start give us a confirmed name AND number at the
  opening capture step.
- **≥ 80%** of those who message complete the flow to the "Completed" state
  without help.
- **≥ 50%** of completers reply with an email at the close. This is the
  single most important conversion number — it is what carries the warm
  thread off the conference floor.
- **Zero** demos where the screen and the chat disagree on state.
- **Zero** moments where staff have to apologise for the demo.

Numeric targets are first-day baselines; revise after day one.

## 9. Non-functional requirements

- **Cold-start to claim-on-screen:** < 2s on conference Wi-Fi.
- **Backend tick cadence:** ~2s per state. Tunable from a single constant.
- **Resilience:** if WhatsApp/network drops, the screen continues a scripted
  demo loop so the booth never goes dark.
- **Reset:** one click resets the MIB queue to a clean state between visitors.
- **Two-sided rendering** (booth screen): a phone-frame WhatsApp transcript on
  the left, MIB on the right, both reading from the same in-memory state so
  they cannot drift. Bystanders watching the booth see both sides; the visitor
  on their own phone is the left side already.
- **Lead record:** name, number, audience tag, email, timestamps, and the
  generated burial record ID persist together as one row. Exportable as CSV
  for follow-up.

## 10. If we wire a real WhatsApp number

Only if a working WA Business number, template approvals, and a tested webhook
are in hand **two weeks** before the conference. Otherwise: simulated. The
fallback is not a degraded demo — the simulated version is the default and the
real one is an upgrade.

## 11. Risks & how we kill them

| Risk | Kill |
|---|---|
| Conference Wi-Fi fails | Demo runs fully offline against in-memory state |
| WA template not approved in time | Simulated chat is the default path |
| Screen and chat drift out of sync | Single source of truth in MIB; chat reads from it |
| Visitor takes longer than 60s | Auto-reply keeps thread warm; staff move on |
| Real claim accidentally created | Hard demo-mode flag; nothing persists past reset |
| Cost figures look made-up | Use one real funeral business's anonymised numbers as the default seed |

## 12. Open questions

1. Which funeral business's anonymised numbers seed the ledger? (Need one real
   set to make the spend claim land.)
2. Do we want the per-burial ledger to be editable by the visitor at the
   booth, or read-only with a "send me my own" CTA? (Editable is more
   convincing; read-only is safer.)
3. Routing tag option 4 — wording: "Your funeral business" vs. "A funeral
   business you run"?
4. Live counter ("Burials handled to date: N") — what is N, and is it
   defensible if a visitor asks?
5. Do we ship MIB behind the same app switcher chip, or as a standalone URL,
   so the DMS audience does not see the demo on the floor?
6. Email capture wording — "demo summary + per-burial cost breakdown" is
   generous; do we want a softer ask ("send me a copy") or a harder one
   (specifically promise the per-business cost template)?
7. POPIA: confirm the opening name+number+email asks are framed with the
   right consent line for the conference.

## 13. Build order (suggested)

1. `src/mib/` scaffold + `AppRouter.jsx` rewrite. Remove the `AppSwitcher`
   chip, remove the hash-reading logic, and have `AppRouter` render `<MIB/>`
   unconditionally. DMS and mSCOA imports stay in the file commented out (or
   move to git history) so the codebase stays clean.
2. Ezra360 chrome (brand bar, module sub-nav, record header, record tabs) —
   pixel-match the reference screenshots.
3. `New Record: Burial` form with Summary + Burial Details + Quote Information
   tabs, populated from a single in-memory claim model.
4. State machine that drives Stage + sub-nav module rows from one source of
   truth.
5. WhatsApp flow (simulated) wired to the same state machine.
6. Remaining record tabs (Related Trips / Invoices / Related Documents / Audit
   History).
7. Side-by-side booth view (phone-frame WA on the left, MIB on the right).
8. Demo reset + offline fallback.
9. Three-phone test pass.

## 14. Appendix — source material

- `.context/attachments/WpKVBY/whatsapp-message-tree.pdf` — message tree
- `.context/attachments/uDZjv1/booth-cheat-sheet.pdf` — booth cheat sheet
- `.context/attachments/JmEYSK/image.png` — Ezra360 MIB **Summary** tab
- `.context/attachments/IeOtP0/image.png` — Ezra360 MIB **Burial Details** tab
- `.context/attachments/e36Wbx/image.png` — Ezra360 MIB **Quote Information** tab
