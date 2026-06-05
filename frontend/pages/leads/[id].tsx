import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, Lead, OutreachDraft, OutreachEvent, SendEmailRequest } from "../../lib/api";
import Sidebar from "../../components/Sidebar";

function scoreBadgeStyle(score: number): { color: string; background: string } {
  if (score >= 85) return { color: "#16a34a", background: "#dcfce7" };
  if (score >= 70) return { color: "#F5A623", background: "#FFF3DC" };
  return { color: "#aaa", background: "#f3f4f6" };
}

function ScoreBadge({ score, size = "md" }: { score: number; size?: "md" | "xl" }) {
  const { color, background } = scoreBadgeStyle(score);
  const sizeStyle = size === "xl"
    ? { fontSize: 48, padding: "14px 28px", borderRadius: 16 }
    : { fontSize: 15, padding: "5px 12px", borderRadius: 8 };
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color, background, display: "inline-block", letterSpacing: "-0.5px", ...sizeStyle }}>
      {score}
    </span>
  );
}

function LinkedInIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M1.5 2.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM1.5 5H3.5V12.5H1.5V5ZM5 5h2v1.02C7.35 5.37 8.05 5 9 5c1.93 0 3 1.2 3 3.2V12.5H10V8.5C10 7.4 9.55 7 8.75 7 7.9 7 7.5 7.5 7.5 8.5V12.5H5.5V5H5Z"/></svg>;
}
function CopyIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 9.5V2.5A1 1 0 0 1 3 1.5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
function EmailIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 4l6 4.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
function WhatsAppIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0C3.13 0 0 3.13 0 7c0 1.23.33 2.4.9 3.4L0 14l3.7-.87A6.96 6.96 0 0 0 7 14c3.87 0 7-3.13 7-7s-3.13-7-7-7Zm3.45 9.7c-.15.42-.87.8-1.2.85-.3.04-.68.06-1.1-.07a9.8 9.8 0 0 1-1-.37C6.1 9.48 5.1 8.3 5 8.16c-.1-.14-.8-1.06-.8-2.02 0-.96.5-1.43.68-1.63.18-.2.4-.25.53-.25h.38c.12 0 .29-.05.45.34l.58 1.4c.05.1.08.22.02.35l-.22.32-.3.32c-.1.1-.2.2-.09.4.12.2.52.86 1.12 1.4.77.68 1.42.9 1.62 1 .2.1.32.08.44-.05l.5-.6c.13-.16.25-.13.42-.08l1.3.62c.15.07.25.1.29.17.04.07.04.4-.1.82Z"/></svg>;
}

interface HistoryEntry {
  id: string;
  type: "outreach" | "note";
  channel?: string;
  contact?: string;
  status?: "sent" | "replied" | "no_response";
  note?: string;
  date: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  sent:        { label: "Sent",        color: "#1D8EDE", bg: "#ddf0fc" },
  opened:      { label: "Opened",      color: "#1D8EDE", bg: "#ddf0fc" },
  copied:      { label: "Copied",      color: "#1D8EDE", bg: "#ddf0fc" },
  replied:     { label: "Replied",     color: "#16a34a", bg: "#dcfce7" },
  no_response: { label: "No Response", color: "#d97706", bg: "#fef3c7" },
};

function getHistory(companyId: string): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(`history_${companyId}`) || "[]"); }
  catch { return []; }
}

function saveHistory(companyId: string, entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`history_${companyId}`, JSON.stringify(entries));
}

function formatHistoryDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function eventToHistoryEntry(event: OutreachEvent): HistoryEntry {
  return {
    id: event.id,
    type: event.event_type === "note" ? "note" : "outreach",
    channel: event.channel,
    contact: event.channel === "email"
      ? event.recipient || event.contact_name || undefined
      : event.contact_name || event.recipient || undefined,
    status: event.status as HistoryEntry["status"],
    note: event.note || undefined,
    date: formatHistoryDate(event.created_at),
  };
}

function isIndonesiaLead(lead: Lead) {
  const location = lead.company.location?.toLowerCase() ?? "";
  return !location || location.includes("indonesia");
}

export default function LeadDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [outreach, setOutreach] = useState<OutreachDraft | null>(null);
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [channel, setChannel] = useState<"linkedin" | "email" | "whatsapp">("linkedin");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [leadActionLoading, setLeadActionLoading] = useState<"save" | "skip" | null>(null);
  const [leadActionError, setLeadActionError] = useState<string | null>(null);

  // Email send state
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  // Selected contact index (for multi-contact support)
  const [selectedContactIdx, setSelectedContactIdx] = useState(0);

  // Outreach History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadLeadAndHistory = async () => {
      try {
        const companyId = id as string;
        const [leadDetail, historyEvents] = await Promise.all([
          api.getLeadDetail(companyId),
          api.getOutreachHistory(companyId).catch(() => []),
        ]);
        if (cancelled) return;
        setLead(leadDetail);
        setIsSaved(Boolean(leadDetail.is_saved && !leadDetail.is_rejected));
        setIsSkipped(Boolean(leadDetail.is_rejected));
        if (leadDetail.contacts?.[0]?.email) setEmailTo(leadDetail.contacts[0].email ?? "");

        const legacyHistory = getHistory(companyId);
        if (historyEvents.length === 0 && legacyHistory.length > 0) {
          const migrated: HistoryEntry[] = [];
          for (const entry of legacyHistory) {
            try {
              const created = await api.createOutreachEvent(companyId, {
                event_type: entry.type,
                channel: entry.channel,
                recipient: entry.contact,
                status: entry.status,
                note: entry.note,
                metadata: { migrated_from_local_storage: true, original_date: entry.date },
              });
              migrated.push(eventToHistoryEntry(created));
            } catch {
              migrated.push(entry);
            }
          }
          if (!cancelled) setHistory(migrated);
        } else {
          setHistory(historyEvents.map(eventToHistoryEntry));
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLeadAndHistory();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id || !lead) return;
    const selected = lead.contacts?.[selectedContactIdx] ?? lead.contacts?.[0];
    setEmailTo(selected?.email ?? "");
    setOutreach(null); setSubject(""); setDraft("");
    setOutreachLoading(true);
    api.generateOutreach(id as string, channel, selected?.name ?? undefined, selected?.role ?? undefined)
      .then(d => { setOutreach(d); setSubject(d.subject ?? ""); setDraft(d.message); })
      .catch((e: any) => setError(e.message))
      .finally(() => setOutreachLoading(false));
  }, [id, channel, selectedContactIdx, lead]);

  const refreshHistory = async (companyId: string) => {
    const events = await api.getOutreachHistory(companyId);
    setHistory(events.map(eventToHistoryEntry));
  };

  const recordOutreachEvent = async (status: "opened" | "copied", overrideChannel?: "linkedin" | "whatsapp" | "email") => {
    if (!id || !lead) return;
    const selected = lead.contacts?.[selectedContactIdx] ?? lead.contacts?.[0];
    const eventChannel = overrideChannel || channel;
    const event = await api.createOutreachEvent(id as string, {
      event_type: "outreach",
      channel: eventChannel,
      contact_name: selected?.name,
      contact_role: selected?.role,
      recipient: eventChannel === "whatsapp"
        ? selected?.phone
        : eventChannel === "linkedin"
          ? selected?.linkedin_url
          : undefined,
      subject: subject || undefined,
      message: draft || undefined,
      status,
    });
    setHistory(prev => [eventToHistoryEntry(event), ...prev]);
  };

  const handleCopy = () => {
    const text = subject ? `Subject: ${subject}\n\n${draft}` : draft;
    navigator.clipboard.writeText(text).catch(() => {});
    recordOutreachEvent("copied").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSave = async () => {
    if (!id || leadActionLoading) return;
    const nextSaved = !isSaved;
    const previousSaved = isSaved;
    const previousSkipped = isSkipped;
    setLeadActionLoading("save");
    setLeadActionError(null);
    setIsSaved(nextSaved);
    if (nextSaved) setIsSkipped(false);
    try {
      if (nextSaved) {
        await api.saveLead(id as string);
      } else {
        await api.unsaveLead(id as string);
      }
    } catch (e: any) {
      setIsSaved(previousSaved);
      setIsSkipped(previousSkipped);
      setLeadActionError(e.message);
    } finally {
      setLeadActionLoading(null);
    }
  };

  const handleToggleSkip = async () => {
    if (!id || leadActionLoading) return;
    const nextSkipped = !isSkipped;
    const previousSaved = isSaved;
    const previousSkipped = isSkipped;
    setLeadActionLoading("skip");
    setLeadActionError(null);
    setIsSkipped(nextSkipped);
    if (nextSkipped) setIsSaved(false);
    try {
      if (nextSkipped) {
        await api.skipLead(id as string);
      } else {
        await api.unskipLead(id as string);
      }
    } catch (e: any) {
      setIsSaved(previousSaved);
      setIsSkipped(previousSkipped);
      setLeadActionError(e.message);
    } finally {
      setLeadActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!lead || !emailTo || !draft) return;
    const selected = lead.contacts?.[selectedContactIdx] ?? lead.contacts?.[0];
    setEmailSending(true);
    setEmailError(null);
    try {
      const payload: SendEmailRequest = {
        company_id: id as string,
        to_email: emailTo,
        subject: subject || (isIndonesiaLead(lead)
          ? `Perkenalan dari Bawana - ${lead.company.name}`
          : `Introduction from Bawana - ${lead.company.name}`),
        message: draft,
        company_name: lead.company.name,
        contact_name: selected?.name,
        contact_role: selected?.role,
      };
      await api.sendEmail(payload);
      setEmailSent(true);
      setShowEmailInput(false);
      await refreshHistory(id as string);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (e: any) {
      setEmailError(e.message);
    } finally {
      setEmailSending(false);
    }
  };

  const addNote = async () => {
    if (!id || !noteInput.trim()) return;
    const note = noteInput.trim();
    setNoteInput("");
    try {
      const event = await api.createOutreachEvent(id as string, {
        event_type: "note",
        note,
      });
      setHistory(prev => [eventToHistoryEntry(event), ...prev]);
    } catch (e: any) {
      setNoteInput(note);
      setError(e.message);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!id) return;
    const previous = history;
    const updated = history.filter(h => h.id !== entryId);
    setHistory(updated);
    try {
      await api.deleteOutreachEvent(id as string, entryId);
    } catch (e: any) {
      setHistory(previous);
      setError(e.message);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="dashboard" />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
        <div style={spinner} />
      </main>
    </div>
  );
  if (error) return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="dashboard" />
      <main style={{ flex: 1, padding: 40, background: "var(--canvas)" }}>
        <p style={{ color: "#ef4444" }}>⚠ {error}</p>
      </main>
    </div>
  );
  if (!lead) return null;

  const score = Math.round(lead.score.total);
  const contacts = lead.contacts ?? [];
  const contact = contacts[selectedContactIdx] ?? contacts[0] ?? null;
  const contactWarning = lead.contact_warning || contacts.find(c => c.enrichment_warning)?.enrichment_warning || null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="dashboard" />
      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px 80px" }}>

          {/* Back */}
          <button onClick={() => router.push("/")} className="fade-up"
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, background: "none", border: "none", color: "var(--text-2)", fontSize: 13, fontWeight: 500, padding: 0, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            Back to Leads
          </button>

          {/* Header card */}
          <div className="fade-up" style={{ background: "var(--sidebar-bg)", borderRadius: 16, padding: "28px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)" }} />
            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.10)" }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>Lead Detail</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.1, marginBottom: 6 }}>{lead.company.name}</h1>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                  {[lead.company.industry, lead.company.employee_count ? `${lead.company.employee_count.toLocaleString()}+ employees` : null, lead.company.location].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <ScoreBadge score={score} size="xl" />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>PRIORITY SCORE</span>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={handleToggleSave}
                    disabled={leadActionLoading !== null}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid #86efac",
                      background: isSaved ? "#dcfce7" : "rgba(220,252,231,0.92)",
                      color: "#16a34a",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: leadActionLoading ? "not-allowed" : "pointer",
                      opacity: leadActionLoading ? 0.72 : 1,
                    }}
                  >
                    {leadActionLoading === "save" ? "Saving..." : isSaved ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={handleToggleSkip}
                    disabled={leadActionLoading !== null}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: isSkipped ? "1px solid #fecaca" : "1px solid rgba(255,255,255,0.28)",
                      background: isSkipped ? "#fee2e2" : "rgba(255,255,255,0.14)",
                      color: isSkipped ? "#ef4444" : "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: leadActionLoading ? "not-allowed" : "pointer",
                      opacity: leadActionLoading ? 0.72 : 1,
                    }}
                  >
                    {leadActionLoading === "skip" ? "Updating..." : isSkipped ? "Skipped" : "Skip"}
                  </button>
                </div>
                {leadActionError && (
                  <span style={{ maxWidth: 220, fontSize: 11, color: "#fee2e2", textAlign: "right", lineHeight: 1.4 }}>
                    ⚠ {leadActionError}
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              {lead.company.website && (
                <a href={lead.company.website} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 13, fontWeight: 600, background: "transparent", textDecoration: "none" }}>
                  🌐 Website
                </a>
              )}
              {lead.company.linkedin_url && (
                <a href={lead.company.linkedin_url} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: "#0077b5", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <LinkedInIcon /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Why This Company */}
          <Section className="fade-up fade-up-1" title="Why This Company" subtitle="Why the system selected this company">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lead.score.reasoning.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}>
                  <div style={{ marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: i === 0 ? "var(--accent)" : "var(--text-3)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: i === 0 ? "var(--accent-text)" : "var(--text)", lineHeight: 1.5, fontWeight: i === 0 ? 600 : 400 }}>{r}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Contact Persons */}
          {(contacts.length > 0 || contactWarning) && (
            <Section className="fade-up fade-up-3"
              title={`Contact Person${contacts.length > 1 ? ` (${contacts.length} found)` : ""}`}
              subtitle={contacts.length > 1 ? "Choose the contact to use for outreach" : undefined}
            >
              {contactWarning && (
                <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #f59e0b", background: "#fffbeb", color: "#92400e", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                  ⚠ {contactWarning}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {contacts.map((c, idx) => {
                  const isSelected = idx === selectedContactIdx;
                  const initials = (c.name || "?").split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();
                  return (
                    <div
                      key={idx}
                      onClick={() => { setSelectedContactIdx(idx); if (c.email) setEmailTo(c.email); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        flexWrap: "wrap", gap: 12, padding: "12px 14px", borderRadius: 10,
                        border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        background: isSelected ? "var(--accent-dim)" : "var(--canvas)",
                        cursor: contacts.length > 1 ? "pointer" : "default",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? "var(--accent)" : "var(--canvas-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: isSelected ? "#fff" : "var(--text-2)", flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                            {c.name || "-"}
                            {isSelected && contacts.length > 1 && (
                              <span style={{ marginLeft: 8, fontSize: 10, background: "var(--accent)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 600, verticalAlign: "middle" }}>
                                SELECTED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{c.role || "-"}</div>
                          {/* Data availability badges */}
                          <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                            <DataBadge label="LinkedIn" available={!!c.linkedin_url} />
                            <DataBadge label="Email" available={!!c.email} value={c.email} />
                            <DataBadge label="Phone" available={!!c.phone} value={c.phone} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noopener"
                            onClick={e => e.stopPropagation()}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "none", background: "#0077b5", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                            <LinkedInIcon /> LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Outreach Assistant */}
          <Section className="fade-up fade-up-4" title="Outreach Assistant" id="outreach"
            badge={<span style={{ fontSize: 11, background: "var(--canvas-2)", color: "var(--text-2)", padding: "2px 8px", borderRadius: 6, fontWeight: 600, marginLeft: 8 }}>AI-generated</span>}
          >
            {/* Channel selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>Channel:</span>
              {(["linkedin", "email", "whatsapp"] as const).map(ch => (
                <button key={ch} onClick={() => setChannel(ch)} style={{
                  padding: "5px 12px", borderRadius: 8,
                  border: `1px solid ${channel === ch ? "var(--accent)" : "var(--border)"}`,
                  background: channel === ch ? "var(--accent-dim)" : "transparent",
                  color: channel === ch ? "var(--accent-text)" : "var(--text-2)",
                  fontSize: 13, fontWeight: channel === ch ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                }}>
                  {ch === "linkedin" ? "LinkedIn" : ch === "email" ? "Email" : "WhatsApp"}
                </button>
              ))}
              {contacts.length > 1 && (
                <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, lineHeight: 1.4 }}>
                  Select a contact above to update the name and role in this draft.
                </span>
              )}
            </div>

            {(channel === "email" || subject) && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 }}>
                  Subject:
                </label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={lead ? `Perkenalan dari Bawana - ${lead.company.name}` : "Subject email"}
                  type="text"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--canvas)",
                    color: "var(--text)",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            )}

            {outreachLoading ? (
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--canvas)", padding: 16 }}>
                {[100, 90, 85, 70].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: 14, background: "var(--border)", borderRadius: 6, width: `${w}%`, marginBottom: i < 3 ? 10 : 0 }} />
                ))}
              </div>
            ) : (
              <textarea value={draft} onChange={e => setDraft(e.target.value)}
                style={{ width: "100%", minHeight: 220, padding: 16, border: "1px solid var(--border)", borderRadius: 10, background: "var(--canvas)", color: "var(--text)", fontSize: 13, lineHeight: 1.7, resize: "vertical", outline: "none", fontFamily: "var(--font-body)", transition: "border-color 0.15s" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            )}

            {outreach && outreach.tips.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
                {outreach.tips.map((tip, i) => (
                  <p key={i} style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0", fontStyle: "italic" }}>💡 {tip}</p>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "none", background: copied ? "var(--accent)" : "var(--text)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                <CopyIcon /> {copied ? "Copied! ✓" : "Copy Message"}
              </button>

              {/* LinkedIn button */}
              {contact?.linkedin_url && channel === "linkedin" && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener"
                  onClick={() => { recordOutreachEvent("opened", "linkedin").catch(() => {}); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "none", background: "#0077b5", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  <LinkedInIcon /> Open LinkedIn
                </a>
              )}

              {/* Email button */}
              {channel === "email" && (
                <button onClick={() => setShowEmailInput(!showEmailInput)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "none", background: emailSent ? "#16a34a" : "#0ea5e9", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <EmailIcon /> {emailSent ? "Sent! ✓" : "Show recipients' e-mail"}
                </button>
              )}

              {/* WhatsApp button - only if selected contact has phone */}
              {channel === "whatsapp" && contact?.phone && (
                <a
                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(draft)}`}
                  target="_blank" rel="noopener"
                  onClick={() => { recordOutreachEvent("opened", "whatsapp").catch(() => {}); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "none", background: "#25D366", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  <WhatsAppIcon /> Send WhatsApp {contacts.length > 1 ? `to ${contact.name?.split(" ")[0]}` : ""}
                </a>
              )}
              {channel === "whatsapp" && !contact?.phone && (
                <span style={{ fontSize: 13, color: "var(--text-3)", alignSelf: "center", fontStyle: "italic" }}>
                  {contacts.length > 1 ? "Selected contact does not have a phone number" : "No phone number available for this lead"}
                </span>
              )}
            </div>

            {/* Email input panel */}
            {channel === "email" && showEmailInput && (
              <div style={{ marginTop: 14, padding: 16, background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Send to:</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>Separate multiple recipients with commas</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="email1@co.com, email2@co.com"
                    type="text"
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#fff", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: "var(--font-mono)" }}
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={emailSending || !emailTo}
                    style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: emailSending ? "var(--border)" : "#0ea5e9", color: "#fff", fontSize: 13, fontWeight: 600, cursor: emailSending ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const }}
                  >
                    {emailSending ? "Sending..." : "Send →"}
                  </button>
                </div>
                {emailError && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>⚠ {emailError}</p>}
              </div>
            )}
          </Section>

          {/* Outreach History */}
          <Section className="fade-up fade-up-5" title="Outreach History" subtitle={history.length > 0 ? `${history.length} outreach recorded` : "No outreach yet"}>
            {history.length > 0 && (
              <div style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 2, background: "var(--border)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {history.map((entry) => (
                    <div key={entry.id} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, zIndex: 1, background: entry.type === "note" ? "var(--canvas-2)" : (entry.status === "replied" ? "#dcfce7" : "var(--accent-dim)"), border: `2px solid ${entry.type === "note" ? "var(--border)" : (entry.status === "replied" ? "#16a34a" : "var(--accent)")}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.type === "note" ? "var(--text-3)" : (entry.status === "replied" ? "#16a34a" : "var(--accent)") }} />
                      </div>
                      <div style={{ flex: 1, background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: entry.type === "note" ? 6 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {entry.type === "outreach" ? (
                              <>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "var(--accent-dim)", color: "var(--accent-text)" }}>
                                  {entry.channel === "linkedin" ? "LinkedIn" : entry.channel === "email" ? "Email" : "WhatsApp"}
                                </span>
                                {entry.contact && <span style={{ fontSize: 12, color: "var(--text-2)" }}>{entry.contact}</span>}
                                <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {entry.date}</span>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "var(--canvas-2)", color: "var(--text-2)" }}>Note</span>
                                <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {entry.date}</span>
                              </>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {entry.status && <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_LABELS[entry.status].color }}>{STATUS_LABELS[entry.status].label}</span>}
                            <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                          </div>
                        </div>
                        {entry.note && <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" as const }}>Add Note</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Add a note beyond the outreach above"
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--canvas)", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: "var(--font-body)" }}
                />
                <button onClick={addNote} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "var(--text)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  + Add
                </button>
              </div>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}

function Section({ title, subtitle, badge, children, className, id }: {
  title: string; subtitle?: string; badge?: React.ReactNode;
  children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <div id={id} className={className} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, marginBottom: 16, boxShadow: "var(--shadow)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>{title}</h2>
          {badge}
        </div>
        {subtitle && <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function DataBadge({ label, available, value }: { label: string; available: boolean; value?: string | null }) {
  return (
    <span
      title={available && value ? value : undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
        background: available ? "#dcfce7" : "var(--canvas-2)",
        color: available ? "#16a34a" : "var(--text-3)",
        border: `1px solid ${available ? "#bbf7d0" : "var(--border)"}`,
      }}
    >
      {available ? "✓" : "✕"} {label}
    </span>
  );
}

const spinner: React.CSSProperties = {
  width: 36, height: 36,
  border: "3px solid var(--border)", borderTop: "3px solid var(--accent)",
  borderRadius: "50%", animation: "spin 1s linear infinite",
};
