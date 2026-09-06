import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { toIsoDateOnly } from "@/shared/lib/dates";
import { Button } from "@/shared/ui/Button";
import { FeedbackAlert } from "@/shared/ui/FeedbackAlert";
import { Field } from "@/shared/ui/Field";
import { SelectField } from "@/shared/ui/SelectField";
import { Plate } from "@/shared/ui/Plate";
import { Wordmark } from "@/shared/ui/Wordmark";
import { HIDDEN_ALERT, type AlertState } from "@/shared/ui/alertState";
import { routes } from "@/app/router/routes";
import { AuthTabs } from "@/features/auth/components/AuthTabs";
import { useSignUp } from "@/features/auth/hooks/useAuthMutations";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/model/auth.schemas";

const REDIRECT_DELAY_MS = 1200;

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      rePassword: "",
      gender: undefined,
      dateOfBirth: undefined,
    },
  });

  function onSubmit(values: RegisterFormValues) {
    signUp.mutate(
      {
        name: values.name,
        username: values.username,
        email: values.email,
        dateOfBirth: toIsoDateOnly(values.dateOfBirth),
        gender: values.gender,
        password: values.password,
        rePassword: values.rePassword,
      },
      {
        onSuccess: (result) => {
          setAlert({
            isVisible: true,
            color: "success",
            title: "Account created",
            description: result.message ?? "Sign in to claim your colour.",
          });
          setTimeout(() => navigate(routes.login), REDIRECT_DELAY_MS);
        },
        onError: (error) =>
          setAlert({
            isVisible: true,
            color: "danger",
            title: "Could not create account",
            description: getErrorMessage(
              error,
              "Check the fields above and try again.",
            ),
          }),
      },
    );
  }

  const isBusy = isSubmitting || signUp.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-5 py-12">
      <div className="w-full max-w-[420px]">
        <Wordmark className="mb-8 block w-[84px]" />

        {/* The accession card itself: a plate bearing the entry you are
            about to make. */}
        <Plate className="p-7 sm:p-8">
          <AuthTabs active="register" />

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
            Create account
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            Your username decides your colour. Choose it once.
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
              name="name"
              control={control}
              render={({ field }) => (
                <Field
                  {...field}
                  label="Name"
                  autoComplete="name"
                  placeholder="Your full name"
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Field
                  {...field}
                  label="Username"
                  autoComplete="username"
                  placeholder="your.handle"
                  prefix={<span className="font-mono text-sm">@</span>}
                  error={errors.username?.message}
                />
              )}
            />

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

            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Gender"
                    options={GENDER_OPTIONS}
                    placeholder="Select"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    error={errors.gender?.message}
                  />
                )}
              />

              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <Field
                    label="Date of birth"
                    type="date"
                    name={field.name}
                    onBlur={field.onBlur}
                    value={field.value ? toIsoDateOnly(field.value) : ""}
                    onChange={(event) => {
                      const { value } = event.target;
                      field.onChange(
                        value ? new Date(`${value}T00:00:00`) : undefined,
                      );
                    }}
                    error={errors.dateOfBirth?.message}
                  />
                )}
              />
            </div>

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Field
                  {...field}
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Choose a password"
                  hint="Eight characters or more, with an uppercase letter, a lowercase letter, a number and a symbol."
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              name="rePassword"
              control={control}
              render={({ field }) => (
                <Field
                  {...field}
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat it"
                  error={errors.rePassword?.message}
                />
              )}
            />

            <Button
              variant="primary"
              type="submit"
              isFullWidth
              isBusy={isBusy}
              busyLabel="Creating account"
            >
              Create account
            </Button>
          </form>
        </Plate>

        <p className="mt-6 text-center font-mono text-micro tracking-[0.12em] text-ink-3 uppercase">
          Your username decides your colour.
        </p>
      </div>
    </div>
  );
}
