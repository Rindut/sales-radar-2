import { useState } from "react";
import Sidebar from "../components/Sidebar";

type Section = "how" | "icp" | "contacts" | "channels" | "industry" | "dos";

const NAV: { id: Section; label: string; icon: string }[] = [
  { id: "how",      label: "Cara Kerja",            icon: "⚙️" },
  { id: "icp",      label: "Setup ICP",             icon: "🎯" },
  { id: "contacts", label: "Prioritas Kontak",      icon: "👤" },
  { id: "channels", label: "Outreach per Channel",  icon: "📤" },
  { id: "industry", label: "Tips per Industri",     icon: "🏦" },
  { id: "dos",      label: "Do's & Don'ts",         icon: "✅" },
];

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "24px 28px",
      boxShadow: "var(--shadow)", marginBottom: 16, ...style,
    }}>
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", margin: "0 0 6px" }}>{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "16px 0 6px" }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 8px" }}>{children}</p>;
}

function Tag({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "orange" | "red" | "grey" }) {
  const colors = {
    blue:   { background: "#ddf0fc", color: "#1D8EDE" },
    green:  { background: "#dcfce7", color: "#16a34a" },
    orange: { background: "#FFF3DC", color: "#F5A623" },
    red:    { background: "#fee2e2", color: "#ef4444" },
    grey:   { background: "var(--canvas-2)", color: "var(--text-3)" },
  }[color];
  return (
    <span style={{ ...colors, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, display: "inline-block", marginRight: 4, marginBottom: 4 }}>
      {children}
    </span>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", background: "var(--accent)",
        color: "#fff", fontSize: 12, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
      }}>{n}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

function Bullet({ children, good }: { children: React.ReactNode; good?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
      <span style={{ fontSize: 13, flexShrink: 0, color: good ? "#16a34a" : good === false ? "#ef4444" : "var(--accent)" }}>
        {good === true ? "✓" : good === false ? "✕" : "•"}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────────

function SectionHow() {
  return (
    <div>
      <Card>
        <H2>Cara Kerja Sales Radar</H2>
        <P>Sales Radar otomatis mencari, menilai, dan menyiapkan outreach untuk B2B leads setiap hari. Ini alur kerjanya:</P>
        <div style={{ marginTop: 20 }}>
          <Step n={1} title="Data Source → Fetch Companies"
            desc="Sales Radar menarik data company dari beberapa sumber: Apollo.io (database B2B), website crawl, dan sumber lainnya yang aktif. Data source mana saja yang digunakan bisa dicek di Settings." />
          <Step n={2} title="ICP Filter → Screening Awal"
            desc="Company yang tidak cocok langsung dibuang. Yang masuk adalah yang sesuai kriteria industri, employee range, lokasi, dan kata kunci yang relevan." />
          <Step n={3} title="PRIORITY Engine → Scoring"
            desc="Setiap company diberi skor 0–100 berdasarkan framework PRIORITY: Pain, Relevance, Industry, Opportunity, Reach, ICP fit, Timing, YOY signal." />
          <Step n={4} title="Contact Resolver → Cari Orang"
            desc="Sales Radar mencari hingga 5 kontak per company dari data source yang aktif. Diprioritaskan berdasarkan relevansi jabatan (L&D, HR, Talent, CLO, dll)." />
          <Step n={5} title="OpenAI GPT-4o → Draft Pesan"
            desc="Outreach draft di-generate on-demand saat kamu klik 'Start Outreach'. Disesuaikan dengan company, kontak yang dipilih, dan channel (LinkedIn / Email)." />
        </div>
      </Card>

      <Card>
        <H2>Data Sources</H2>
        <P>Sales Radar mendukung beberapa sumber data untuk fetch leads. Setiap source punya kelebihan masing-masing.</P>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {[
            { name: "Apollo.io", desc: "Database B2B terbesar - company profile, kontak, industri, employee count, dan sinyal pertumbuhan.", tag: "Company + Contact" },
            { name: "Website Crawl", desc: "Sales Radar crawl website company untuk memperkaya konteks: produk, halaman karir, berita terbaru, dan kata kunci relevan.", tag: "Context Enrichment" },
            { name: "Manual Input", desc: "Tambahkan company secara manual langsung dari dashboard untuk leads di luar jangkauan database Apollo.", tag: "Custom" },
          ].map(({ name, desc, tag }) => (
            <div key={name} style={{ display: "flex", gap: 14, padding: "12px 14px", background: "var(--canvas-2)", borderRadius: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{name}</span>
                  <Tag color="grey">{tag}</Tag>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "10px 14px", background: "#ddf0fc", borderRadius: 8, fontSize: 13, color: "#1D8EDE", display: "flex", alignItems: "center", gap: 8 }}>
          Untuk melihat data source mana yang aktif, buka{" "}
          <a href="/settings" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline" }}>Settings →</a>
        </div>
      </Card>

      <Card>
        <H2>PRIORITY Score</H2>
        <P>Setiap company diberi skor berdasarkan 8 dimensi:</P>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {[
            ["P", "Pain",        "Seberapa besar kemungkinan mereka punya masalah yang Bawana bisa solve"],
            ["R", "Relevance",   "Seberapa relevan industri dan aktivitas mereka dengan LXP/training"],
            ["I", "Industry",    "Apakah industri ini termasuk target utama Bawana (banking, retail, dll)"],
            ["O", "Opportunity", "Potensi deal size berdasarkan ukuran dan profil perusahaan"],
            ["R", "Reach",       "Seberapa mudah kita bisa reach decision maker-nya"],
            ["I", "ICP fit",     "Seberapa match dengan Ideal Customer Profile yang sudah di-set"],
            ["T", "Timing",      "Sinyal timing: hiring, ekspansi, rebranding, perubahan leadership"],
            ["Y", "YOY signal",  "Pertumbuhan year-over-year yang menandakan company sedang scaling"],
          ].map(([letter, name, desc]) => (
            <div key={name} style={{ background: "var(--canvas-2)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{letter}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{name}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag color="green">85+ → High Priority</Tag>
          <Tag color="orange">70–84 → Medium</Tag>
          <Tag color="grey">{"<70"} → Low</Tag>
        </div>

        {/* Example cards */}
        <div style={{ marginTop: 20, marginBottom: 8, fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Contoh tampilan di menu Leads
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            {
              score: 91, label: "High Priority", scoreColor: "#16a34a", scoreBg: "#dcfce7",
              name: "Bank Central Asia", industry: "Banking · 10.000+ karyawan",
              reason: "Aktif hiring L&D Manager, ekspansi digital banking, sinyal training kuat.",
              borderColor: "#16a34a",
            },
            {
              score: 76, label: "Medium", scoreColor: "#F5A623", scoreBg: "#FFF3DC",
              name: "Matahari Department Store", industry: "Retail · 5.000+ karyawan",
              reason: "Industri relevan, tapi sinyal training belum kuat. Worth di-approach dengan angle onboarding.",
              borderColor: "#F5A623",
            },
            {
              score: 58, label: "Low", scoreColor: "#aaa", scoreBg: "var(--canvas-2)",
              name: "PT Sinar Mas Agro", industry: "Agriculture · 2.000+ karyawan",
              reason: "Industri kurang relevan untuk LXP. Kontak decision maker sulit ditemukan.",
              borderColor: "var(--border)",
            },
          ].map(({ score, label, scoreColor, scoreBg, name, industry, reason, borderColor }) => (
            <div key={label} style={{
              background: "var(--card)", border: `1px solid ${borderColor}`,
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700,
                  color: scoreColor, background: scoreBg,
                  padding: "4px 10px", borderRadius: 8, flexShrink: 0,
                }}>
                  {score}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", marginTop: 1 }}>{name}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 6 }}>{industry}</div>
              <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.6 }}>{reason}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SectionICP() {
  return (
    <div>
      <Card>
        <H2>Setup ICP yang Efektif</H2>
        <P>ICP (Ideal Customer Profile) adalah satu-satunya tempat kamu mengontrol siapa yang masuk ke dashboard. Salah setup = leads yang keluar tidak relevan.</P>
      </Card>

      <Card>
        <H3>Industries</H3>
        <P>Masukkan nama industri yang spesifik. Sales Radar akan match company berdasarkan field industri dari data source yang aktif.</P>
        <div style={{ marginTop: 8 }}>
          <Bullet>Banking · Financial Services · Insurance</Bullet>
          <Bullet>Retail · E-commerce</Bullet>
          <Bullet>Telecommunications · Technology</Bullet>
          <Bullet>Healthcare · Pharmaceuticals</Bullet>
        </div>
        <div style={{ marginTop: 8, padding: "10px 14px", background: "#fff3dc", borderRadius: 8, fontSize: 12, color: "#b45309" }}>
          ⚠️ Jangan terlalu narrow. Kalau hanya "Banking", kamu bisa kehilangan "Financial Services" yang sama relevannya.
        </div>
      </Card>

      <Card>
        <H3>Employee Range</H3>
        <P>Gunakan format range standar: <code style={{ background: "var(--canvas-2)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>1-10</code>, <code style={{ background: "var(--canvas-2)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>201-500</code>, <code style={{ background: "var(--canvas-2)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>1001-5000</code>.</P>
        <Bullet>Untuk enterprise banking: <strong>1001-5000</strong> atau <strong>5001-10000</strong></Bullet>
        <Bullet>Untuk mid-market: <strong>201-500</strong> atau <strong>501-1000</strong></Bullet>
      </Card>

      <Card>
        <H3>Keywords</H3>
        <P>Keywords digunakan untuk dua hal: (1) filter company description, (2) memperluas pencarian kontak yang relevan.</P>
        <div style={{ marginTop: 8 }}>
          <Bullet>Masukkan kata yang relate ke use case Bawana: <strong>learning, training, capability, talent development</strong></Bullet>
          <Bullet>Tambahkan kata yang describe problem: <strong>employee development, upskilling, onboarding</strong></Bullet>
          <Bullet>Hindari kata terlalu umum seperti "growth" atau "technology" - terlalu banyak false positive</Bullet>
        </div>
      </Card>

      <Card>
        <H3>Target Roles</H3>
        <P>Masukkan jabatan decision maker yang kamu cari. Sales Radar akan memprioritaskan kontak dengan jabatan ini.</P>
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <Tag color="blue">Chief Learning Officer</Tag>
          <Tag color="blue">Head of Learning</Tag>
          <Tag color="blue">Learning & Development Manager</Tag>
          <Tag color="blue">Talent Development</Tag>
          <Tag color="blue">HR Director</Tag>
          <Tag color="blue">Chief People Officer</Tag>
        </div>
        <P>Catatan: Sales Radar melakukan partial match, jadi "Learning" akan match "Learning & Development Manager", "Corporate Learning Specialist", dll.</P>
      </Card>
    </div>
  );
}

function SectionContacts() {
  return (
    <div>
      <Card>
        <H2>Memilih Kontak yang Tepat</H2>
        <P>Sales Radar menampilkan hingga 5 kontak per company, diurutkan berdasarkan relevansi jabatan. Ini cara membaca dan memilih yang benar.</P>
      </Card>

      <Card>
        <H3>Urutan Prioritas Jabatan</H3>
        <div style={{ marginTop: 8 }}>
          {[
            ["1st", "C-Level Learning", "CLO, Chief People Officer, Chief HR Officer", "green"],
            ["2nd", "Director/Head Level", "Head of Learning, Director of Talent, Learning Director", "blue"],
            ["3rd", "VP Level", "VP of HR, VP Learning & Development", "blue"],
            ["4th", "Manager Level", "L&D Manager, Training Manager, Capability Manager", "orange"],
            ["5th", "Specialist/Individual", "Learning Specialist, HR Business Partner", "grey"],
          ].map(([rank, title, example, color]) => (
            <div key={rank} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
              <Tag color={color as any}>{rank}</Tag>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{example}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <H3>Badge Data Kontak</H3>
        <P>Di halaman detail lead, setiap kontak menampilkan badge ketersediaan data:</P>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>✓ LinkedIn</span>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Bisa direct connect atau send InMail</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>✓ Email</span>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Bisa langsung kirim email dari Sales Radar</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ background: "var(--canvas-2)", color: "var(--text-3)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>✕ Phone</span>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Data tidak tersedia di data source</span>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#ddf0fc", borderRadius: 8, fontSize: 12, color: "#1D8EDE" }}>
          💡 Prioritaskan kontak yang punya email <strong>dan</strong> LinkedIn untuk opsi outreach paling fleksibel.
        </div>
      </Card>

      <Card>
        <H3>Kapan Ganti Kontak?</H3>
        <Bullet>Kontak pertama tidak punya email dan LinkedIn → pilih yang ke-2 atau ke-3</Bullet>
        <Bullet>Jabatan kontak pertama terlalu junior (Specialist) → cari yang level Manager ke atas</Bullet>
        <Bullet>Ada kontak dengan jabatan lebih spesifik ke L&D → itu biasanya lebih tepat sasaran</Bullet>
        <Bullet>Outreach ke kontak pertama tidak direspons → coba kontak alternatif di company yang sama</Bullet>
      </Card>
    </div>
  );
}

function SectionChannels() {
  return (
    <div>
      <Card>
        <H2>Outreach per Channel</H2>
        <P>Sales Radar mendukung dua channel: LinkedIn dan Email. Keduanya punya konteks dan tone yang berbeda.</P>
      </Card>

      <Card style={{ borderLeft: "3px solid #0a66c2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          <H2>LinkedIn</H2>
        </div>
        <P>Lebih personal, lebih hangat. Cocok untuk first touch ke C-level dan Director.</P>
        <H3>Best Practices</H3>
        <Bullet>Pesan LinkedIn max 300 karakter untuk yang belum connect - langsung ke point</Bullet>
        <Bullet>Kalau sudah connect, bisa lebih panjang (maks 600–800 karakter)</Bullet>
        <Bullet>Jangan langsung pitch produk di pesan pertama - bangun relevansi dulu</Bullet>
        <Bullet>Sebutkan konteks spesifik: industri mereka, jabatan mereka, atau sesuatu yang relevan</Bullet>
        <H3>Template Opening yang Efektif</H3>
        <div style={{ background: "var(--canvas-2)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, marginTop: 8 }}>
          "Halo [Nama], saya [Nama] dari Bawana - LXP platform yang bantu perusahaan [industri] dalam membangun sistem learning yang terstruktur. Kami baru-baru ini bantu [referensi industri] meningkatkan engagement training mereka. Boleh saya share sebentar?"
        </div>
      </Card>

      <Card style={{ borderLeft: "3px solid #1D8EDE" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D8EDE" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <H2>Email</H2>
        </div>
        <P>Lebih formal, cocok untuk follow-up atau pertama kali masuk ke mid-level manager. Bisa attach brief atau deck.</P>
        <H3>Best Practices</H3>
        <Bullet>Subject line harus spesifik - hindari generic seperti "Partnership Opportunity"</Bullet>
        <Bullet>Buka dengan pain point atau konteks industri mereka, bukan self-intro</Bullet>
        <Bullet>Paragraf pertama max 2 kalimat - kalau terlalu panjang, langsung di-delete</Bullet>
        <Bullet>CTA yang jelas di akhir: "Boleh saya set 20 menit call minggu ini?"</Bullet>
        <H3>Subject Line yang Convert</H3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {[
            "Cara [Bank X] tingkatkan completion rate training 40%",
            "Bawana untuk [Company] - solusi L&D yang scale",
            "Platform learning untuk tim [Company] yang terus berkembang",
          ].map(s => (
            <div key={s} style={{ background: "var(--canvas-2)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "var(--text-2)", fontStyle: "italic" }}>
              "{s}"
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <H3>Kapan Pakai Mana?</H3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
          <div style={{ background: "var(--canvas-2)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0a66c2", marginBottom: 6 }}>LinkedIn lebih baik jika:</div>
            <Bullet>Target adalah C-level atau VP</Bullet>
            <Bullet>Tidak punya email yang terverifikasi</Bullet>
            <Bullet>Ingin membangun koneksi jangka panjang</Bullet>
          </div>
          <div style={{ background: "var(--canvas-2)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1D8EDE", marginBottom: 6 }}>Email lebih baik jika:</div>
            <Bullet>Ada email terverifikasi dari data source</Bullet>
            <Bullet>Butuh kirim materi (deck, brief)</Bullet>
            <Bullet>Follow-up setelah LinkedIn tidak respons</Bullet>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionIndustry() {
  return (
    <div>
      <Card>
        <H2>Tips per Industri</H2>
        <P>Setiap industri punya buying behavior dan pain point yang berbeda. Sesuaikan tone dan framing outreach-mu.</P>
      </Card>

      {[
        {
          industri: "Banking & Financial Services",
          icon: "🏦",
          pain: "Regulatory training wajib (compliance, AML, KYC), onboarding cabang baru, produktivitas teller & relationship manager",
          hook: "Sebutkan kepatuhan regulasi OJK atau audit DSAK - ini trigger yang kuat untuk banking",
          tone: "Formal, data-driven, compliance-first",
          tags: ["Compliance Training", "OJK Ready", "Audit Trail"],
        },
        {
          industri: "Retail & E-commerce",
          icon: "🛍️",
          pain: "High turnover frontliner, onboarding cepat, standardisasi SOP di ratusan outlet",
          hook: "Fokus ke efisiensi onboarding dan konsistensi SOP - turnover tinggi berarti training cost tinggi",
          tone: "Praktis, visual, ROI-focused",
          tags: ["Onboarding", "SOP Digital", "Outlet Consistency"],
        },
        {
          industri: "Telecommunications",
          icon: "📡",
          pain: "Reskilling cepat karena teknologi berubah, developer & network engineer training, leadership pipeline",
          hook: "Fokus ke reskilling dan velocity belajar - industri telco berubah cepat, mereka tahu itu",
          tone: "Tech-forward, efisiensi-first",
          tags: ["Reskilling", "Tech Training", "Leadership Dev"],
        },
        {
          industri: "Healthcare & Pharma",
          icon: "🏥",
          pain: "Training tenaga medis yang terstandardisasi, certification tracking, onboarding dokter & apoteker baru",
          hook: "Standarisasi dan dokumentasi - penting banget untuk audit dan akreditasi JCI atau KARS",
          tone: "Profesional, akreditasi-aware, compliance-aware",
          tags: ["Certification", "Compliance", "Standardization"],
        },
      ].map(({ industri, icon, pain, hook, tone, tags }) => (
        <Card key={industri}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <H2>{industri}</H2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Pain Point Utama</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{pain}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Hook yang Efektif</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{hook}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Tone: <strong style={{ color: "var(--text-2)" }}>{tone}</strong></div>
            <div>{tags.map(t => <Tag key={t} color="blue">{t}</Tag>)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SectionDos() {
  return (
    <div>
      <Card>
        <H2>Do's & Don'ts</H2>
        <P>Panduan singkat supaya outreach dari Sales Radar terasa human, bukan robotic.</P>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card style={{ borderTop: "3px solid #16a34a" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", marginBottom: 14 }}>✓ DO</div>
          <Bullet good>Edit draft sebelum kirim - GPT-4o yang generate, kamu yang finalize</Bullet>
          <Bullet good>Tambahkan sentuhan personal: sebut nama kontak, jabatan, atau konteks spesifik company</Bullet>
          <Bullet good>Refresh leads minimal 2x seminggu supaya data tetap segar</Bullet>
          <Bullet good>Cek PRIORITY score sebelum outreach - fokus ke skor 80+ dulu</Bullet>
          <Bullet good>Skip lead yang sudah tidak relevan supaya dashboard tetap clean</Bullet>
          <Bullet good>Pilih kontak yang punya email + LinkedIn untuk reach rate lebih tinggi</Bullet>
          <Bullet good>Follow up 3–5 hari setelah outreach pertama jika tidak ada respons</Bullet>
        </Card>

        <Card style={{ borderTop: "3px solid #ef4444" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", marginBottom: 14 }}>✕ DON'T</div>
          <Bullet good={false}>Kirim draft GPT mentah tanpa diedit - kelihatan generic dan impersonal</Bullet>
          <Bullet good={false}>Reach out ke semua 10 leads sekaligus - prioritas dulu yang paling worth</Bullet>
          <Bullet good={false}>Gunakan template yang sama untuk semua industri - tone banking ≠ tone startup</Bullet>
          <Bullet good={false}>Terlalu agresif pitch di pesan pertama - ini cold outreach, bukan closing</Bullet>
          <Bullet good={false}>Abaikan kontak level Manager ke bawah - kadang mereka yang influence decision</Bullet>
          <Bullet good={false}>Lupa update ICP saat ada perubahan target segmen - leads jadi tidak relevan</Bullet>
          <Bullet good={false}>Mengirim email dari Sales Radar tanpa cek subject line - subject line = penentu open rate</Bullet>
        </Card>
      </div>

      <Card style={{ marginTop: 4 }}>
        <H3>Urutan Outreach yang Direkomendasikan</H3>
        <div style={{ marginTop: 8 }}>
          <Step n={1} title="Screen leads di dashboard"
            desc="Lihat skor, baca reasoning. Skip yang tidak relevan. Fokus ke 3–5 yang paling worth." />
          <Step n={2} title="Buka detail lead"
            desc="Baca company description, pilih kontak yang paling relevan (jabatan + data tersedia)." />
          <Step n={3} title="Generate outreach draft"
            desc="Pilih channel (LinkedIn atau Email), baca draft yang di-generate, edit sesuai konteks." />
          <Step n={4} title="Kirim & track"
            desc="Kirim dari Sales Radar (email) atau copy paste ke LinkedIn. Catat di CRM atau Notion." />
          <Step n={5} title="Follow up"
            desc="3–5 hari tidak respons → follow up singkat. Masih tidak respons → coba kontak berbeda di company yang sama." />
        </div>
      </Card>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export default function Playbook() {
  const [active, setActive] = useState<Section>("how");

  const ActiveSection = {
    how: SectionHow,
    icp: SectionICP,
    contacts: SectionContacts,
    channels: SectionChannels,
    industry: SectionIndustry,
    dos: SectionDos,
  }[active];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="playbook" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "var(--font-body)", fontSize: 32, fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", lineHeight: 1.1 }}>
              Playbook
            </h1>
            <p style={{ marginTop: 8, color: "var(--text-2)", fontSize: 15 }}>
              Panduan outreach dan strategi pendekatan - berdasarkan cara kerja Sales Radar yang sebenarnya.
            </p>
          </div>

          {/* Top tabs */}
          <div style={{
            display: "flex", gap: 4, flexWrap: "wrap",
            borderBottom: "2px solid var(--border)", marginBottom: 28,
          }}>
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  padding: "9px 18px", border: "none",
                  background: active === item.id ? "var(--accent)" : "transparent",
                  color: active === item.id ? "#fff" : "var(--text-3)",
                  fontWeight: active === item.id ? 700 : 400,
                  fontSize: 13, cursor: "pointer", borderRadius: "8px 8px 0 0",
                  borderBottom: active === item.id ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: "-2px",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <ActiveSection />

        </div>
      </main>
    </div>
  );
}
