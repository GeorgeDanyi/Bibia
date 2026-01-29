import { z } from "zod"

export const step1Schema = z.object({
  fullName: z
    .string()
    .min(2, "Jméno musí mít alespoň 2 znaky.")
    .max(100, "Jméno je příliš dlouhé."),
  dob: z
    .string()
    .min(1, "Datum narození je povinné.")
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - selectedDate.getFullYear()
      return age >= 0 && age <= 120
    }, "Zadejte platné datum narození."),
})

export type Step1Values = z.infer<typeof step1Schema>

// Step 2: Pain areas
export const step2Schema = z.object({
  painAreas: z
    .array(z.string())
    .min(1, "Vyberte alespoň jednu oblast bolesti."),
  otherPainArea: z.string().optional(),
})

export type Step2Values = z.infer<typeof step2Schema>

// Step 3: Pain intensity
export const step3Schema = z.object({
  painIntensity: z
    .number()
    .min(0, "Intenzita bolesti musí být alespoň 0.")
    .max(10, "Intenzita bolesti nesmí být vyšší než 10."),
})

export type Step3Values = z.infer<typeof step3Schema>

// Step 4: Activity level
export const step4Schema = z.object({
  activityLevel: z
    .enum(["sedentary", "lightly_active", "active", "athlete"], {
      required_error: "Vyberte úroveň aktivity.",
    }),
})

export type Step4Values = z.infer<typeof step4Schema>

// Combined schema for all steps
export const questionnaireSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
  // Add more steps as needed
})

export type QuestionnaireValues = z.infer<typeof questionnaireSchema>

// Type for complete questionnaire submission
export type CompleteQuestionnaireData = {
  step1: Step1Values
  step2: Step2Values
  step3: Step3Values
  step4: Step4Values
}
