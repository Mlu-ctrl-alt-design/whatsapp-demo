// Static seed data + reference content for the MIB demo.
// All visitor-facing copy is kept Grade-4 reading level — short sentences,
// common words, one idea per line.

export const AUDIENCE = {
  "1": { tag: "consumer",         label: "Yourself",            cover: "Main Member", fund: "Scheme" },
  "2": { tag: "corporate",        label: "Your team",           cover: "Group",       fund: "Corporate" },
  "3": { tag: "broker",           label: "Your clients",        cover: "Main Member", fund: "Scheme" },
  "4": { tag: "funeral-business", label: "Your funeral home",   cover: "Main Member", fund: "Scheme" },
};

// Was the deceased the main policy holder? If not, which dependant.
// Cover amount changes by relation — this is what makes the dependant
// branch matter in the demo.
export const RELATIONS = {
  main:   { label: "Main Member", coverAmount: 30000, schemeCode: "S-MAIN" },
  spouse: { label: "Spouse",      coverAmount: 25000, schemeCode: "S-SPOUSE" },
  parent: { label: "Parent",      coverAmount: 20000, schemeCode: "S-PARENT" },
  child:  { label: "Child",       coverAmount: 15000, schemeCode: "S-CHILD" },
};

// Packages a visitor can pick from when they CHANGE the proposed booking.
// Silver is the default we draft on first run.
export const PACKAGES = {
  "1": { key: "bronze", name: "Bronze", coffin: "Pine Standard",     price: 12000, services: 4200, extras: 1800 },
  "2": { key: "silver", name: "Silver", coffin: "Oak Standard",      price: 18000, services: 5600, extras: 3200 },
  "3": { key: "gold",   name: "Gold",   coffin: "Mahogany Standard", price: 28000, services: 7400, extras: 5800 },
};
export const DEFAULT_PACKAGE_KEY = "2";

// What populates as REPORT runs. The amounts come from the selected package
// — see runFulfilment in state.jsx.
export const COST_LINES = [
  { key: "package",  label: "Package Price",             waLabel: "Coffin + handling" },
  { key: "extras",   label: "Total Additional Extras",   waLabel: "Catering + flowers" },
  { key: "services", label: "Total For Burial Services", waLabel: "Mortuary + transport" },
  { key: "upgrade",  label: "Amount Of Upgrade",         waLabel: "Tombstone upgrade", fixed: 2500 },
];

// Walked through during fulfilment. Each module gets a row tied to the live
// claim — proves "we do burial end-to-end" by showing the claim thread
// through every sub-nav module.
export const MODULES = [
  { key: "burials",  label: "Burials",   crumb: "Burial record opened" },
  { key: "pickups",  label: "Pick-Ups",  crumb: "Pick-up booked — vehicle MIB-04, ETA 14:30" },
  { key: "removal",  label: "Removal",   crumb: "Body removed, mortuary handover stamped" },
  { key: "trips",    label: "Trips",     crumb: "Hearse + family transport booked" },
  { key: "deceased", label: "Deceased",  crumb: "Deceased record linked to policy" },
];

// Closing copy keyed by audience tag. Grade-4 voice.
export const CLOSE = {
  "consumer":         "Your family is covered. Logged in minutes. Done in hours.",
  "corporate":        "Cover your whole team. One setup. No paperwork.",
  "broker":           "A product you can sell with pride. The burial side really works.",
  "funeral-business": "You just saw the cost of one burial — line by line. Real numbers, not guesses.",
};

// ─── Dashboard data (inventory + fleet + spend report) ────────────────────────

export const COFFIN_INVENTORY = [
  { name: "Pine Standard",      stock: 12, min: 5, type: "Bronze" },
  { name: "Oak Standard",       stock: 4,  min: 5, type: "Silver" },
  { name: "Mahogany Standard",  stock: 8,  min: 3, type: "Gold" },
  { name: "Mahogany Premium",   stock: 2,  min: 2, type: "Upgrade" },
  { name: "Cremation Casket",   stock: 6,  min: 3, type: "Cremation" },
];

export const FLEET = [
  { id: "MIB-04", type: "Hearse",       status: "On Trip",     nextTrip: "Mt. Hope, 11:15" },
  { id: "MIB-05", type: "Hearse",       status: "Available",   nextTrip: "—" },
  { id: "MIB-12", type: "Family Van",   status: "Available",   nextTrip: "—" },
  { id: "MIB-08", type: "Body Carrier", status: "Maintenance", nextTrip: "Back Mon" },
  { id: "MIB-15", type: "Family Van",   status: "On Trip",     nextTrip: "Soweto, 09:30" },
];

// Spend report — what the funeral business is spending on burials this
// month. The single bar chart that justifies the booth's spend claim.
export const SPEND_BY_CATEGORY = [
  { name: "Coffin / Casket",   amount: 485000 },
  { name: "Mortuary",          amount: 168000 },
  { name: "Grave / Cemetery",  amount: 145000 },
  { name: "Transport",         amount: 120000 },
  { name: "Catering",          amount:  98000 },
  { name: "Admin",             amount:  85000 },
  { name: "Staff Time",        amount:  67000 },
  { name: "Flowers",           amount:  45000 },
];

export const KPI = {
  burialsThisMonth: 42,
  totalSpend:       1213000,
  avgPerBurial:      28880,
  avgMarginPct:         18,
  transfersOut:      3,
};

export const TRANSFERS = [
  { id: "TRF-001", deceased: "J. Mokoena",  fromScheme: "Old Mutual Burial",   status: "Completed", date: "12/05/2026" },
  { id: "TRF-002", deceased: "S. Nkosi",    fromScheme: "Avbob Family Plan",   status: "In Progress", date: "18/05/2026" },
  { id: "TRF-003", deceased: "T. Mthembu",  fromScheme: "Metropolitan Burial", status: "Pending",  date: "22/05/2026" },
];

export const PHASES = [
  "IDLE",
  "ASK_NAME",
  "ASK_NUMBER",
  "ASK_AUDIENCE",
  "ASK_DECEASED",
  "ASK_RELATION",       // main member, or which dependant
  "ASK_OTHER_SCHEME",   // does the deceased have a policy with another scheme?
  "ASK_TRANSFER_OUT",   // if yes, would they like a transfer out?
  "ASK_REPORT",
  "REPORTING",          // request received + burial details drafted
  "AWAIT_CONFIRM",      // visitor must confirm before funds release
  "AWAIT_PACKAGE",      // visitor picking a different package
  "FULFILLING",         // verified, funds, dispatch, costs, invoice
  "ASK_EMAIL",
  "CLOSED",
];
