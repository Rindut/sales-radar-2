import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Page = "dashboard" | "pipeline" | "history" | "settings" | "playbook";

export default function Sidebar({ active, leadCount }: { active: Page; leadCount?: number }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [fallbackLeadCount, setFallbackLeadCount] = useState<number | null>(null);

  useEffect(() => {
    if (leadCount !== undefined) return;

    let cancelled = false;
    api.getTopLeads(false)
      .then(data => {
        if (cancelled) return;
        setFallbackLeadCount(data.leads.filter(lead => !lead.is_rejected).length);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [leadCount]);

  const resolvedLeadCount = leadCount ?? fallbackLeadCount;

  const nav: { id: Page; label: string; href: string; badge?: string; icon: JSX.Element }[] = [
    { id: "dashboard", label: "Leads",    href: "/",          badge: resolvedLeadCount === null ? undefined : String(resolvedLeadCount), icon: <TargetIcon /> },
    { id: "settings",  label: "Settings", href: "/settings",               icon: <SettingsIcon /> },
    { id: "playbook",  label: "Playbook", href: "/playbook",               icon: <PlaybookIcon /> },
  ];

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      background: "var(--sidebar-bg)",
      display: "flex", flexDirection: "column",
      padding: collapsed ? "28px 8px" : "28px 12px",
      flexShrink: 0, minHeight: "100vh",
      transition: "width 0.2s ease, padding 0.2s ease",
      overflow: "hidden",
    }}>
      <div>
        {/* Logo + collapse toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", padding: "0 8px 20px" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Sales Radar" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>SALES RADAR</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 500, letterSpacing: "0.5px" }}>by BAWANA</div>
              </div>
            </div>
          )}

          {collapsed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo.png" alt="Sales Radar" style={{ width: 28, height: 28, objectFit: "contain", marginBottom: 8 }} />
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6l4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
    </aside>
  );
}

function TargetIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>;
}
function PlaybookIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="1.5" width="9" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5h4M5 7.5h4M5 10h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11.5 4.5L13.5 8l-2 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.5"/><path d="M12.5 8c0-.3-.03-.6-.07-.88l1.56-1.22-1.5-2.6-1.87.75A4.98 4.98 0 0 0 9 3.55V1.5H7v2.05c-.58.17-1.11.44-1.57.78L3.56 3.6l-1.5 2.6 1.56 1.22C3.53 7.4 3.5 7.7 3.5 8c0 .3.03.6.07.88L2 10.1l1.5 2.6 1.87-.75c.46.34.99.61 1.57.78v2.05h2v-2.05c.58-.17 1.11-.44 1.57-.78l1.87.75 1.5-2.6-1.56-1.22c.05-.28.07-.58.07-.88Z" stroke="currentColor" strokeWidth="1.3"/></svg>;
}
