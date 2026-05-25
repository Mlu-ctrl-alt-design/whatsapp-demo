// MIB (Ezra360) booth demo — the only app the running build serves.
// The DMS and mSCOA prototypes still live in src/ but are unreachable from
// the running app. To bring them back, restore the hash-routed switcher.

import MIB from "./mib/MIB.jsx";

export default function AppRouter() {
  return <MIB/>;
}
