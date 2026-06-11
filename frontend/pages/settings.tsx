import { useEffect, useState, useRef } from "react";
import { api, ICPConfig, SourceStatus } from "../lib/api";
import Sidebar from "../components/Sidebar";

const APOLLO_INDUSTRIES = [
  "accounting", "airlines/aviation", "alternative medicine", "animation",
  "apparel & fashion", "architecture & planning", "arts & crafts", "automotive",
  "banking", "biotechnology", "broadcast media", "building materials",
  "business supplies & equipment", "capital markets", "chemicals",
  "civic & social organization", "civil engineering", "computer & network security",
  "computer games", "computer hardware", "computer networking", "computer software",
  "construction", "consumer electronics", "consumer goods", "consumer services",
  "cosmetics", "dairy", "defense & space", "design", "e-learning",
  "education management", "electrical & electronic manufacturing", "entertainment",
  "environmental services", "events services", "executive office", "facilities services",
  "farming", "financial services", "fine art", "fishery", "food & beverages",
  "food production", "fund-raising", "furniture", "gambling & casinos",
  "glass, ceramics & concrete", "government administration", "government relations",
  "graphic design", "health, wellness & fitness", "higher education",
  "hospital & health care", "hospitality", "human resources", "import & export",
  "individual & family services", "industrial automation",
  "information technology & services", "insurance", "international affairs",
  "international trade & development", "internet", "investment banking",
  "investment management", "judiciary", "law enforcement", "law practice",
  "legal services", "legislative office", "leisure, travel & tourism", "libraries",
  "logistics & supply chain", "luxury goods & jewelry", "machinery",
  "management consulting", "maritime", "market research", "marketing & advertising",
  "mechanical or industrial engineering", "media production", "medical devices",
  "medical practice", "mental health care", "military", "mining & metals",
  "motion pictures & film", "museums & institutions", "music", "nanotechnology",
  "newspapers", "non-profit organization management", "oil & energy", "online media",
  "outsourcing/offshoring", "package/freight delivery", "packaging & containers",
  "paper & forest products", "performing arts", "pharmaceuticals", "philanthropy",
  "photography", "plastics", "political organization", "primary/secondary education",
  "printing", "professional training & coaching", "program development",
  "public policy", "public relations & communications", "public safety", "publishing",
  "railroad manufacture", "ranching", "real estate", "recreational facilities & services",
  "religious institutions", "renewables & environment", "research", "restaurants",
  "retail", "security & investigations", "semiconductors", "shipbuilding",
  "sporting goods", "sports", "staffing & recruiting", "supermarkets",
  "telecommunications", "textiles", "think tanks", "tobacco",
  "translation & localization", "transportation/trucking/railroad", "utilities",
  "venture capital & private equity", "veterinary", "warehousing", "wholesale",
  "wine & spirits", "wireless", "writing & editing",
];

const APOLLO_KEYWORDS = [
  "learning management system", "e-learning", "corporate training",
  "employee training", "learning & development", "talent development",
  "hr technology", "human resources", "performance management",
  "workforce development", "onboarding", "upskilling", "reskilling",
  "microlearning", "blended learning", "digital learning",
  "leadership development", "compliance training", "sales training",
  "training management", "knowledge management", "organizational development",
  "talent management", "succession planning", "employee engagement",
  "people development", "corporate academy", "learning experience platform",
  "lxp", "lms",
];

const COUNTRY_OPTIONS = [
  "Indonesia",
  "Singapore",
  "Malaysia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "India",
  "Australia",
  "United States",
  "United Kingdom",
  "Japan",
  "South Korea",
  "China",
  "Hong Kong",
  "Taiwan",
  "United Arab Emirates",
  "Saudi Arabia",
  "Germany",
  "France",
  "Netherlands",
];

export default function Settings() {
  const [config, setConfig] = useState<ICPConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sherlock, setSherlock] = useState<SourceStatus | null>(null);

  useEffect(() => {
    api.getICP()
      .then(setConfig)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    api.getSherlockSourceStatus().then(setSherlock).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateICP(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateList = (field: keyof ICPConfig, index: number, value: string) => {
    if (!config) return;
    const updated = [...(config[field] as string[])];
    updated[index] = value;
    setConfig({ ...config, [field]: updated });
  };

  const addItem = (field: keyof ICPConfig) => {
    if (!config) return;
    setConfig({ ...config, [field]: [...(config[field] as string[]), ""] });
  };

  const removeItem = (field: keyof ICPConfig, index: number) => {
    if (!config) return;
    setConfig({ ...config, [field]: (config[field] as string[]).filter((_, i) => i !== index) });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="settings" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 28px 80px" }}>

          <div className="fade-up" style={{ marginBottom: 36, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px", color: "var(--text)" }}>Settings</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: saved ? "#15803d" : "#16a34a",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.72 : 1,
                boxShadow: "0 8px 18px rgba(22,163,74,0.18)",
                transition: "background 0.15s ease, opacity 0.15s ease",
              }}
              onMouseEnter={e => {
                if (!saving && !saved) e.currentTarget.style.background = "#15803d";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = saved ? "#15803d" : "#16a34a";
              }}
            >
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
            </button>
          </div>

          {error && <p style={{ color: "#ef4444", marginBottom: 20, fontSize: 14 }}>⚠ {error}</p>}

          {/* ICP Config */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <div style={spinner} />
            </div>
          ) : config && (
            <Section className="fade-up fade-up-1" title="ICP Configuration" subtitle="Define the Ideal Customer Profile (ICP) for lead generation.">
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Industry - Apollo dropdown */}
                <SelectTagField
                  label="Target Industry"
                  hint="Select industry"
                  tags={config.industries}
                  options={APOLLO_INDUSTRIES}
                  onRemove={v => setConfig({ ...config, industries: config.industries.filter(x => x !== v) })}
                  onAdd={v => setConfig({ ...config, industries: config.industries.includes(v) ? config.industries : [...config.industries, v] })}
                />

                {/* Location - country dropdown */}
                <CountryDropdownField
                  label="Target Country"
                  hint="Select country"
                  tags={config.locations}
                  options={COUNTRY_OPTIONS}
                  onRemove={v => setConfig({ ...config, locations: config.locations.filter(x => x !== v) })}
                  onAdd={v => setConfig({ ...config, locations: config.locations.includes(v) ? config.locations : [...config.locations, v] })}
                />

                {/* Keywords - Apollo dropdown + custom */}
                <DropdownTagField
                  label="Keywords"
                  hint="Select or type an Apollo keyword"
                  tags={config.keywords}
                  options={APOLLO_KEYWORDS}
                  allowCustom
                  onRemove={v => setConfig({ ...config, keywords: config.keywords.filter(x => x !== v) })}
                  onAdd={v => setConfig({ ...config, keywords: config.keywords.includes(v) ? config.keywords : [...config.keywords, v] })}
                />

                {/* Target roles - free text */}
                <TagField
                  label="Target Roles"
                  hint="Example: Head of Learning, HR Director"
                  tags={config.target_roles}
                  onRemove={v => setConfig({ ...config, target_roles: config.target_roles.filter(x => x !== v) })}
                  onAdd={v => setConfig({ ...config, target_roles: config.target_roles.includes(v) ? config.target_roles : [...config.target_roles, v] })}
                />

                {/* Employee ranges */}
                <div>
                  <label style={labelStyle}>Employee Range</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {config.employee_ranges.map((range, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <input value={range} onChange={e => updateList("employee_ranges", i, e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Example: 500,50000" />
                        <button onClick={() => removeItem("employee_ranges", i)} style={removeBtnStyle}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => addItem("employee_ranges")} style={addBtnStyle}>+ Add Range</button>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Data Sources */}
          <Section className="fade-up fade-up-2" title="Data Sources" subtitle="Choose where leads are collected from">
            {[
              { label: "Apollo.io", desc: "Database company & contact global", status: "Connected", active: true, live: false },
              { label: "Website Crawl", desc: "Crawl career page & website update", status: "Active", active: true, live: false },
              { label: "LinkedIn", desc: "Signal hiring & activity LinkedIn", status: "Not connected", active: false, live: false },
              {
                label: sherlock?.label ?? "Sherlock",
                desc: sherlock
                  ? `${sherlock.desc} · ${sherlock.site_count ?? 0} sites`
                  : "Enrichment: public social profiles per contact",
                status: sherlock ? sherlock.status : "Checking...",
                active: sherlock?.active ?? false,
                live: true,
              },
            ].map(src => (
              <div key={src.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {src.label}
                    {src.live && (
                      <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, padding: "2px 6px", borderRadius: 4, background: "var(--accent-dim)", color: "var(--accent-text)", verticalAlign: "middle" }}>
                        Live
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{src.desc}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: src.active ? "#16a34a" : "var(--text-3)", fontWeight: 600 }}>{src.status}</div>
                </div>
                <Toggle value={src.active} onChange={() => {}} />
              </div>
            ))}
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12, lineHeight: 1.5 }}>
              Sherlock status reflects whether the tool is installed on the backend. It is an enrichment source (per-contact, manual), not a lead discovery source.
            </p>
          </Section>

          {/* System Status */}
          <Section className="fade-up fade-up-3" title="System Status" subtitle="Technical information for debugging">
            {[
              { label: "Apollo API", status: "OK", ping: "120ms" },
              { label: "AI Scoring Engine", status: "OK", ping: "280ms" },
              { label: "Database", status: "OK", ping: "-" },
              { label: "Last Refresh", status: "07:30 WIB", ping: "-" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.label}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {s.ping !== "-" && <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>{s.ping}</span>}
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.status === "OK" ? "var(--accent-text)" : "var(--text-2)" }}>{s.status}</span>
                </div>
              </div>
            ))}
          </Section>
        </div>
      </main>
    </div>
  );
}

// Searchable dropdown tag field - for Apollo-defined lists
function DropdownTagField({ label, hint, tags, options, onRemove, onAdd, allowCustom }: {
  label: string; hint: string; tags: string[]; options: string[];
  onRemove: (v: string) => void; onAdd: (v: string) => void;
  allowCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options
    .filter(o => !tags.includes(o))
    .filter(o => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "var(--canvas-2)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
            {t}
            <button onClick={() => onRemove(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
          </span>
        ))}
      </div>
      <div ref={ref} style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--canvas)" }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={hint}
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 13, color: "var(--text)" }}
          />
          <span style={{ color: "var(--text-3)", fontSize: 11 }}>▼</span>
        </div>
        {open && (filtered.length > 0 || (allowCustom && query.trim())) && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100,
            maxHeight: 220, overflowY: "auto",
          }}>
            {allowCustom && query.trim() && !options.includes(query.trim()) && (
              <div
                onClick={() => { onAdd(query.trim()); setQuery(""); setOpen(false); }}
                style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: "var(--accent-text)", fontStyle: "italic", borderBottom: "1px solid var(--border)" }}
              >
                + Add "{query.trim()}"
              </div>
            )}
            {filtered.slice(0, 8).map(o => (
              <div
                key={o}
                onClick={() => { onAdd(o); setQuery(""); setOpen(false); }}
                style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: "var(--text)", borderBottom: "1px solid var(--border)" }}
              >
                {o}
              </div>
            ))}
            {filtered.length > 8 && (
              <div style={{ padding: "8px 14px", fontSize: 12, color: "var(--text-3)" }}>
                +{filtered.length - 8} more - type to filter
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Fixed dropdown tag field - for controlled option lists
function SelectTagField({ label, hint, tags, options, onRemove, onAdd }: {
  label: string; hint: string; tags: string[]; options: string[];
  onRemove: (v: string) => void; onAdd: (v: string) => void;
}) {
  const availableOptions = options.filter(option => !tags.includes(option));

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "var(--canvas-2)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
            {t}
            <button onClick={() => onRemove(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
          </span>
        ))}
      </div>
      <select
        value=""
        onChange={e => {
          if (!e.target.value) return;
          onAdd(e.target.value);
        }}
        style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
      >
        <option value="" disabled>{availableOptions.length > 0 ? hint : "All options selected"}</option>
        {availableOptions.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

// Country dropdown tag field - fixed country options, no free text
function CountryDropdownField({ label, hint, tags, options, onRemove, onAdd }: {
  label: string; hint: string; tags: string[]; options: string[];
  onRemove: (v: string) => void; onAdd: (v: string) => void;
}) {
  const availableOptions = options.filter(option => !tags.includes(option));

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "var(--canvas-2)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
            {t}
            <button onClick={() => onRemove(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
          </span>
        ))}
      </div>
      <select
        value=""
        onChange={e => {
          if (!e.target.value) return;
          onAdd(e.target.value);
        }}
        style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
      >
        <option value="" disabled>{availableOptions.length > 0 ? hint : "All countries selected"}</option>
        {availableOptions.map(country => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>
    </div>
  );
}

// Free-text tag input - for locations, roles
function TagField({ label, hint, tags, onRemove, onAdd }: {
  label: string; hint: string; tags: string[];
  onRemove: (v: string) => void; onAdd: (v: string) => void;
}) {
  const [input, setInput] = useState("");
  const submit = () => { if (input.trim()) { onAdd(input.trim()); setInput(""); } };
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "var(--canvas-2)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
            {t}
            <button onClick={() => onRemove(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder={hint}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={submit} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children, className }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, marginBottom: 16, boxShadow: "var(--shadow)" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: value ? "var(--accent)" : "var(--canvas-2)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 8 };
const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--canvas)", fontSize: 13, color: "var(--text)", outline: "none" };
const removeBtnStyle: React.CSSProperties = { background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontSize: 13 };
const addBtnStyle: React.CSSProperties = { background: "transparent", border: "1.5px dashed var(--border)", color: "var(--accent-text)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const spinner: React.CSSProperties = { width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" };
