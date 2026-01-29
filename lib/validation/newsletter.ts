import { z } from "zod"

export const newsletterSchema = z.object({
  email: z.string().email("Zadej platný e-mail")
})

export type NewsletterValues = z.infer<typeof newsletterSchema>
