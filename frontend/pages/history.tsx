import { useState } from "react";
import Sidebar from "../components/Sidebar";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  meeting:     { label: "Meeting Set",  color: "#8b5cf6", bg: "#f3f0ff" },
  replied:     { label: "Replied",      color: "#1D8EDE", bg: "var(--accent-dim)" },
  sent:        { label: "Sent",         color: "#F5A623", bg: "#FFF3DC" },
  no_response: { label: "No Response",  color: "#94a3b8", bg: "var(--canvas-2)" },
};

const HISTORY = [
  { id: 1, company: "PT Astra International", contact: "Dewi Rahayu",     role: "Head of People Dev", channel: "LinkedIn", date: "21 Apr", status: "replied",     message: "Halo Dewi, saya perhatikan Astra sedang aktif membangun kapabilitas L&D tim..." },
  { id: 2, company: "Bank Central Asia",       contact: "Rina Kusumawati", role: "VP Human Capital",   channel: "LinkedIn", date: "20 Apr", status: "meeting",     message: "Halo Rina, melihat BCA Learning Institute yang terus berkembang..." },
  { id: 3, company: "Shopee Indonesia",        contact: "Lisa Tan",        role: "L&D Lead",           channel: "Email",    date: "19 Apr", status: "sent",        message: "Halo Lisa, saya lihat Shopee sedang agresif hiring di posisi L&D..." },
  { id: 4, company: "Grab Indonesia",          contact: "Nadia Putri",     role: "HR Director",        channel: "LinkedIn", date: "18 Apr", status: "no_response", message: "Halo Nadia, transformasi Grab menuju super app membutuhkan..." },
  { id: 5, company: "Pertamina",               contact: "Ahmad Fauzi",     role: "CHRO",               channel: "Email",    date: "17 Apr", status: "meeting",     message: "Halo Pak Ahmad, program digitalisasi Pertamina membuka peluang..." },
  { id: 6, company: "Bank Mandiri",            contact: "Hendra Wijaya",   role: "VP HC",              channel: "LinkedIn", date: "16 Apr", status: "no_response", message: "Halo Hendra, melihat transformasi digital Mandiri yang masif..." },
  { id: 7, company: "Gojek (GoTo Group)",      contact: "Sari Puspita",    role: "Head of L&D",        channel: "LinkedIn", date: "15 Apr", status: "replied",     message: "Halo Sari, selamat bergabung di GoTo! Fase awal seperti ini..." },
  { id: 8, company: "Unilever Indonesia",      contact: "Maya Indrawati",  role: "Talent Manager",     channel: "Email",    date: "14 Apr", status: "sent",        message: "Halo Maya, global mandate Unilever untuk 100% karyawan upskilling..." },
];

export default function OutreachHistory() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const counts = {
    meeting:     HISTORY.filter(h => h.status === "meeting").length,
    replied:     HISTORY.filter(h => h.status === "replied").length,
    sent:        HISTORY.filter(h => h.status === "sent").length,
    no_response: HISTORY.filter(h => h.status === "no_response").length,
  };
  const replyRate = Math.round((counts.meeting + counts.replied) / HISTORY.length * 100);
  const filtered = filter === "all" ? HISTORY : HISTORY.filter(h => h.status === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="history" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px", color: "var(--text)" }}>Outreach History</h1>
            <p style={{ marginTop: 6, color: "var(--text-2)", fontSize: 15 }}>Semua outreach yang sudah dikirim dan statusnya</p>
          </div>

          {/* Stats */}
          <div className="fade-up fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Total Sent",  value: HISTORY.length,    accent: false },
              { label: "Reply Rate",  value: replyRate + "%",    accent: true },
              { label: "Meetings",    value: counts.meeting,     accent: false },
              { label: "No Response", value: counts.no_response, accent: false },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-3)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.accent ? "var(--accent)" : "var(--text)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="fade-up fade-up-2" style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              ["all",         "Semua"],
              ["meeting",     "Meeting"],
              ["replied",     "Replied"],
              ["sent",        "Sent"],
              ["no_response", "No Response"],
            ].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  border: `1px solid ${filter === val ? "var(--accent)" : "var(--border)"}`,
                  background: filter === val ? "var(--accent)" : "transparent",
                  color: filter === val ? "#fff" : "var(--text-2)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {lbl}
                {val !== "all" && <span style={{ opacity: 0.7 }}> · {counts[val as keyof typeof counts]}</span>}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="fade-up fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(item => {
              const meta = STATUS_META[item.status];
              const isOpen = expanded === item.id;
              return (
                <div
                  key={item.id}
                  style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow)", transition: "border-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#a8c8e8")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {/* Row */}
                  <div
                    style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: item.channel === "LinkedIn" ? "#e8f0fe" : "var(--amber-dim)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700,
                      color: item.channel === "LinkedIn" ? "#1a73e8" : "#92400e",
                    }}>
                      {item.channel === "LinkedIn" ? "LI" : "@"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{item.company}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: meta.bg, padding: "2px 8px", borderRadius: 20 }}>{meta.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{item.contact} · {item.role}</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{item.date}</span>
                      <span style={{ fontSize: 10, color: "var(--text-3)", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </span>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px", background: "var(--canvas)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-3)", marginBottom: 8 }}>Pesan yang dikirim</div>
                      <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, background: "var(--card)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border)", fontStyle: "italic" }}>
                        "{item.message}…"
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        {(item.status === "replied" || item.status === "meeting") ? (
                          <button style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Lihat Reply</button>
                        ) : (
                          <button style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--text)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Follow Up</button>
                        )}
                        <button style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View Lead</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
