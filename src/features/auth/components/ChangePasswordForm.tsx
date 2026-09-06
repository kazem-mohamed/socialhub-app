import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { useToast } from "@/shared/ui/toast";
import { useChangePassword } from "../hooks/useAuthMutations";
import { changePasswordSchema, type ChangePasswordFormValues } from "../model/auth.schemas";

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const toast = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: ChangePasswordFormValues) {
    changePassword.mutate(
      { password: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: (result) => {
          reset();
          toast.push({
            title: "Password changed",
            body: result.message ?? "Use the new one next time you sign in.",
          });
        },
        onError: (error) =>
          toast.push({
            tone: "problem",
            title: "Could not change password",
            body: getErrorMessage(error, "Check your current password and try again."),
          }),
      },
    );
  }

  const isBusy = isSubmitting || changePassword.isPending;

  return (
    <section>
      <div>
        <h2 className="font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase">
          Password
        </h2>

        <form noValidate className="mt-7 max-w-[400px] space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Field
                {...field}
                label="Current password"
                type="password"
                autoComplete="current-password"
                placeholder="Your current password"
                error={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Field
                {...field}
                label="New password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a new password"
                hint="Eight characters or more, with an uppercase letter, a lowercase letter, a number and a symbol."
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Field
                {...field}
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the new password"
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            variant="primary"
            type="submit"
            isFullWidth
            isBusy={isBusy}
            busyLabel="Updating"
          >
            Update password
          </Button>
        </form>
      </div>
    </section>
  );
}
