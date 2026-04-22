const BASE = "http://localhost:8000";

export interface Contact {
  name?: string;
  role?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
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
  contact?: Contact;
  fetched_at?: string;
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

  rejectLead: (companyId: string) =>
    request<{ status: string }>(`/leads/reject/${companyId}`, { method: "POST" }),

  unrejectLead: (companyId: string) =>
    request<{ status: string }>(`/leads/unreject/${companyId}`, { method: "POST" }),

  generateOutreach: (companyId: string, channel: string) =>
    request<OutreachDraft>("/outreach/generate", {
      method: "POST",
      body: JSON.stringify({ company_id: companyId, channel }),
    }),

  getICP: () => request<ICPConfig>("/settings/icp"),

  updateICP: (config: ICPConfig) =>
    request<ICPConfig>("/settings/icp", {
      method: "POST",
      body: JSON.stringify(config),
    }),
};
