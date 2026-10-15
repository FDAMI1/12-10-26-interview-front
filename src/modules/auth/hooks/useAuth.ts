import { useMutation } from "@tanstack/react-query";
import { authApi, AuthData } from "@modules/auth/api/authApi";
import { useAuthStore } from "@shared/store/useAuthStore";

const applyAuth = ({ user, accessToken, refreshToken }: AuthData) =>
  useAuthStore.getState().setAuth(user, accessToken, refreshToken);

export const useLogin = () =>
  useMutation({ mutationFn: authApi.login, onSuccess: applyAuth });

/** "Continue with Google / GitHub": the one-time code becomes a session. */
export const useOAuthExchange = () =>
  useMutation({ mutationFn: authApi.oauthExchange, onSuccess: applyAuth });

/** Registering signs the candidate in; email verification follows in-app. */
export const useRegister = () =>
  useMutation({ mutationFn: authApi.register, onSuccess: applyAuth });

export const useVerifyEmail = () =>
  useMutation({
    mutationFn: (code: string) =>
      authApi.verifyEmail({
        email: useAuthStore.getState().user?.email ?? "",
        code,
      }),
    onSuccess: () =>
      useAuthStore.getState().updateUser({ emailVerified: true }),
  });

export const useResendVerification = () =>
  useMutation({ mutationFn: authApi.resendVerification });

export const useForgotPassword = () =>
  useMutation({ mutationFn: authApi.forgotPassword });

export const useResetPassword = () =>
  useMutation({ mutationFn: authApi.resetPassword });
