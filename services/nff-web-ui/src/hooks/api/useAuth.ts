import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { baseApi } from "@/lib/api/base";
import { queryKeys } from "@/lib/query/keys";
import { tokenManager } from "@/lib/auth/token-manager";
import type { LoginRequest, TokenResponse, AuthUser } from "@/types/auth";
import { AUTH_ROUTES } from "@/lib/auth/constants";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<TokenResponse, Error, LoginRequest>({
    mutationFn: (credentials) => baseApi.post("/auth/login", credentials),
    onSuccess: (data) => {
      tokenManager.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresIn
          ? Date.now() + data.expiresIn * 1000
          : undefined,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => baseApi.post("/auth/logout"),
    onSuccess: () => {
      tokenManager.clearTokens();
      queryClient.clear();
      router.push("/login");
    },
    onError: () => {
      tokenManager.clearTokens();
      queryClient.clear();
      router.push("/login");
    },
  });
}

export function useMe(enabled = true) {
  return useQuery<AuthUser, Error>({
    queryKey: queryKeys.auth.me(),
    queryFn: () => baseApi.get("/auth/me"),
    enabled,
    retry: false,
  });
}

export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation<TokenResponse, Error, string>({
    mutationFn: (refreshToken) =>
      baseApi.post("/auth/refresh", { refreshToken }),
    onSuccess: (data) => {
      tokenManager.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresIn
          ? Date.now() + data.expiresIn * 1000
          : undefined,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
    onError: () => {
      tokenManager.clearTokens();
      window.location.href = AUTH_ROUTES.LOGIN;
    },
  });
}
