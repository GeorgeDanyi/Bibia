import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Zadej platný e-mail."),
  password: z
    .string()
    .min(6, "Heslo musí mít alespoň 6 znaků."),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type RegisterFormData = z.infer<typeof registerSchema>
