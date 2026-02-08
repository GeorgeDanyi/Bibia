import { z } from "zod"

export const therapistApplicationSchema = z.object({
  email: z.string().email("Zadejte platný email.").toLowerCase().trim(),
  phone: z.string().min(1, "Telefon je povinný.").transform((val) => val.replace(/\s+/g, "")).refine((val) => val.length >= 9, {
    message: "Telefon musí mít alespoň 9 číslic."
  }),
  fullName: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  isCertified: z.boolean(),
  isInTraining: z.boolean(),
  howDidYouHear: z.string().trim().nullable().optional(),
  note: z.string().trim().nullable().optional(),
  website: z.string().trim().optional(), // Honeypot
})

export type TherapistApplicationInput = z.infer<typeof therapistApplicationSchema>

