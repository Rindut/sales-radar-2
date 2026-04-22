import { useState } from "react";
import Sidebar from "../components/Sidebar";

const COLS = [
  { id: "new",       label: "New Lead",    color: "#94a3b8" },
  { id: "contacted", label: "Contacted",   color: "#F5A623" },
  { id: "replied",   label: "Replied",     color: "#1D8EDE" },
  { id: "meeting",   label: "Meeting Set", color: "#8b5cf6" },
  { id: "closed",    label: "Closed Won",  color: "#00B4A0" },
];

const INIT_CARDS = [
  { id: 1, company: "PT Astra International", contact: "Dewi Rahayu",    role: "Head of People Dev", score: 94, col: "contacted", days: 2,  industry: "Automotive" },
  { id: 2, company: "Bank Central Asia",       contact: "Rina Kusumawati",role: "VP Human Capital",   score: 89, col: "replied",   days: 1,  industry: "Financial Services" },
  { id: 3, company: "Telkom Indonesia",        contact: "Budi Santoso",   role: "Director of HC",     score: 82, col: "new",       days: 0,  industry: "Telco" },
  { id: 4, company: "Gojek (GoTo Group)",      contact: "Sari Puspita",   role: "Head of L&D",        score: 77, col: "meeting",   days: 3,  industry: "Technology" },
  { id: 5, company: "Unilever Indonesia",      contact: "Maya Indrawati", role: "Talent Manager",     score: 71, col: "new",       days: 0,  industry: "FMCG" },
  { id: 6, company: "Pertamina",               contact: "Ahmad Fauzi",    role: "CHRO",               score: 66, col: "closed",    days: 14, industry: "Oil & Gas" },
  { id: 7, company: "Shopee Indonesia",        contact: "Lisa Tan",       role: "L&D Lead",           score: 63, col: "contacted", days: 5,  industry: "E-Commerce" },
];

type Card = typeof INIT_CARDS[0];

export default function Pipeline() {
  const [cards, setCards] = useState(INIT_CARDS);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [moving, setMoving] = useState<number | null>(null);

  const byCol = (col: string) => cards.filter(c => c.col === col);

  const moveCard = (id: number, dir: "fwd" | "bwd") => {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = COLS.findIndex(x => x.id === c.col);
      const next = dir === "fwd" ? Math.min(idx + 1, COLS.length - 1) : Math.max(idx - 1, 0);
      return { ...c, col: COLS[next].id, days: 0 };
    }));
    setMoving(id);
    setTimeout(() => setMoving(null), 500);
  };

  const totalClosed  = cards.filter(c => c.col === "closed").length;
  const totalMeeting = cards.filter(c => c.col === "meeting").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="pipeline" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ padding: "40px 28px 80px" }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px", color: "var(--text)" }}>Pipeline</h1>
            <p style={{ marginTop: 6, color: "var(--text-2)", fontSize: 15 }}>Track progress setiap lead dari first touch ke closed</p>
          </div>

          {/* Stats */}
          <div className="fade-up fade-up-1" style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { label: "Total Leads",  value: cards.length,   color: "var(--text)" },
              { label: "Meetings Set", value: totalMeeting,   color: "#8b5cf6" },
              { label: "Closed Won",   value: totalClosed,    color: "var(--accent)" },
              { label: "Conversion",   value: Math.round(totalClosed / cards.length * 100) + "%", color: "var(--accent)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 20px", minWidth: 120, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-3)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Kanban */}
          <div className="fade-up fade-up-2" style={{ display: "grid", gridTemplateColumns: `repeat(${COLS.length}, minmax(180px, 1fr))`, gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {COLS.map(col => (
              <div
                key={col.id}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDrop={e => {
                  e.preventDefault();
                  if (dragging !== null) {
                    setCards(prev => prev.map(c => c.id === dragging ? { ...c, col: col.id, days: 0 } : c));
                    setDragging(null); setDragOver(null);
                  }
                }}
                onDragLeave={() => setDragOver(null)}
                style={{ background: dragOver === col.id ? col.color + "18" : "transparent", borderRadius: 12, padding: 4, transition: "background 0.15s" }}
              >
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>{byCol(col.id).length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 80 }}>
                  {byCol(col.id).map(card => (
                    <PipelineCard
                      key={card.id}
                      card={card}
                      col={col}
                      isMoving={moving === card.id}
                      onDragStart={() => setDragging(card.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onMoveForward={() => moveCard(card.id, "fwd")}
                      onMoveBack={() => moveCard(card.id, "bwd")}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}

function PipelineCard({ card, col, isMoving, onDragStart, onDragEnd, onMoveForward, onMoveBack }: {
  card: Card; col: typeof COLS[0]; isMoving: boolean;
  onDragStart: () => void; onDragEnd: () => void;
  onMoveForward: () => void; onMoveBack: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const colIdx = COLS.findIndex(c => c.id === card.col);
  const { color: sc, bg: sb } = card.score >= 85
    ? { color: "#1D8EDE", bg: "#ddf0fc" }
    : card.score >= 70
    ? { color: "#F5A623", bg: "#FFF3DC" }
    : { color: "#7aaecb", bg: "var(--canvas-2)" };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)",
        border: `1px solid ${hovered ? "#a8c8e8" : "var(--border)"}`,
        borderLeft: `3px solid ${col.color}`,
        borderRadius: 10, padding: "12px 14px",
        boxShadow: hovered ? "var(--shadow-lg)" : "var(--shadow)",
        cursor: "grab", transition: "all 0.15s",
        opacity: isMoving ? 0.5 : 1,
        transform: isMoving ? "scale(0.97)" : hovered ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{card.company}</div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: sc, background: sb, padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>{card.score}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: card.days > 0 ? 8 : 10 }}>{card.contact} · {card.role}</div>

      {card.days > 0 && (
        <div style={{ fontSize: 10, color: card.days >= 5 ? "#ef4444" : "var(--text-3)", marginBottom: 8, fontWeight: 600 }}>
          {card.days >= 5 ? "⚠ " : ""}{card.days}h di stage ini
        </div>
      )}

      <div style={{ display: "flex", gap: 4, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}>
        {colIdx > 0 && (
          <button onClick={onMoveBack} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", fontSize: 10, fontWeight: 600, color: "var(--text-2)", cursor: "pointer" }}>← Back</button>
        )}
        {colIdx < COLS.length - 1 && (
          <button onClick={onMoveForward} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", background: col.color, fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Next →</button>
        )}
      </div>
    </div>
  );
}
