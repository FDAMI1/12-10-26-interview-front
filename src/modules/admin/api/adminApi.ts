import { apiClient, ApiOne, Paginated } from "@api/apiClient";
import { User } from "@shared/store/useAuthStore";

export interface Overview {
  registrations: number;
  candidates: number;
  activeCompanies: number;
  interviews: number;
  completedInterviews: number;
  failedSessions: number;
  completionRate: number;
  publishedTemplates: number;
}

export interface Candidate extends User {
  interviewCredits: number;
}

export interface AdminAccount extends User {
  /** The admin from ADMIN_EMAIL in the server's .env; changed there, not in the app. */
  managedByEnv: boolean;
}

export interface UsageToday {
  used: number;
  failures: number;
  quota: number;
  remaining: number;
  percent: number;
  status: "ok" | "approaching_limit" | "limit_reached" | "not_configured";
}

export interface AiUsage {
  unit: "requests";
  day: string;
  today: { text: UsageToday; tts: UsageToday };
  trend: { day: string; text: number; tts: number; failures: number; tokens: number }[];
}

export type SettingValue = number | boolean | string;

export interface Setting {
  key: string;
  value: SettingValue;
  default: SettingValue;
  valueType: "number" | "boolean" | "string";
}

const one = async <T>(p: Promise<{ data: ApiOne<T> }>) => (await p).data.data;

export const adminApi = {
  overview: () => one(apiClient.get<ApiOne<Overview>>("/admin/overview")),
  users: async (search: string) =>
    (
      await apiClient.get<Paginated<User>>("/admin/users", {
        params: { limit: 50, ...(search ? { search } : {}) },
      })
    ).data,
  setUserStatus: (
    userId: string,
    status: "active" | "suspended",
    reason: string,
  ) =>
    one(
      apiClient.patch<ApiOne<User>>(`/admin/users/${userId}/status`, {
        status,
        reason,
      }),
    ),
  candidates: async (search: string) =>
    (
      await apiClient.get<Paginated<Candidate>>("/admin/candidates", {
        params: { limit: 50, ...(search ? { search } : {}) },
      })
    ).data,
  createCandidate: (displayName: string, email: string, interviewCredits: number) =>
    one(
      apiClient.post<ApiOne<{ candidate: Candidate; temporaryPassword: string }>>(
        "/admin/candidates",
        { displayName, email, interviewCredits },
      ),
    ),
  addCandidateCredits: (id: string, credits: number, clientRequestId: string) =>
    one(
      apiClient.patch<ApiOne<Candidate>>(`/admin/candidates/${id}`, {
        addInterviewCredits: credits,
        clientRequestId,
      }),
    ),
  resetCandidatePassword: (id: string) =>
    one(
      apiClient.post<ApiOne<{ temporaryPassword: string }>>(
        `/admin/candidates/${id}/reset-password`,
      ),
    ),
  deleteCandidate: (id: string) => one(apiClient.delete(`/admin/candidates/${id}`)),
  admins: async (search: string) =>
    (
      await apiClient.get<Paginated<AdminAccount>>("/admin/admins", {
        params: { limit: 50, ...(search ? { search } : {}) },
      })
    ).data,
  createAdmin: (displayName: string, email: string) =>
    one(
      apiClient.post<ApiOne<{ admin: AdminAccount; temporaryPassword: string }>>(
        "/admin/admins",
        { displayName, email },
      ),
    ),
  renameAdmin: (id: string, displayName: string) =>
    one(apiClient.patch<ApiOne<AdminAccount>>(`/admin/admins/${id}`, { displayName })),
  setAdminStatus: (id: string, status: "active" | "suspended") =>
    one(apiClient.patch<ApiOne<AdminAccount>>(`/admin/admins/${id}/status`, { status })),
  resetAdminPassword: (id: string) =>
    one(
      apiClient.post<ApiOne<{ temporaryPassword: string }>>(
        `/admin/admins/${id}/reset-password`,
      ),
    ),
  deleteAdmin: (id: string) => one(apiClient.delete(`/admin/admins/${id}`)),
  aiUsage: (days: number) =>
    one(apiClient.get<ApiOne<AiUsage>>("/admin/ai-usage", { params: { days } })),
  settings: () =>
    one(apiClient.get<ApiOne<Setting[]>>("/admin/platform-settings")),
  updateSetting: (key: string, value: SettingValue) =>
    one(apiClient.patch(`/admin/platform-settings/${key}`, { value })),
};
