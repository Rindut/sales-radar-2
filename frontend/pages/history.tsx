import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { api, OutreachActivity } from "../lib/api";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  sent: { label: "Sent", color: "#16a34a", bg: "#dcfce7" },
  opened: { label: "Opened", color: "#1D8EDE", bg: "#ddf0fc" },
  copied: { label: "Copied", color: "#6366f1", bg: "#eef2ff" },
  replied: { label: "Replied", color: "#16a34a", bg: "#dcfce7" },
  no_response: { label: "No Response", color: "#d97706", bg: "#fef3c7" },
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function activityLabel(activity: OutreachActivity) {
  if (activity.event_type === "note") return "Note added";
  const status = activity.status || "outreach";
  const channel = activity.channel ? CHANNEL_LABELS[activity.channel] || activity.channel : "Outreach";
  if (status === "sent") return `${channel} sent`;
  if (status === "opened") return `${channel} opened`;
  if (status === "copied") return `${channel} copied`;
  return channel;
}

export default function Dashboard() {
  const router = useRouter();
  const [activities, setActivities] = useState<OutreachActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    api.getRecentOutreachActivity(150)
      .then(data => {
        if (!cancelled) setActivities(data);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const outreach = activities.filter(a => a.event_type !== "note");
    return {
      total: outreach.length,
      sent: outreach.filter(a => a.status === "sent").length,
      linkedin: outreach.filter(a => a.channel === "linkedin").length,
      whatsapp: outreach.filter(a => a.channel === "whatsapp").length,
      copied: outreach.filter(a => a.status === "copied").length,
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (channelFilter === "all") return activities;
    if (channelFilter === "note") return activities.filter(a => a.event_type === "note");
    return activities.filter(a => a.channel === channelFilter);
  }, [activities, channelFilter]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <Sidebar active="history" />

      <main style={{ flex: 1, background: "var(--canvas)", overflowY: "auto" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 28px 80px" }}>
          <div className="fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 26, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", color: "var(--text)", lineHeight: 1.1 }}>Dashboard</h1>
              <p style={{ marginTop: 8, color: "var(--text-2)", fontSize: 15 }}>Recent activity across all leads</p>
            </div>
            <button
              onClick={() => router.push("/")}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-2)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Back to Leads
            </button>
          </div>

          <div className="fade-up fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total Activity", value: stats.total },
              { label: "Emails Sent", value: stats.sent },
              { label: "LinkedIn", value: stats.linkedin },
              { label: "WhatsApp", value: stats.whatsapp },
              { label: "Copied", value: stats.copied },
            ].map(item => (
              <div key={item.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-3)", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="fade-up fade-up-2" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              ["all", "All"],
              ["email", "Email"],
              ["linkedin", "LinkedIn"],
              ["whatsapp", "WhatsApp"],
              ["note", "Notes"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setChannelFilter(value)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: `1px solid ${channelFilter === value ? "var(--accent)" : "var(--border)"}`,
                  background: channelFilter === value ? "var(--accent)" : "var(--card)",
                  color: channelFilter === value ? "#fff" : "var(--text-2)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="fade-up fade-up-3" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 0.8fr 0.8fr 0.75fr", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--border)", color: "var(--text-3)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <div>Company</div>
              <div>Contact</div>
              <div>Action</div>
              <div>Recipient</div>
              <div>Time</div>
            </div>

            {loading && (
              <div style={{ padding: 32, color: "var(--text-3)", textAlign: "center", fontSize: 13 }}>Loading activity...</div>
            )}

            {error && (
              <div style={{ padding: 32, color: "#ef4444", textAlign: "center", fontSize: 13 }}>⚠ {error}</div>
            )}

            {!loading && !error && filteredActivities.length === 0 && (
              <div style={{ padding: 32, color: "var(--text-3)", textAlign: "center", fontSize: 13 }}>No recent activity yet.</div>
            )}

            {!loading && !error && filteredActivities.map(activity => {
              const meta = STATUS_META[activity.status || ""] || { label: activity.status || "Recorded", color: "var(--text-2)", bg: "var(--canvas-2)" };
              return (
                <button
                  key={activity.id}
                  onClick={() => router.push(`/leads/${activity.company_id}`)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1.15fr 1fr 0.8fr 0.8fr 0.75fr",
                    gap: 12,
                    alignItems: "center",
                    padding: "14px 18px",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--canvas)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activity.company_name || activity.company_id}
                    </div>
                    {activity.subject && (
                      <div style={{ marginTop: 3, fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {activity.subject}
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activity.contact_name || "-"}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activity.contact_role || "-"}
                    </div>
                  </div>
                  <div>
                    <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 800 }}>
                      {activityLabel(activity)}
                    </span>
                  </div>
                  <div style={{ minWidth: 0, fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {activity.recipient || activity.channel || "-"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    {formatDate(activity.created_at)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
