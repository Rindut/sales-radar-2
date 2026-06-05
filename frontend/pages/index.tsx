import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, DashboardResponse, Lead } from "../lib/api";
import Sidebar from "../components/Sidebar";

const MOVE_ANIMATION_MS = 520;

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scoreBadgeStyle(score: number): { color: string; background: string } {
  if (score >= 85) return { color: "#16a34a", background: "#dcfce7" };
  if (score >= 70) return { color: "#F5A623", background: "#FFF3DC" };
  return { color: "#aaa", background: "#f3f4f6" };
}

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const { color, background } = scoreBadgeStyle(score);
  const sizeStyle = {
    sm: { fontSize: 13, padding: "3px 8px", borderRadius: 6 },
    md: { fontSize: 15, padding: "5px 12px", borderRadius: 8 },
    lg: {
      width: 56,
      height: 42,
      fontSize: 22,
      borderRadius: 9,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
  }[size];
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color, background, display: "inline-block", letterSpacing: "-0.5px", ...sizeStyle }}>
      {score}
    </span>
  );
}

function ScoreRibbon({ score }: { score: number }) {
  const { color, background } = scoreBadgeStyle(score);
  const foldBackground = score >= 85 ? "#b8e9c8" : score >= 70 ? "#f5d69c" : "#d9dee5";
  return (
    <div
      aria-label={`Score ${score}`}
      style={{
        position: "absolute",
        top: 16,
        left: -8,
        display: "flex",
        alignItems: "stretch",
        filter: "drop-shadow(0 4px 6px rgba(13,33,55,0.1))",
        zIndex: 1,
      }}
    >
      <span style={{
        position: "relative",
        background,
        color,
        padding: "4px 9px 4px 12px",
        borderRadius: "0 5px 5px 0",
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 0 rgba(13,33,55,0.04)",
      }}>
        Score {score}
        <span style={{
          position: "absolute",
          left: 0,
          bottom: -8,
          width: 8,
          height: 8,
          background: foldBackground,
          borderRadius: "0 0 0 7px",
          boxShadow: "inset -3px 2px 4px rgba(13,33,55,0.08)",
        }} />
      </span>
      <span style={{
        width: 0,
        height: 0,
        borderTop: "11px solid transparent",
        borderBottom: "11px solid transparent",
        borderLeft: `10px solid ${background}`,
      }} />
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function BookmarkIcon({ size = 14, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.75h10c.69 0 1.25.56 1.25 1.25v13.15c0 .74-.86 1.15-1.44.69L12 16l-4.81 3.84c-.58.46-1.44.05-1.44-.69V6c0-.69.56-1.25 1.25-1.25Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"active" | "saved" | "skipped">("active");
  const [movingLead, setMovingLead] = useState<{ id: string; direction: "toSaved" | "toResult" } | null>(null);

  const load = async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const result = await api.getTopLeads(refresh);
      setData(result);
      // Sync skipped state from DB - source of truth is backend
      const skippedIds = new Set(
        result.leads.filter(l => l.is_rejected).map(l => l.company.id)
      );
      const savedIds = new Set(
        result.leads.filter(l => l.is_saved && !l.is_rejected).map(l => l.company.id)
      );
      setSkipped(skippedIds);
      setSaved(savedIds);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleSkip = async (id: string) => {
    const isCurrentlySkipped = skipped.has(id);
    const wasSaved = saved.has(id);
    setSkipped(prev => {
      const next = new Set(prev);
      isCurrentlySkipped ? next.delete(id) : next.add(id);
      return next;
    });
    if (!isCurrentlySkipped) {
      setSaved(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    try {
      if (isCurrentlySkipped) {
        await api.unskipLead(id);
      } else {
        await api.skipLead(id);
      }
    } catch (e) {
      setSkipped(prev => {
        const next = new Set(prev);
        isCurrentlySkipped ? next.add(id) : next.delete(id);
        return next;
      });
      setSaved(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  const toggleSave = async (id: string) => {
    const isCurrentlySaved = saved.has(id);
    const wasSkipped = skipped.has(id);
    setMovingLead({ id, direction: isCurrentlySaved ? "toResult" : "toSaved" });
    await wait(MOVE_ANIMATION_MS);
    setSaved(prev => {
      const next = new Set(prev);
      isCurrentlySaved ? next.delete(id) : next.add(id);
      return next;
    });
    if (!isCurrentlySaved) {
      setSkipped(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    try {
      if (isCurrentlySaved) {
        await api.unsaveLead(id);
      } else {
        await api.saveLead(id);
      }
    } catch (e) {
      setSaved(prev => {
        const next = new Set(prev);
        isCurrentlySaved ? next.add(id) : next.delete(id);
        return next;
      });
      setSkipped(prev => {
        const next = new Set(prev);
        wasSkipped ? next.add(id) : next.delete(id);
        return next;
      });
    }
    setMovingLead(null);
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const activeLeads = data?.leads.filter(l => !skipped.has(l.company.id) && !saved.has(l.company.id)) ?? [];
  const savedLeads = data?.leads.filter(l => saved.has(l.company.id) && !skipped.has(l.company.id)) ?? [];
  const skippedLeads = data?.leads.filter(l => skipped.has(l.company.id)) ?? [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="dashboard" leadCount={data ? activeLeads.length : undefined} />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-dim)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent-text)" }}>
                Live · Last updated {timeStr}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-body)", fontSize: 32, fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1.1 }}>
                  Leads
                </h1>
              </div>
            </div>
          </div>

          {/* States */}
          {loading && (
            <div style={stateBox}>
              <div style={spinner} />
              <p style={{ color: "var(--text-3)", marginTop: 12, fontSize: 14 }}>Loading leads...</p>
            </div>
          )}
          {error && (
            <div style={{ ...stateBox, borderColor: "#ef4444", background: "#fef2f2" }}>
              <p style={{ color: "#ef4444", margin: 0 }}>⚠ {error}</p>
              <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>Make sure the backend is running: <code>uvicorn main:app --reload</code></p>
            </div>
          )}
          {!loading && !error && data?.leads.length === 0 && (
            <div style={stateBox}>
              <p style={{ color: "var(--text-2)" }}>No leads yet. Click "Generate Leads" to fetch from Apollo.</p>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <GenerateButton refreshing={refreshing} onClick={() => load(true)} />
              </div>
            </div>
          )}

          {!loading && !error && data && data.leads.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
                <LeadTabs
                  activeTab={activeTab}
                  counts={{
                    active: activeLeads.length,
                    saved: savedLeads.length,
                    skipped: skippedLeads.length,
                  }}
                  onChange={setActiveTab}
                />
                <GenerateButton refreshing={refreshing} onClick={() => load(true)} />
              </div>

              {activeTab === "active" && (
                activeLeads.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {activeLeads.map((lead) => (
                      <LeadCard
                        key={lead.company.id}
                        lead={lead}
                        isSkipped={false}
                        moveDirection={movingLead?.id === lead.company.id ? movingLead.direction : undefined}
                        onToggleSave={() => toggleSave(lead.company.id)}
                        onToggleSkip={() => toggleSkip(lead.company.id)}
                        onOutreach={() => router.push(`/leads/${lead.company.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyTabState label="No active leads." />
                )
              )}

              {activeTab === "saved" && (
                savedLeads.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {savedLeads.map((lead) => (
                      <LeadCard
                        key={lead.company.id}
                        lead={lead}
                        isSkipped={false}
                        isSaved
                        moveDirection={movingLead?.id === lead.company.id ? movingLead.direction : undefined}
                        onToggleSave={() => toggleSave(lead.company.id)}
                        onToggleSkip={() => toggleSkip(lead.company.id)}
                        onOutreach={() => router.push(`/leads/${lead.company.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyTabState label="No saved leads yet." />
                )
              )}

              {activeTab === "skipped" && (
                skippedLeads.length > 0 ? (
                  <LeadStatusList
                    leads={skippedLeads}
                    actionLabel="✕ skipped"
                    actionStyle="skipped"
                    onAction={(lead) => toggleSkip(lead.company.id)}
                    onOutreach={(lead) => router.push(`/leads/${lead.company.id}`)}
                  />
                ) : (
                  <EmptyTabState label="No skipped leads." />
                )
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

function LeadCard({ lead, isSkipped, isSaved = false, moveDirection, onToggleSave, onToggleSkip, onOutreach }: {
  lead: Lead;
  isSkipped: boolean;
  isSaved?: boolean;
  moveDirection?: "toSaved" | "toResult";
  onToggleSave: () => void;
  onToggleSkip: () => void;
  onOutreach: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [savedTooltipOpen, setSavedTooltipOpen] = useState(false);
  const score = Math.round(lead.score.total);
  const contact = lead.contacts?.[0];

  return (
    <div
      className="fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOutreach}
      style={{
        position: "relative",
        background: "var(--card)",
        border: `1px solid ${hovered ? "#a8c8e8" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "20px",
        boxShadow: hovered ? "var(--shadow-lg)" : "var(--shadow)",
        opacity: moveDirection ? 0 : 1,
        transition: `opacity ${MOVE_ANIMATION_MS}ms ease, transform ${MOVE_ANIMATION_MS}ms ease, box-shadow 0.18s ease, border-color 0.18s ease`,
        transform: moveDirection
          ? `translateX(${moveDirection === "toSaved" ? 90 : -90}px) translateY(-8px) scale(0.94)`
          : hovered ? "translateY(-1px)" : "none",
        filter: moveDirection ? "saturate(1.2)" : "none",
        cursor: "pointer",
      }}
    >
      <ScoreRibbon score={score} />
      <div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: -4, marginBottom: 20, minHeight: 26 }}>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <div
                role="button"
                tabIndex={0}
                aria-label={isSaved ? "Click here to unsave" : "Save lead"}
                onMouseEnter={() => isSaved && setSavedTooltipOpen(true)}
                onMouseLeave={() => setSavedTooltipOpen(false)}
                onFocus={() => isSaved && setSavedTooltipOpen(true)}
                onBlur={() => setSavedTooltipOpen(false)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSave();
                  }
                }}
                style={{
                  position: "relative",
                  flexShrink: 0, padding: "2px 8px", borderRadius: 6,
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 600,
                  border: "1px solid #86efac",
                  background: "#dcfce7",
                  color: "#16a34a",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onClick={e => { e.stopPropagation(); onToggleSave(); }}
              >
                <BookmarkIcon size={10} filled={isSaved} />
                {isSaved ? "Saved" : "Save"}
                {isSaved && savedTooltipOpen && (
                  <span
                    style={{
                      position: "absolute",
                      top: -34,
                      right: 0,
                      whiteSpace: "nowrap",
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "var(--text)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      boxShadow: "0 6px 18px rgba(13,33,55,0.18)",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    Click here to unsave
                  </span>
                )}
              </div>
              {!isSaved && (
                <button
                  onClick={e => { e.stopPropagation(); onToggleSkip(); }}
                  style={{
                    flexShrink: 0, padding: "2px 8px", borderRadius: 6,
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                    border: "1px solid var(--border)",
                    background: "var(--canvas-2)",
                    color: "var(--text-3)",
                    transition: "all 0.15s",
                  }}
                >
                  Skip
                </button>
              )}
            </div>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", color: "var(--text)", lineHeight: 1.2, margin: "0 0 4px" }}>
            {lead.company.name}
          </h3>

          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>
            {[
              lead.company.industry,
              lead.company.employee_count ? `${lead.company.employee_count.toLocaleString()}+ employees` : null,
              lead.company.location,
            ].filter(Boolean).join(" · ")}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {lead.score.reasoning.slice(0, 3).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <div style={{ marginTop: 5, width: 4, height: 4, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>

          {/* Contact row - fixed height, no wrapping */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32, paddingRight: 42 }}>
            {contact ? (
              <>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--canvas-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>
                  {getInitials(contact.name)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{contact.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {contact.role}
                    {lead.contacts.length > 1 && (
                      <span style={{ marginLeft: 6, color: "var(--accent-text)", fontWeight: 700, flexShrink: 0 }}>
                        +{lead.contacts.length - 1} contacts
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>No contact yet</span>
            )}
          </div>

          {/* Compact detail action. The whole card is clickable too. */}
          <button
            title="Open lead detail"
            aria-label="Open lead detail"
            onClick={e => { e.stopPropagation(); onOutreach(); }}
            style={{
              position: "absolute",
              right: 20,
              bottom: 20,
              border: "none",
              background: "transparent",
              color: "var(--accent-text)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 0",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "color 0.15s, transform 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.style.transform = "translateX(1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "var(--accent-text)";
              e.currentTarget.style.transform = "none";
            }}
          >
            View details →
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadTabs({ activeTab, counts, onChange }: {
  activeTab: "active" | "saved" | "skipped";
  counts: { active: number; saved: number; skipped: number };
  onChange: (tab: "active" | "saved" | "skipped") => void;
}) {
  const tabs: Array<{ id: "active" | "saved" | "skipped"; label: string }> = [
    { id: "active", label: "Result" },
    { id: "saved", label: "Saved" },
    { id: "skipped", label: "Skipped" },
  ];
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div style={{
      position: "relative",
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      width: 420,
      maxWidth: "100%",
      padding: 4,
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      boxShadow: "var(--shadow)",
      overflow: "hidden",
    }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 4,
          width: "calc((100% - 8px) / 3)",
          borderRadius: 8,
          background: "var(--accent)",
          boxShadow: "0 6px 16px rgba(29,142,222,0.22)",
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {tabs.map(tab => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              position: "relative", zIndex: 1,
              display: "flex", alignItems: "center", gap: 8,
              justifyContent: "center",
              padding: "8px 12px", borderRadius: 8, border: "none",
              background: "transparent",
              color: selected ? "#fff" : "var(--text-2)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "color 180ms ease",
            }}
          >
            {tab.label}
            <span style={{
              minWidth: 20, height: 20, padding: "0 6px", borderRadius: 20,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: selected ? "rgba(255,255,255,0.2)" : "var(--canvas-2)",
              color: selected ? "#fff" : "var(--text-2)",
              fontSize: 11, fontWeight: 800,
            }}>
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GenerateButton({ refreshing, onClick }: { refreshing: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={refreshing}
      style={{
        background: "#16a34a",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "10px 20px",
        fontSize: 13,
        fontWeight: 700,
        cursor: refreshing ? "not-allowed" : "pointer",
        flexShrink: 0,
        minHeight: 40,
        opacity: refreshing ? 0.72 : 1,
        boxShadow: "0 8px 18px rgba(22,163,74,0.18)",
        transition: "background 0.15s ease, opacity 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={e => {
        if (!refreshing) e.currentTarget.style.background = "#15803d";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "#16a34a";
      }}
    >
      {refreshing ? "Generating..." : "↻ Generate Leads"}
    </button>
  );
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div style={{ ...stateBox, padding: 32 }}>
      <p style={{ color: "var(--text-2)", margin: 0 }}>{label}</p>
    </div>
  );
}

function LeadStatusList({ leads, actionLabel, actionStyle, onAction, onOutreach }: {
  leads: Lead[];
  actionLabel: string;
  actionStyle: "saved" | "skipped";
  onAction: (lead: Lead) => void;
  onOutreach: (lead: Lead) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {leads.map((lead) => (
        <LeadStatusRow
          key={lead.company.id}
          lead={lead}
          actionLabel={actionLabel}
          actionStyle={actionStyle}
          onAction={() => onAction(lead)}
          onOutreach={() => onOutreach(lead)}
        />
      ))}
    </div>
  );
}

function LeadStatusRow({ lead, actionLabel, actionStyle, onAction, onOutreach }: {
  lead: Lead;
  actionLabel: string;
  actionStyle: "saved" | "skipped";
  onAction: () => void;
  onOutreach: () => void;
}) {
  const score = Math.round(lead.score.total);
  const contact = lead.contacts?.[0];
  const isSaved = actionStyle === "saved";

  return (
    <div
      onClick={onOutreach}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer", opacity: 0.55,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "0.55")}
    >
      {/* Score compact */}
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600,
        color: "#aaa", background: "var(--canvas-2)",
        padding: "3px 8px", borderRadius: 6, flexShrink: 0,
      }}>
        {score}
      </span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{lead.company.name}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
          {[lead.company.industry, contact ? `${contact.name} · ${contact.role}` : null].filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* Unskip button */}
      <button
        onClick={e => { e.stopPropagation(); onAction(); }}
        style={{
          flexShrink: 0, padding: "4px 10px", borderRadius: 6,
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          border: isSaved ? "1px solid #bbf7d0" : "1px solid #fecaca",
          background: isSaved ? "#dcfce7" : "#fee2e2",
          color: isSaved ? "#16a34a" : "#ef4444",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = isSaved ? "#bbf7d0" : "#fecaca"; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = isSaved ? "#dcfce7" : "#fee2e2"; }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

const stateBox: React.CSSProperties = {
  background: "var(--card)", border: "1px dashed var(--border)",
  borderRadius: 16, padding: 48, textAlign: "center",
};
const spinner: React.CSSProperties = {
  width: 32, height: 32, border: "3px solid var(--border)",
  borderTop: "3px solid var(--accent)", borderRadius: "50%",
  margin: "0 auto", animation: "spin 1s linear infinite",
};
