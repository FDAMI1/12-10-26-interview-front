import { apiClient, ApiOne } from "@api/apiClient";
import { User } from "@shared/store/useAuthStore";

export const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "lead"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface CandidateProfile {
  targetRoles: string[];
  experienceLevel: ExperienceLevel;
  skills: string[];
}

export interface Me {
  user: User;
  candidateProfile: CandidateProfile | null;
  memberships: { tenantId: string; tenantName: string; role: string }[];
}

export const profileApi = {
  /** Who a token belongs to, before it is stored (API-integration launch links). */
  meWithToken: async (token: string) =>
    (
      await apiClient.get<ApiOne<Me>>("/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data.data.user,
  me: async () => (await apiClient.get<ApiOne<Me>>("/me")).data.data,
  updateMe: async (displayName: string) =>
    (await apiClient.patch<ApiOne<User>>("/me", { displayName })).data.data,
  /** Permanently deletes the signed-in account and its data. */
  /** Confirmed with the password, or for a Google-only account with its email address. */
  deleteAccount: async (confirm: { password: string } | { confirmEmail: string }) =>
    (await apiClient.delete<ApiOne<{ message: string }>>("/me", { data: confirm })).data.data,
  updateCandidateProfile: async (profile: CandidateProfile) =>
    (
      await apiClient.put<ApiOne<CandidateProfile>>(
        "/me/candidate-profile",
        profile,
      )
    ).data.data,
};
