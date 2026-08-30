import { useState } from "react";
import {
  Boxes,
  CircleUserRound,
  LockKeyhole,
  Map,
  Settings,
  ShieldCheck,
  Vault,
} from "lucide-react";
import "./App.css";

type View = "vault" | "map" | "settings";

const navigation: Array<{ id: View; label: string; icon: typeof Vault }> = [
  { id: "vault", label: "Vault", icon: Vault },
  { id: "map", label: "Map", icon: Map },
  { id: "settings", label: "Settings", icon: Settings },
];

const viewContent: Record<
  View,
  { eyebrow: string; title: string; description: string; icon: typeof Vault }
> = {
  vault: {
    eyebrow: "Local vault",
    title: "Your accounts, clearly organized",
    description:
      "Account records, credentials, recovery details, and authentication methods will live here.",
    icon: LockKeyhole,
  },
  map: {
    eyebrow: "Identity map",
    title: "See how every account connects",
    description:
      "Authentication, recovery, ownership, and dependency relationships will form an interactive map.",
    icon: Boxes,
  },
  settings: {
    eyebrow: "Preferences",
    title: "Control your local Account OS",
    description:
      "Vault location, lock behavior, backups, and local application preferences will be managed here.",
    icon: ShieldCheck,
  },
};

function App() {
  const [activeView, setActiveView] = useState<View>("vault");
  const content = viewContent[activeView];
  const ContentIcon = content.icon;

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <CircleUserRound size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p className="brand-name">Account OS</p>
            <p className="brand-edition">Local desktop vault</p>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                className="nav-item"
                data-active={isActive}
                key={item.id}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <p>Offline ready</p>
            <span>No cloud connection</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="section-kicker">Account OS / V1</p>
            <h1>{navigation.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="vault-state" aria-label="Vault state: locked" role="status">
            <LockKeyhole size={15} />
            Locked
          </div>
        </header>

        <section className="placeholder-panel" aria-labelledby="view-title">
          <div className="placeholder-icon" aria-hidden="true">
            <ContentIcon size={30} strokeWidth={1.6} />
          </div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2 id="view-title">{content.title}</h2>
          <p>{content.description}</p>
          <div className="milestone-note">
            <span>Foundation ready</span>
            <p>Functional vault features begin in the next milestone.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
