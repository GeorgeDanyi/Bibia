"use client"

import { useState } from "react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setEmail("")
  }

  return (
    <section className="py-10 md:py-12 bg-white">
      <div className="mx-auto max-w-[560px] w-full px-4 md:px-6">
        {/* BIBIA Seafoam Stacked Newsletter Card */}
        <div 
          className="relative overflow-hidden text-center"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF, #E9F7F3)',
            borderRadius: '20px',
            padding: '32px 24px',
            boxShadow: '0 10px 28px rgba(21,94,82,0.08)'
          }}
        >
          {/* Subtle floating background blob behind icon */}
          <div 
            className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
            style={{
              width: '80px',
              height: '80px',
              background: 'rgba(47,163,135,0.1)',
              borderRadius: '50%',
              filter: 'blur(20px)'
            }}
          />

          {/* Icon */}
          <div className="relative flex justify-center">
            <div 
              className="group cursor-pointer transition-all duration-200"
              style={{
                background: 'linear-gradient(180deg, #2FA387, #2A8B74)',
                color: '#FFFFFF',
                width: '56px',
                height: '56px',
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 12px rgba(47,163,135,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(47,163,135,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(47,163,135,0.2)'
              }}
            >
              <span className="text-white text-xl">🧘</span>
            </div>
          </div>

          {/* Headline */}
          <h2 
            className="font-extrabold leading-tight flex items-center justify-center gap-1.5"
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#103B34',
              marginTop: '16px'
            }}
          >
            <span>Buď v obraze</span>
            <span className="animate-pulse">✨</span>
          </h2>

          {/* Subtitle */}
          <p 
            className="leading-relaxed mx-auto"
            style={{
              fontSize: '15px',
              fontWeight: '500',
              color: '#4E6E67',
              margin: '8px auto 20px',
              maxWidth: '420px'
            }}
          >
            Jednou měsíčně ti pošleme chytré tipy od fyzioterapeutů pro zdravá záda.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex gap-2 mx-auto" style={{ maxWidth: '420px' }}>
            {/* Email input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tvůj@email.cz"
              aria-label="E-mail pro odběr novinek"
              className="flex-1 text-[#103B34] placeholder:text-[#4E6E67] focus:ring-2 focus:ring-[#2FA387] focus:outline-none transition-all duration-200 text-sm hover:border-[#2FA387]"
              style={{
                height: '44px',
                borderRadius: '999px',
                border: '1px solid rgba(47,163,135,.18)',
                padding: '0 14px',
                background: '#FFFBEA'
              }}
              required
            />
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              aria-label="Odeslat e-mail pro odběr novinek"
              className="group text-white font-bold rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2FA387] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm whitespace-nowrap"
              style={{
                height: '44px',
                padding: '0 18px',
                borderRadius: '999px',
                background: 'linear-gradient(180deg, #2FA387, #2A8B74)',
                color: '#FFFFFF',
                fontWeight: '700',
                boxShadow: '0 6px 16px rgba(47,163,135,.22)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(47,163,135,.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(47,163,135,.22)'
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Odesílám...</span>
                </>
              ) : (
                <>
                  <span>Chci tipy</span>
                  <span className="text-sm group-hover:translate-x-0.5 transition-transform duration-200">✉️</span>
                </>
              )}
            </button>
          </form>

          {/* Disclaimer */}
          <p 
            className="text-center"
            style={{
              fontSize: '12px',
              color: 'rgba(16,59,52,.55)',
              marginTop: '12px'
            }}
          >
            Žádný spam. Odhlásit se můžeš kdykoliv.
          </p>
        </div>
      </div>
    </section>
  )
}
