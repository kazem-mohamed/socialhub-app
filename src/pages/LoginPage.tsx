import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/ui/Button";
import { FeedbackAlert } from "@/shared/ui/FeedbackAlert";
import { Field } from "@/shared/ui/Field";
import { Plate } from "@/shared/ui/Plate";
import { Wordmark } from "@/shared/ui/Wordmark";
import { HIDDEN_ALERT, type AlertState } from "@/shared/ui/alertState";
import { routes } from "@/app/router/routes";
import { AuthTabs } from "@/features/auth/components/AuthTabs";
import { useSignIn } from "@/features/auth/hooks/useAuthMutations";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/model/auth.schemas";

const REDIRECT_DELAY_MS = 1200;

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    signIn.mutate(values, {
      onSuccess: (result) => {
        setAlert({
          isVisible: true,
          color: "success",
          title: "Signed in",
          description: result.message ?? "Taking you to your feed.",
        });
        // Give the confirmation a beat before leaving the page.
        setTimeout(() => navigate(routes.home), REDIRECT_DELAY_MS);
      },
      onError: (error) =>
        setAlert({
          isVisible: true,
          color: "danger",
          title: "Could not sign in",
          description: getErrorMessage(
            error,
            "Check your email and password, then try again.",
          ),
        }),
    });
  }

  const isBusy = isSubmitting || signIn.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-5 py-12">
      <div className="w-full max-w-[420px]">
        <Wordmark className="mb-8 block w-[84px]" />

        {/* The accession card itself: a plate bearing the entry you are
            about to make. */}
        <Plate className="p-7 sm:p-8">
          <AuthTabs active="login" />

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            Your colour is waiting where you left it.
          </p>

          <FeedbackAlert
            state={alert}
            wrapperClassName="mt-6"
            onClose={() =>
              setAlert((previous) => ({ ...previous, isVisible: false }))
            }
          />

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Field
                  {...field}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Field
                  {...field}
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              variant="primary"
              type="submit"
              isFullWidth
              isBusy={isBusy}
              busyLabel="Signing in"
            >
              Sign in
            </Button>
          </form>
        </Plate>

        <p className="mt-6 text-center font-mono text-micro tracking-[0.12em] text-ink-3 uppercase">
          One colour each. Never reissued.
        </p>
      </div>
    </div>
  );
}
