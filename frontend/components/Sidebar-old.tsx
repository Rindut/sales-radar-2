import { useRouter } from "next/router";
import { useState } from "react";

type Page = "dashboard" | "pipeline" | "history" | "settings";

export default function Sidebar({ active }: { active: Page }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const now = new Date();
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const nav: { id: Page; label: string; href: string; badge?: string; icon: JSX.Element }[] = [
    { id: "dashboard", label: "Leads",           href: "/",         badge: "10", icon: <TargetIcon /> },
    { id: "pipeline",  label: "Pipeline",         href: "/pipeline",             icon: <PipelineIcon /> },
    { id: "history",   label: "Outreach History", href: "/history",              icon: <HistoryIcon /> },
    { id: "settings",  label: "Settings",         href: "/settings",             icon: <SettingsIcon /> },
  ];

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      background: "var(--sidebar-bg)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: collapsed ? "28px 8px" : "28px 12px",
      flexShrink: 0, minHeight: "100vh",
      transition: "width 0.2s ease, padding 0.2s ease",
      overflow: "hidden",
    }}>
      <div>
        {/* Logo + collapse toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", padding: "0 8px 20px" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="#fff" strokeWidth="1.8" fill="none" />
                  <circle cx="9" cy="9" r="3.5" stroke="#fff" strokeWidth="1.8" fill="none" />
                  <circle cx="9" cy="9" r="1" fill="#fff" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: "-0.3px" }}>Sales Radar</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>2.0</div>
              </div>
            </div>
          )}

          {collapsed && (
            <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#fff" strokeWidth="1.8" fill="none" />
                <circle cx="9" cy="9" r="3.5" stroke="#fff" strokeWidth="1.8" fill="none" />
                <circle cx="9" cy="9" r="1" fill="#fff" />
              </svg>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6,
              width: 24, height: 24, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
              marginLeft: collapsed ? 0 : 4,
              marginTop: collapsed ? 8 : 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              {collapsed
                ? <path d="M4 2l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M8 2L4 6l4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              }
            </svg>
          </button>
        </div>

        {/* Date chip */}
        {!collapsed && (
          <div style={{ margin: "0 4px 20px", background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" as const, marginBottom: 2 }}>Hari ini</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-mono)" }}>{dateStr}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px 0" : "10px 12px",
                borderRadius: 8, border: "none",
                background: active === item.id ? "rgba(255,255,255,0.2)" : "transparent",
                color: active === item.id ? "#fff" : "rgba(255,255,255,0.65)",
                fontWeight: active === item.id ? 600 : 400,
                fontSize: 14, cursor: "pointer", textAlign: "left" as const,
                transition: "all 0.15s",
              }}
            >
              <span style={{ opacity: active === item.id ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* User footer */}
      <div style={{ padding: collapsed ? "16px 0 0" : "16px 8px 0", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>AR</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>Andi Rachman</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>Account Executive</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function TargetIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>;
}
function PipelineIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="6" y="5" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="7" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>;
}
function HistoryIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.5"/><path d="M12.5 8c0-.3-.03-.6-.07-.88l1.56-1.22-1.5-2.6-1.87.75A4.98 4.98 0 0 0 9 3.55V1.5H7v2.05c-.58.17-1.11.44-1.57.78L3.56 3.6l-1.5 2.6 1.56 1.22C3.53 7.4 3.5 7.7 3.5 8c0 .3.03.6.07.88L2 10.1l1.5 2.6 1.87-.75c.46.34.99.61 1.57.78v2.05h2v-2.05c.58-.17 1.11-.44 1.57-.78l1.87.75 1.5-2.6-1.56-1.22c.05-.28.07-.58.07-.88Z" stroke="currentColor" strokeWidth="1.3"/></svg>;
}
