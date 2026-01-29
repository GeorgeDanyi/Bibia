"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setMessage("")

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600))
      setIsSuccess(true)
      setMessage("Díky! Jsi přihlášen k odběru.")
      setEmail("")
      // Reset success state after 3 seconds
      setTimeout(() => {
        setIsSuccess(false)
        setMessage("")
      }, 3000)
    } catch (error) {
      setMessage("Něco se pokazilo. Zkus to prosím znovu.")
      setIsSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#e9f6f3] py-12 md:py-16">
      {/* animated background elements */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#3da188]/8 blur-2xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#2e8b75]/6 blur-2xl animate-[float_10s_ease-in-out_infinite]" />
      
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <FadeInWhenVisible direction="up">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
              Zůstaň v obraze
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Získávej tipy a novinky od ověřených fyzioterapeutů. Bez spamu.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#3da188]/20">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="email"
                    placeholder="tvůj@email.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email"
                    aria-invalid={!!message && !isSuccess}
                    aria-describedby={message ? "newsletter-message" : undefined}
                    required
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      message && !isSuccess 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-[#3da188]/30 focus:border-[#225f56] focus:ring-[#225f56]/20'
                    }`}
                  />
                  
                  {/* Shield icon for trust */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-[#225f56] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !email.trim()}
                  className="px-6 py-3 bg-[#225f56] hover:bg-[#1a4a42] text-white font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:ring-2 focus:ring-[#225f56] focus:ring-offset-2"
                >
                  {isSubmitting ? "Odesílám…" : "Přihlásit"}
                </Button>
              </div>

              {/* Privacy note */}
              <p className="text-xs text-gray-500 text-center">
                Kdykoli se můžeš odhlásit.
              </p>

              {/* Success/Error message */}
              {message && (
                <div className={`text-center ${isSuccess ? "text-[#225f56]" : "text-red-600"}`}>
                  <p id="newsletter-message" className="text-sm font-medium flex items-center justify-center gap-2">
                    {isSuccess ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {message}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {message}
                      </>
                    )}
                  </p>
                </div>
              )}
            </form>
          </div>
        </FadeInWhenVisible>
      </div>
    </section>
  )
}
