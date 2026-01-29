"use server"

import { newsletterSchema, type NewsletterValues } from "@/lib/validation/newsletter"

export type NewsletterResult = {
  success: boolean
  message: string
}

export async function subscribeToNewsletter(
  formData: FormData
): Promise<NewsletterResult> {
  try {
    // Parse and validate form data
    const rawData = {
      email: formData.get("email") as string
    }

    const validatedData = newsletterSchema.parse(rawData)

    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200))

    // Simulate 90% success rate for demo
    if (Math.random() > 0.1) {
      // In a real app, you would save to database here
      console.log("Newsletter subscription:", validatedData.email)
      
      return {
        success: true,
        message: "Díky! Jsi přihlášen k odběru."
      }
    } else {
      // Simulate server error
      return {
        success: false,
        message: "Něco se pokazilo. Zkus to prosím znovu."
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message
      }
    }
    
    return {
      success: false,
      message: "Něco se pokazilo. Zkus to prosím znovu."
    }
  }
}
