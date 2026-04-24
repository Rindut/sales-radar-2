import Sidebar from "../components/Sidebar";

export default function Playbook() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="playbook" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px 80px" }}>

          <div className="fade-up" style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px", color: "var(--text)" }}>Playbook</h1>
            <p style={{ marginTop: 6, color: "var(--text-2)", fontSize: 15 }}>Panduan outreach dan strategi pendekatan per segmen</p>
          </div>

          <div className="fade-up fade-up-1" style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: 40,
            boxShadow: "var(--shadow)", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Coming Soon</div>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
              Playbook akan berisi template outreach, objection handling,<br />
              dan best practices per industri.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
