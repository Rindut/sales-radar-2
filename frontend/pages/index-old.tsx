import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, DashboardResponse, Lead } from "../lib/api";
import Sidebar from "../components/Sidebar";

function scoreBadgeStyle(score: number): { color: string; background: string } {
  if (score >= 85) return { color: "#1D8EDE", background: "#ddf0fc" };
  if (score >= 70) return { color: "#F5A623", background: "#FFF3DC" };
  return { color: "#7aaecb", background: "#EBF5FD" };
}

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const { color, background } = scoreBadgeStyle(score);
  const sizeStyle = {
    sm: { fontSize: 13, padding: "3px 8px", borderRadius: 6 },
    md: { fontSize: 15, padding: "5px 12px", borderRadius: 8 },
    lg: { fontSize: 28, padding: "10px 20px", borderRadius: 12 },
  }[size];
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color, background, display: "inline-block", letterSpacing: "-0.5px", ...sizeStyle }}>
      {score}
    </span>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const load = async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const result = await api.getTopLeads(refresh);
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleReject = async (id: string) => {
    const isCurrentlyRejected = rejected.has(id);
    setRejected(prev => {
      const next = new Set(prev);
      isCurrentlyRejected ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (isCurrentlyRejected) {
        await api.unrejectLead(id);
      } else {
        await api.rejectLead(id);
      }
    } catch (e) {
      setRejected(prev => {
        const next = new Set(prev);
        isCurrentlyRejected ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const activeLeads = data?.leads.filter(l => !rejected.has(l.company.id)) ?? [];
  const rejectedLeads = data?.leads.filter(l => rejected.has(l.company.id)) ?? [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="dashboard" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-dim)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent-text)" }}>
                Live · Diperbarui {timeStr}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-body)", fontSize: 32, fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1.1 }}>
                  Leads
                </h1>
                <p style={{ marginTop: 8, color: "var(--text-2)", fontSize: 15 }}>
                  {data
                    ? `${activeLeads.length} aktif${rejectedLeads.length > 0 ? ` · ${rejectedLeads.length} rejected` : ""}`
                    : "10 company paling worth untuk di-approach hari ini"}
                </p>
              </div>
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                style={{
                  background: "var(--accent)", color: "#fff", border: "none",
                  borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {refreshing ? "Fetching..." : "↻ Refresh Leads"}
              </button>
            </div>
          </div>

          {/* States */}
          {loading && (
            <div style={stateBox}>
              <div style={spinner} />
              <p style={{ color: "var(--text-3)", marginTop: 12, fontSize: 14 }}>Memuat leads...</p>
            </div>
          )}
          {error && (
            <div style={{ ...stateBox, borderColor: "#ef4444", background: "#fef2f2" }}>
              <p style={{ color: "#ef4444", margin: 0 }}>⚠ {error}</p>
              <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>Pastikan backend berjalan: <code>uvicorn main:app --reload</code></p>
            </div>
          )}
          {!loading && !error && data?.leads.length === 0 && (
            <div style={stateBox}>
              <p style={{ color: "var(--text-2)" }}>Belum ada leads. Klik "Refresh Leads" untuk fetch dari Apollo.</p>
            </div>
          )}

          {/* Active leads — 2-column grid */}
          {!loading && activeLeads.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 40 }}>
              {activeLeads.map((lead) => (
                <LeadCard
                  key={lead.company.id}
                  lead={lead}
                  isRejected={false}
                  onToggleReject={() => toggleReject(lead.company.id)}
                  onOutreach={() => router.push(`/leads/${lead.company.id}`)}
                />
              ))}
            </div>
          )}

          {/* Rejected section */}
          {!loading && rejectedLeads.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Rejected
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>+{rejectedLeads.length} companies</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rejectedLeads.map((lead) => (
                  <RejectedRow
                    key={lead.company.id}
                    lead={lead}
                    onUnreject={() => toggleReject(lead.company.id)}
                    onOutreach={() => router.push(`/leads/${lead.company.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function LeadCard({ lead, isRejected, onToggleReject, onOutreach }: {
  lead: Lead;
  isRejected: boolean;
  onToggleReject: () => void;
  onOutreach: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const score = Math.round(lead.score.total);
  const contact = lead.contact;

  return (
    <div
      className="fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOutreach}
      style={{
        background: "var(--card)",
        border: `1px solid ${hovered ? "#a8c8e8" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "20px",
        boxShadow: hovered ? "var(--shadow-lg)" : "var(--shadow)",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-1px)" : "none",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <ScoreBadge score={score} size="lg" />
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--text-3)" }}>SCORE</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)", lineHeight: 1.2, margin: 0 }}>
              {lead.company.name}
            </h3>
            <button
              onClick={e => { e.stopPropagation(); onToggleReject(); }}
              style={{
                flexShrink: 0, padding: "2px 8px", borderRadius: 6,
                fontSize: 10, fontWeight: 600, cursor: "pointer",
                border: "1px solid var(--border)",
                background: "var(--canvas-2)",
                color: "var(--text-3)",
                transition: "all 0.15s",
              }}
            >
              Reject
            </button>
          </div>

          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>
            {[lead.company.industry, lead.company.employee_count ? `${lead.company.employee_count.toLocaleString()}+ karyawan` : null].filter(Boolean).join(" · ")}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {lead.score.reasoning.slice(0, 3).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <div style={{ marginTop: 5, width: 4, height: 4, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            {contact ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--canvas-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>
                  {getInitials(contact.name)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{contact.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)" }}>{contact.role}</div>
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>Belum ada kontak</span>
            )}

            <button
              onClick={e => { e.stopPropagation(); onOutreach(); }}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "none",
                background: "var(--accent)", color: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#0a6aad"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "var(--accent)"; }}
            >
              Start Outreach →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectedRow({ lead, onUnreject, onOutreach }: {
  lead: Lead;
  onUnreject: () => void;
  onOutreach: () => void;
}) {
  const score = Math.round(lead.score.total);
  const contact = lead.contact;

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

      {/* Unreject button */}
      <button
        onClick={e => { e.stopPropagation(); onUnreject(); }}
        style={{
          flexShrink: 0, padding: "4px 10px", borderRadius: 6,
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          border: "1px solid #fecaca", background: "#fee2e2", color: "#ef4444",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#fecaca"; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "#fee2e2"; }}
      >
        ✕ rejected
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
