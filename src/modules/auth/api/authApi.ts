import { apiClient, ApiOne } from "@api/apiClient";
import { User } from "@shared/store/useAuthStore";

export interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}
type Message = ApiOne<{ message: string }>;

export const authApi = {
  login: async (payload: { email: string; password: string }) =>
    (await apiClient.post<ApiOne<AuthData>>("/auth/login", payload)).data.data,
  register: async (payload: {
    displayName: string;
    email: string;
    password: string;
  }) =>
    (await apiClient.post<ApiOne<AuthData>>("/auth/register", payload)).data
      .data,
  verifyEmail: async (payload: { email: string; code: string }) =>
    (await apiClient.post<Message>("/auth/verify-email", payload)).data.data,
  resendVerification: async () =>
    (await apiClient.post<Message>("/auth/verify-email/resend")).data.data,
  forgotPassword: async (payload: { email: string }) =>
    (await apiClient.post<Message>("/auth/password/forgot", payload)).data.data,
  /** Replaces the current password; also how a temporary one is exchanged. */
  changePassword: async (currentPassword: string, newPassword: string) =>
    (
      await apiClient.post<{ data: { user: User } }>("/auth/password/change", {
        currentPassword,
        newPassword,
      })
    ).data.data.user,
  resetPassword: async (payload: {
    email: string;
    code: string;
    password: string;
  }) =>
    (await apiClient.post<Message>("/auth/password/reset", payload)).data.data,
};
