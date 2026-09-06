import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import type {
  ChangePasswordPayload,
  SignInPayload,
  SignUpPayload,
} from "../model/auth.types";
import { useAuth } from "./useAuth";

/** Signs in and persists the returned token. */
export function useSignIn() {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: (payload: SignInPayload) => authApi.signIn(payload),
    onSuccess: (result) => {
      if (result.token) signIn(result.token);
    },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: (payload: SignUpPayload) => authApi.signUp(payload),
  });
}

/**
 * Changing the password rotates the token server-side; persisting the new one
 * keeps the session alive instead of silently invalidating it.
 */
export function useChangePassword() {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: (result) => {
      if (result.token) signIn(result.token);
    },
  });
}
