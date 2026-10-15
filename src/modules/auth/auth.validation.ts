import { z } from "zod";

/** Kept in step with the backend's rules so the form catches what the server would. */
const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email");

const newPassword = z.string().min(10, "At least 10 characters");
const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    displayName: z.string().trim().min(2, "Your name is required"),
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "The passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  email,
  code,
  password: newPassword,
});

export const verifyCodeSchema = z.object({ code });
