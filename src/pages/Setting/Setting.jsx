import React, { useContext, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { Alert, Input } from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const PASSWORD_REGEX =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

const settingSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .regex(
        PASSWORD_REGEX,
        "Password must have at least one Uppercase, lowercase, number and symbol and must not less than 8"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Confirm password does not match the new password.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

function extractApiMessage(apiData, fallbackMessage) {
  return (
    apiData?.message ||
    apiData?.error ||
    apiData?.errors?.[0]?.msg ||
    apiData?.data?.message ||
    fallbackMessage
  );
}

export default function Setting() {
  const { userToken, saveUserToken } = useContext(AuthContext);
  const [alertState, setAlertState] = useState({
    isVisible: false,
    color: "success",
    title: "",
    description: "",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(settingSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function showAlert(color, title, description) {
    setAlertState({
      isVisible: true,
      color,
      title,
      description,
    });
  }

  async function onSubmit(data) {
    setAlertState((prev) => ({ ...prev, isVisible: false }));

    if (!userToken) {
      showAlert("danger", "Update Failed", "You need to login first.");
      return;
    }

    try {
      const response = await axios.request({
        method: "PATCH",
        url: "https://route-posts.routemisr.com/users/change-password",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        data: {
          password: data.currentPassword,
          newPassword: data.newPassword,
        },
      });

      const refreshedToken = response?.data?.data?.token || response?.data?.token;
      if (refreshedToken) {
        saveUserToken(refreshedToken);
      }

      reset();
      showAlert(
        "success",
        "Success Notification",
        extractApiMessage(response?.data, "Password updated successfully.")
      );
    } catch (error) {
      showAlert(
        "danger",
        "Update Failed",
        extractApiMessage(
          error?.response?.data,
          error?.message || "Failed to update password."
        )
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-3.5">
      <main className="min-w-0">
        <div className="mx-auto max-w-2xl">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                  <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
              </span>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Change Password
                </h1>
                <p className="text-sm text-slate-500">
                  Keep your account secure by using a strong password.
                </p>
              </div>
            </div>

            {alertState.isVisible ? (
              <Alert
                className="mb-4"
                color={alertState.color}
                description={alertState.description}
                isVisible={alertState.isVisible}
                title={alertState.title}
                variant="faded"
                onClose={() =>
                  setAlertState((prev) => ({ ...prev, isVisible: false }))
                }
              />
            ) : null}

            <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Current password
                </span>
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      isInvalid={!!errors.currentPassword}
                      errorMessage={errors.currentPassword?.message}
                      classNames={{
                        inputWrapper:
                          "rounded-xl border border-slate-200 bg-slate-50 group-data-[focus=true]:border-[#1877f2] group-data-[focus=true]:bg-white",
                        input: "text-sm text-slate-800 placeholder:text-slate-400",
                        errorMessage: "text-xs",
                      }}
                    />
                  )}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  New password
                </span>
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      isInvalid={!!errors.newPassword}
                      errorMessage={errors.newPassword?.message}
                      classNames={{
                        inputWrapper:
                          "rounded-xl border border-slate-200 bg-slate-50 group-data-[focus=true]:border-[#1877f2] group-data-[focus=true]:bg-white",
                        input: "text-sm text-slate-800 placeholder:text-slate-400",
                        errorMessage: "text-xs",
                      }}
                    />
                  )}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  At least 8 characters with uppercase, lowercase, number, and
                  special character.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Confirm new password
                </span>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      isInvalid={!!errors.confirmPassword}
                      errorMessage={errors.confirmPassword?.message}
                      classNames={{
                        inputWrapper:
                          "rounded-xl border border-slate-200 bg-slate-50 group-data-[focus=true]:border-[#1877f2] group-data-[focus=true]:bg-white",
                        input: "text-sm text-slate-800 placeholder:text-slate-400",
                        errorMessage: "text-xs",
                      }}
                    />
                  )}
                />
              </label>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
