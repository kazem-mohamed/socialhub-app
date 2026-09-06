import * as z from "zod";

/**
 * The password rule was copy-pasted into Login, Register and Setting with a
 * subtle difference (one variant allowed a space inside the symbol class).
 * Single definition now.
 */
export const PASSWORD_REGEX =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;

const PASSWORD_MESSAGE =
  "Use 8 characters or more, with an uppercase letter, a lowercase letter, a number and a symbol.";

const passwordField = z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE);

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: passwordField,
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .nonempty("Enter your name.")
      .min(3, "At least 3 characters.")
      .max(15, "15 characters at most."),
    username: z
      .string()
      .nonempty("Choose a username.")
      .min(3, "At least 3 characters.")
      .max(15, "15 characters at most."),
    email: z.string().email("Enter a valid email address."),
    password: passwordField,
    rePassword: z.string().min(1, "Repeat your password."),
    dateOfBirth: z
      .date({ message: "Select your date of birth." })
      .refine(
        (value) => new Date().getFullYear() - value.getFullYear() >= 12,
        "You must be 12 or older to join.",
      ),
    gender: z.enum(["male", "female"], { message: "Select an option." }),
  })
  .refine((data) => data.password === data.rePassword, {
    message: "This does not match the password above.",
    path: ["rePassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Repeat your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "This does not match the new password.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
