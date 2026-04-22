import Sidebar from "../components/Sidebar";

export default function Playbook() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="playbook" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 8 }}>
              SALES RADAR 2.0
            </p>
            <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1.1, margin: "0 0 10px" }}>
              Sales Playbook
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-2)", margin: 0 }}>
              Panduan harian untuk sales team Bawana. Baca sekali, terapkan setiap hari.
            </p>
          </div>

          {/* Section 1: Apa itu Sales Radar */}
          <Section title="1. Apa Itu Sales Radar 2.0?" className="fade-up fade-up-1">
            <p style={prose}>
              Sales Radar 2.0 adalah mesin pencari leads otomatis. Setiap hari, sistem mengambil data dari Apollo.io,
              menyaring company yang sesuai ICP Bawana, menilai seberapa layak mereka di-approach, dan menyajikan
              10 leads terbaik langsung ke dashboard — tanpa perlu buka Apollo manual.
            </p>
            <InfoBox color="blue">
              <strong>Masalah yang diselesaikan:</strong> Sebelumnya sales menghabiskan 2–3 jam/hari untuk search,
              validasi, dan buat pesan dari nol. Sales Radar 2.0 otomatisasi seluruh proses itu.
              Sales tinggal fokus ke outreach dan follow-up.
            </InfoBox>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Komponen</Th>
                  <Th>Fungsi</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Discovery", "Ambil company dari Apollo.io berdasarkan ICP yang dikonfigurasi"],
                  ["ICP Filter", "Saring company tidak relevan (education, government, dll)"],
                  ["PRIORITY Score", "Nilai setiap company 0–100 berdasarkan 7 dimensi"],
                  ["Contact Resolver", "Cari nama & role contact person yang tepat"],
                  ["AI Outreach", "Generate draft pesan LinkedIn/Email/WhatsApp yang personal"],
                  ["Dashboard", "Tampilkan 10 leads terbaik dengan satu klik aksi"],
                ].map(([k, v], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--canvas-2)" }}>
                    <Td bold>{k}</Td>
                    <Td>{v}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Section 2: PRIORITY Score */}
          <Section title="2. Memahami PRIORITY Score" className="fade-up fade-up-2">
            <p style={prose}>
              Setiap lead punya score 0–100 yang dihitung otomatis dari 7 dimensi berbobot.
              Score ini panduan, bukan keputusan final — kamu yang tahu konteks terbaik.
            </p>
            <table style={table}>
              <thead>
                <tr>
                  <Th w={40}>Huruf</Th>
                  <Th w={160}>Dimensi</Th>
                  <Th w={60}>Bobot</Th>
                  <Th>Yang Dinilai</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["P", "Pain", "20%", "Seberapa besar kebutuhan learning di perusahaan ini"],
                  ["R", "Relevance", "20%", "Seberapa relevan offering Bawana untuk mereka"],
                  ["I", "Industry", "20%", "Apakah industri mereka masuk target prioritas Bawana"],
                  ["O", "Opportunity", "15%", "Potensi deal size berdasarkan jumlah karyawan"],
                  ["R", "Reach", "10%", "Seberapa mudah kita bisa contact mereka"],
                  ["I", "ICP Fit", "10%", "Seberapa dekat mereka dengan ICP yang dikonfigurasi"],
                  ["T", "Timing", "5%", "Signal kebutuhan saat ini (founded year, growth)"],
                ].map(([letter, dim, weight, desc], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--canvas-2)" }}>
                    <Td bold accent>{letter}</Td>
                    <Td bold>{dim}</Td>
                    <Td accent>{weight}</Td>
                    <Td>{desc}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
              {[
                { range: "85–100", level: "HIGH", color: "#1D8EDE", bg: "#ddf0fc", action: "Contact dalam 24 jam. Prioritas utama." },
                { range: "70–84", level: "MED", color: "#F5A623", bg: "#FFF3DC", action: "Worth approach minggu ini." },
                { range: "< 70", level: "LOW", color: "#9ca3af", bg: "#f3f4f6", action: "Pertimbangkan Skip kecuali ada signal kuat." },
              ].map(({ range, level, color, bg, action }) => (
                <div key={level} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color, background: bg, padding: "2px 8px", borderRadius: 6 }}>{range}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 0.5 }}>{level}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>{action}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Section 3: Daily Workflow */}
          <Section title="3. Daily Workflow — 30 Menit/Hari" className="fade-up fade-up-3">
            <p style={prose}>Rutinitas harian yang diharapkan dari setiap sales. Total waktu aktif: 25–35 menit.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {[
                { time: "08:00", title: "Buka Dashboard", desc: "Buka Sales Radar 2.0. Lihat 10 leads hari ini. Baca reasoning di tiap card sebelum melakukan apapun." },
                { time: "08:05", title: "Filter & Skip", desc: "Scan semua leads. Company yang tidak relevan atau sudah pernah di-contact tanpa response → klik Skip this lead. Slot kosong akan diisi lead baru saat Refresh." },
                { time: "08:10", title: "Pilih 3–5 Target", desc: "Dari leads aktif, pilih 3–5 yang paling worth untuk di-contact hari ini. Prioritaskan score tinggi dan relevansi industri." },
                { time: "08:15", title: "Generate & Kirim", desc: "Klik Start Outreach → pilih channel → Generate Draft. BACA draftnya dulu. Tambahkan personalisasi jika perlu. Copy dan kirim manual." },
                { time: "08:30", title: "Log Aktivitas", desc: "Catat siapa yang sudah di-contact di pipeline. Ini penting untuk tracking follow-up." },
              ].map(({ time, title, desc }, i) => (
                <div key={i} style={{ display: "flex", gap: 16, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ flexShrink: 0, paddingTop: 2 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--accent-text)", background: "var(--canvas-2)", padding: "2px 8px", borderRadius: 6 }}>{time}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Section 4: Outreach Guide */}
          <Section title="4. Panduan Outreach" className="fade-up fade-up-4">
            <h3 style={h3}>Channel Selection</h3>
            <table style={table}>
              <thead>
                <tr><Th w={100}>Channel</Th><Th>Gunakan Ketika</Th><Th>Tips</Th></tr>
              </thead>
              <tbody>
                {[
                  ["LinkedIn", "Contact aktif di LinkedIn, first touch, C-level/VP", "Max 300 karakter. Jangan pitch langsung. Fokus ke relevance."],
                  ["Email", "Ada email tersedia, industri formal (banking/insurance), follow-up setelah LinkedIn", "Subject spesifik. Body max 150 kata. Satu CTA saja."],
                  ["WhatsApp", "Ada nomor HP, kontak mid-level, sudah pernah berinteraksi sebelumnya", "Sangat singkat. Perkenalan + 1 kalimat relevansi + CTA."],
                ].map(([ch, when, tips], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--canvas-2)" }}>
                    <Td bold accent>{ch}</Td><Td>{when}</Td><Td>{tips}</Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ ...h3, marginTop: 24 }}>Cara Pakai AI Draft dengan Benar</h3>
            {[
              "Baca reasoning card terlebih dahulu — pahami kenapa lead ini dipilih",
              "Generate draft sesuai channel yang dipilih",
              "Cek apakah nama contact dan role-nya sudah benar",
              "Tambahkan 1–2 detail spesifik tentang company tersebut",
              "Hapus bagian yang terasa generik atau tidak relevan",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ color: "var(--accent-text)", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}

            <InfoBox color="red" style={{ marginTop: 16 }}>
              <strong>Jangan:</strong> Kirim draft tanpa dibaca · Copy-paste tanpa sesuaikan nama contact ·
              Pitch platform langsung di pesan pertama · Kirim ke semua 10 leads dalam satu hari tanpa seleksi
            </InfoBox>
          </Section>

          {/* Section 5: Skip Logic */}
          <Section title="5. Kapan Harus Skip Lead">
            <p style={prose}>
              Skip bukan membuang lead — ini signal ke sistem untuk mengisi slot tersebut dengan lead baru saat Refresh berikutnya.
              Lead yang di-skip tetap tersimpan di bagian bawah dashboard dan bisa di-restore kapan saja.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 10, letterSpacing: 0.5 }}>✓  ALASAN SKIP YANG VALID</div>
                {[
                  "Sudah di-contact, belum ada response setelah 2+ follow-up",
                  "Sudah menjadi klien Bawana aktif",
                  "Industry tidak relevan meski lolos filter",
                  "Company sedang dalam krisis atau restrukturisasi",
                  "Ada informasi internal bahwa bukan prospect yang baik",
                ].map((item, i) => <div key={i} style={{ fontSize: 12, color: "#166534", marginBottom: 6, lineHeight: 1.5 }}>• {item}</div>)}
              </div>
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 10, letterSpacing: 0.5 }}>✕  BUKAN ALASAN SKIP</div>
                {[
                  "Score rendah — score bukan keputusan final",
                  "Belum ada contact person — bisa dicari manual",
                  "Belum familiar dengan company — justru baca reasoning-nya",
                  "Malas atau tidak sempat hari ini",
                ].map((item, i) => <div key={i} style={{ fontSize: 12, color: "#991b1b", marginBottom: 6, lineHeight: 1.5 }}>• {item}</div>)}
              </div>
            </div>
          </Section>

          {/* Section 6: Do & Don't */}
          <Section title="6. Do's & Don'ts">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#166534", padding: "10px 16px" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>✓  DO</span>
              </div>
              <div style={{ background: "#991b1b", padding: "10px 16px" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>✕  DON'T</span>
              </div>
              {[
                ["Buka dashboard setiap pagi sebelum jam 09:00", "Biarkan leads menumpuk tanpa diproses"],
                ["Baca reasoning sebelum generate outreach", "Copy-paste AI draft tanpa membaca"],
                ["Personalisasi pesan dengan info spesifik company", "Kirim pesan yang sama ke semua leads"],
                ["Skip leads tidak relevan agar slot terisi baru", "Biarkan leads usang di dashboard"],
                ["Catat siapa yang sudah di-contact di pipeline", "Mengandalkan memori untuk follow-up"],
                ["Pilih channel yang tepat per contact", "Selalu LinkedIn untuk semua tanpa pertimbangan"],
                ["Follow-up 3–5 hari setelah first contact", "Kirim follow-up dalam 24 jam atau tidak sama sekali"],
              ].map(([good, bad], i) => (
                <>
                  <div key={`g${i}`} style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "#fff" : "#f0fdf4" }}>
                    <span style={{ fontSize: 12, color: "#166534", lineHeight: 1.5 }}>{good}</span>
                  </div>
                  <div key={`b${i}`} style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "#fff" : "#fef2f2" }}>
                    <span style={{ fontSize: 12, color: "#991b1b", lineHeight: 1.5 }}>{bad}</span>
                  </div>
                </>
              ))}
            </div>
          </Section>

          {/* Section 7: FAQ */}
          <Section title="7. FAQ">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Lead yang sama muncul terus. Kenapa?",
                 "Sistem cache leads per hari. Klik Refresh Leads untuk dapat leads baru. Jika ingin lead spesifik diganti, klik Skip → lalu Refresh — slot akan diisi lead baru."],
                ["Contact person tidak tersedia. Apa yang harus dilakukan?",
                 "Cari manual di LinkedIn: nama perusahaan + role target (contoh: 'BCA Head of Learning'). Alternatif: hubungi via LinkedIn company page atau email info@ perusahaan."],
                ["Score rendah tapi company-nya bagus. Tetap approach?",
                 "Ya. Score adalah panduan, bukan keputusan final. Kalau ada signal yang tidak tertangkap sistem, tetap proceed."],
                ["AI draft terasa generic. Cara improve?",
                 "Baca reasoning card lebih detail, tambahkan info spesifik company yang kamu tahu. Atau hubungi product team untuk update ICP dan Bawana context."],
                ["Kapan ICP perlu diubah?",
                 "Ketika leads yang muncul konsisten tidak relevan. Update langsung di halaman Settings, atau hubungi product team."],
                ["Sistem error / tidak bisa load leads.",
                 "Pastikan backend berjalan. Buka terminal, cek apakah uvicorn aktif. Hubungi product team jika error berlanjut."],
              ].map(([q, a], i) => (
                <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Q: {q}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>A: {a}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Section 8: Cheat Sheet */}
          <Section title="8. Quick Reference Cheat Sheet">
            <p style={{ ...prose, marginBottom: 16 }}>Simpan atau print halaman ini sebagai referensi harian.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Daily routine */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "var(--accent)", padding: "10px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>RUTINITAS HARIAN</span>
                </div>
                {["08:00 — Buka dashboard", "08:05 — Scan & skip yang tidak relevan", "08:10 — Pilih 3–5 target", "08:15 — Generate draft & kirim", "08:30 — Log aktivitas"].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 16px", borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "var(--canvas)" : "transparent" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-text)", minWidth: 16 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Outreach checklist */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "var(--accent)", padding: "10px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>OUTREACH CHECKLIST</span>
                </div>
                {["Sudah baca reasoning card", "Nama & role contact sudah dicek", "Draft sudah dibaca sebelum kirim", "Ada personalisasi minimal 1 detail", "Channel dipilih sesuai konteks", "Sudah dicatat di pipeline"].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 16px", borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "var(--canvas)" : "transparent" }}>
                    <span style={{ fontSize: 14, color: "var(--accent-text)" }}>☐</span>
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginTop: 40, fontStyle: "italic" }}>
            Bawana · Netpolitan · Sales Radar 2.0 Playbook v1.0 · April 2026
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "2px solid var(--accent)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoBox({ children, color = "blue", style: extraStyle }: { children: React.ReactNode; color?: "blue" | "red"; style?: React.CSSProperties }) {
  const colors = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
    red: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  };
  const c = colors[color];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: c.text, lineHeight: 1.6, marginTop: 12, ...extraStyle }}>
      {children}
    </div>
  );
}

function Th({ children, w }: { children: React.ReactNode; w?: number }) {
  return (
    <th style={{ background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "10px 14px", textAlign: "left", width: w ? w : undefined }}>
      {children}
    </th>
  );
}

function Td({ children, bold, accent }: { children: React.ReactNode; bold?: boolean; accent?: boolean }) {
  return (
    <td style={{ padding: "9px 14px", fontSize: 13, color: accent ? "var(--accent-text)" : "var(--text-2)", fontWeight: bold ? 600 : 400, lineHeight: 1.5, verticalAlign: "top" }}>
      {children}
    </td>
  );
}

const prose: React.CSSProperties = { fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 12px" };
const h3: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 10px" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", fontSize: 13 };
