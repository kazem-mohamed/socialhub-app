import { request } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import { readApiMessage } from "@/shared/api/errors";
import { firstString } from "@/shared/lib/records";
import type {
  AuthResult,
  ChangePasswordPayload,
  SignInPayload,
  SignUpPayload,
} from "../model/auth.types";

function toAuthResult(payload: unknown, fallbackMessage: string): AuthResult {
  return {
    token: firstString(payload, [["data", "token"], ["token"]]),
    message: readApiMessage(payload) ?? fallbackMessage,
  };
}

export const authApi = {
  async signIn(payload: SignInPayload): Promise<AuthResult> {
    const data = await request({
      method: "POST",
      url: endpoints.auth.signIn,
      data: payload,
    });
    return toAuthResult(data, "Logged in successfully.");
  },

  async signUp(payload: SignUpPayload): Promise<AuthResult> {
    const data = await request({
      method: "POST",
      url: endpoints.auth.signUp,
      data: payload,
    });
    return toAuthResult(data, "Account created successfully.");
  },

  async changePassword(payload: ChangePasswordPayload): Promise<AuthResult> {
    const data = await request({
      method: "PATCH",
      url: endpoints.auth.changePassword,
      headers: { "Content-Type": "application/json" },
      data: payload,
    });
    return toAuthResult(data, "Password updated successfully.");
  },
};
