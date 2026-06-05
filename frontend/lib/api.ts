const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

export interface Contact {
  name?: string;
  role?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  enrichment_warning?: string;
}

export interface LeadScore {
  total: number;
  breakdown: Record<string, number>;
  reasoning: string[];
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  employee_count?: number;
  description?: string;
  website?: string;
  linkedin_url?: string;
  location?: string;
  keywords?: string[];
  founded_year?: number;
  revenue?: number;
}

export interface Lead {
  company: Company;
  score: LeadScore;
  contacts: Contact[];
  contact_warning?: string;
  fetched_at?: string;
  is_rejected?: boolean;
  is_saved?: boolean;
}

export interface DashboardResponse {
  leads: Lead[];
  generated_at: string;
  icp_summary: string;
}

export interface OutreachDraft {
  company_id: string;
  channel: string;
  subject?: string;
  message: string;
  tips: string[];
}

export interface ICPConfig {
  industries: string[];
  employee_ranges: string[];
  keywords: string[];
  locations: string[];
  target_roles: string[];
}

export interface SendEmailRequest {
  company_id?: string;
  to_email: string;
  subject: string;
  message: string;
  company_name: string;
  contact_name?: string;
  contact_role?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  sent_to: string[];
  failed: string[];
}

export interface OutreachEvent {
  id: string;
  company_id: string;
  event_type: "outreach" | "note";
  channel?: "email" | "linkedin" | "whatsapp" | string;
  contact_name?: string;
  contact_role?: string;
  recipient?: string;
  subject?: string;
  message?: string;
  status?: "sent" | "opened" | "copied" | "replied" | "no_response" | string;
  note?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface OutreachActivity extends OutreachEvent {
  company_name?: string;
}

export interface OutreachEventCreate {
  event_type?: "outreach" | "note";
  channel?: "email" | "linkedin" | "whatsapp" | string;
  contact_name?: string;
  contact_role?: string;
  recipient?: string;
  subject?: string;
  message?: string;
  status?: string;
  note?: string;
  metadata?: Record<string, any>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getTopLeads: (refresh = false) =>
    request<DashboardResponse>(`/leads/top?refresh=${refresh}`),

  getLeadDetail: (companyId: string) =>
    request<Lead>(`/leads/${companyId}`),

  refreshLeadContacts: (companyId: string) =>
    request<Lead>(`/leads/${companyId}/refresh-contacts`, { method: "POST" }),

  skipLead: (companyId: string) =>
    request<{ status: string }>(`/leads/reject/${companyId}`, { method: "POST" }),

  unskipLead: (companyId: string) =>
    request<{ status: string }>(`/leads/unreject/${companyId}`, { method: "POST" }),

  saveLead: (companyId: string) =>
    request<{ status: string }>(`/leads/save/${companyId}`, { method: "POST" }),

  unsaveLead: (companyId: string) =>
    request<{ status: string }>(`/leads/unsave/${companyId}`, { method: "POST" }),

  generateOutreach: (companyId: string, channel: string, contactName?: string, contactRole?: string) =>
    request<OutreachDraft>("/outreach/generate", {
      method: "POST",
      body: JSON.stringify({
        company_id: companyId,
        channel,
        contact_name: contactName || undefined,
        contact_role: contactRole || undefined,
      }),
    }),

  sendEmail: (data: SendEmailRequest) =>
    request<SendEmailResponse>("/outreach/send-email", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOutreachHistory: (companyId: string) =>
    request<OutreachEvent[]>(`/outreach/history/${companyId}`),

  getRecentOutreachActivity: (limit = 100) =>
    request<OutreachActivity[]>(`/outreach/history/recent?limit=${limit}`),

  createOutreachEvent: (companyId: string, data: OutreachEventCreate) =>
    request<OutreachEvent>(`/outreach/history/${companyId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteOutreachEvent: (companyId: string, eventId: string) =>
    request<{ status: string }>(`/outreach/history/${companyId}/${eventId}`, {
      method: "DELETE",
    }),

  getICP: () => request<ICPConfig>("/settings/icp"),

  updateICP: (config: ICPConfig) =>
    request<ICPConfig>("/settings/icp", {
      method: "POST",
      body: JSON.stringify(config),
    }),
};
