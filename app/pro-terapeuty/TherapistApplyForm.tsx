"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface FormData {
  email: string
  phone: string
  fullName: string
  city: string
  isCertified: string
  isInTraining: string
  howDidYouHear: string
  note: string
  website: string // Honeypot
}

interface FormErrors {
  email?: string
  phone?: string
  isCertified?: string
  isInTraining?: string
  general?: string
}

export function TherapistApplyForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    phone: "",
    fullName: "",
    city: "",
    isCertified: "",
    isInTraining: "",
    howDidYouHear: "",
    note: "",
    website: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const normalizePhone = (phone: string): string => {
    return phone.replace(/\s+/g, "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitStatus("idle")

    // Client-side validation
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email je povinný"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Zadejte platný email"
    }

    const normalizedPhone = normalizePhone(formData.phone)
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefon je povinný"
    } else if (normalizedPhone.length < 9) {
      newErrors.phone = "Telefon musí mít alespoň 9 číslic"
    }

    if (!formData.isCertified) {
      newErrors.isCertified = "Odpověď je povinná"
    }

    if (!formData.isInTraining) {
      newErrors.isInTraining = "Odpověď je povinná"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/therapists/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          phone: normalizedPhone,
          fullName: formData.fullName.trim() || null,
          city: formData.city.trim() || null,
          isCertified: formData.isCertified === "ano",
          isInTraining: formData.isInTraining === "ano",
          howDidYouHear: formData.howDidYouHear || null,
          note: formData.note.trim() || null,
          website: formData.website.trim(),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Něco se pokazilo")
      }

      setSubmitStatus("success")
      // Reset form
      setFormData({
        email: "",
        phone: "",
        fullName: "",
        city: "",
        isCertified: "",
        isInTraining: "",
        howDidYouHear: "",
        note: "",
        website: ""
      })
    } catch (error: any) {
      setSubmitStatus("error")
      if (error instanceof TypeError || error.message?.includes("fetch")) {
        setErrors({ general: "Nepodařilo se spojit se serverem. Zkontrolujte, že aplikace běží." })
      } else {
        setErrors({ general: error.message || "Nepodařilo se odeslat přihlášku. Zkuste to prosím znovu." })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modern Form Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-seafoam-100/50 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-seafoam-900 mb-4 pb-2 border-b border-seafoam-100">Kontaktní údaje</h3>
              <div className="grid md:grid-cols-2 gap-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    className={`h-11 ${errors.email ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus-visible:ring-seafoam-500"}`}
                    disabled={isSubmitting}
                    required
                    placeholder="vas@email.cz"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Telefon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (errors.phone) setErrors({ ...errors, phone: undefined })
                    }}
                    className={`h-11 ${errors.phone ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus-visible:ring-seafoam-500"}`}
                    disabled={isSubmitting}
                    required
                    placeholder="+420 123 456 789"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Jméno a příjmení</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-11 border-gray-200 focus-visible:ring-seafoam-500"
                    disabled={isSubmitting}
                    placeholder="Jan Novák"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700">Město</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-11 border-gray-200 focus-visible:ring-seafoam-500"
                    disabled={isSubmitting}
                    placeholder="Praha"
                  />
                </div>
              </div>
            </div>

            {/* Qualifications Section */}
            <div>
              <h3 className="text-lg font-semibold text-seafoam-900 mb-4 pb-2 border-b border-seafoam-100">Kvalifikace</h3>
              <div className="grid md:grid-cols-2 gap-5">
                {/* Is Certified */}
                <div className="space-y-2">
                  <Label htmlFor="isCertified" className="text-sm font-medium text-gray-700">
                    Máš osvědčení/diplom? <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="isCertified"
                    value={formData.isCertified}
                    onChange={(e) => {
                      setFormData({ ...formData, isCertified: e.target.value })
                      if (errors.isCertified) setErrors({ ...errors, isCertified: undefined })
                    }}
                    className={`flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.isCertified ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus-visible:ring-seafoam-500"}`}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Vyber...</option>
                    <option value="ano">Ano</option>
                    <option value="ne">Ne</option>
                  </select>
                  {errors.isCertified && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.isCertified}
                    </p>
                  )}
                </div>

                {/* Is In Training */}
                <div className="space-y-2">
                  <Label htmlFor="isInTraining" className="text-sm font-medium text-gray-700">
                    Studuješ fyzioterapii? <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="isInTraining"
                    value={formData.isInTraining}
                    onChange={(e) => {
                      setFormData({ ...formData, isInTraining: e.target.value })
                      if (errors.isInTraining) setErrors({ ...errors, isInTraining: undefined })
                    }}
                    className={`flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.isInTraining ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200 focus-visible:ring-seafoam-500"}`}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Vyber...</option>
                    <option value="ano">Ano</option>
                    <option value="ne">Ne</option>
                  </select>
                  {errors.isInTraining && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.isInTraining}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-seafoam-900 mb-4 pb-2 border-b border-seafoam-100">Další informace</h3>
              <div className="space-y-5">
                {/* How Did You Hear */}
                <div className="space-y-2">
                  <Label htmlFor="howDidYouHear" className="text-sm font-medium text-gray-700">Jak jsi se o nás dozvěděl/a?</Label>
                  <select
                    id="howDidYouHear"
                    value={formData.howDidYouHear}
                    onChange={(e) => setFormData({ ...formData, howDidYouHear: e.target.value })}
                    className="flex h-11 w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <option value="">Vyber...</option>
                    <option value="Google">Google</option>
                    <option value="Doporučení">Doporučení</option>
                    <option value="Sociální sítě">Sociální sítě</option>
                    <option value="Jinak">Jinak</option>
                  </select>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-medium text-gray-700">Poznámka</Label>
                  <textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={4}
                    className="flex w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    disabled={isSubmitting}
                    placeholder="Máš nějaké otázky nebo poznámky?"
                  />
                </div>
              </div>
            </div>

            {/* Honeypot field */}
            <div className="sr-only" aria-hidden="true">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="text"
                name="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
                disabled={isSubmitting}
              />
            </div>

            {/* Success message */}
            {submitStatus === "success" && (
              <div className="p-4 bg-gradient-to-r from-seafoam-50 to-emerald-50 border border-seafoam-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-seafoam-900 font-semibold mb-1">Děkujeme za přihlášku!</p>
                  <p className="text-sm text-seafoam-700">Ozveme se vám do 2 pracovních dnů.</p>
                </div>
              </div>
            )}

            {/* Error message */}
            {submitStatus === "error" && errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-900 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full bg-gradient-to-r from-seafoam-600 to-seafoam-500 hover:from-seafoam-500 hover:to-seafoam-400 text-white font-semibold h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Odesílám...
                </span>
              ) : (
                "Odeslat přihlášku"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
