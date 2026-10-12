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
  settings: () =>
    one(apiClient.get<ApiOne<Setting[]>>("/admin/platform-settings")),
  updateSetting: (key: string, value: SettingValue) =>
    one(apiClient.patch(`/admin/platform-settings/${key}`, { value })),
};
