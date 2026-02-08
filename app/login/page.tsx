"use client"

import { useState, useEffect, Suspense } from "react"
import NextDynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { sanitizeRedirectUrl } from "@/lib/utils/auth"
import {
  ArrowLeft,
  Zap,
  Shield,
  Clock,
} from "lucide-react"
import Link from "next/link"

// Dynamically import AuthCard with SSR disabled
const AuthCard = NextDynamic(
  async () => {
    const mod = await import("@/components/site/AuthCard")
    return { default: mod.AuthCard }
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-seafoam-200/50 shadow-[0_10px_30px_rgba(0,0,0,.08)] p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-seafoam-200 rounded w-32 mb-4"></div>
            <div className="h-4 bg-seafoam-100 rounded w-48 mb-6"></div>
            <div className="space-y-3">
              <div className="h-11 bg-seafoam-100 rounded"></div>
              <div className="h-11 bg-seafoam-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  }
)

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasHistory, setHasHistory] = useState(false)
  // Priority: next > callbackUrl > redirect
  const rawRedirect =
    searchParams.get("next") || searchParams.get("callbackUrl") || searchParams.get("redirect") || null
  const redirectUrl = sanitizeRedirectUrl(rawRedirect)

  // Check if there's meaningful browser history
  useEffect(() => {
    const referrer = document.referrer
    const sameOrigin = referrer && new URL(referrer).origin === window.location.origin
    const canGoBack = typeof window !== 'undefined' && window.history.length > 1
    
    setHasHistory(canGoBack && (sameOrigin || referrer !== ''))
  }, [])

  const handleAuthSuccess = (mode: "login" | "register") => {
    router.push(redirectUrl)
  }

  return (
    <div className="h-screen bg-seafoam-100 relative overflow-hidden">
      {/* Back link - Bibia style */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => {
            if (hasHistory) {
              router.back()
            } else {
              router.push('/')
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-seafoam-700 hover:text-seafoam-900 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zpět</span>
        </button>
      </div>

      {/* Main content */}
      <div className="h-screen flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Marketing content with Bibia colors */}
          <div className="hidden md:flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-seafoam-900 leading-tight tracking-tight">
                Najdi si fyzioterapeuta<br />během pár minut
              </h1>
              <p className="text-base font-medium text-seafoam-700 leading-relaxed max-w-lg">
                Připoj se k tisícům spokojených klientů, kteří našli svého ideálního terapeuta díky naší platformě.
              </p>
            </div>

            {/* Benefits - Bibia style */}
            <div className="space-y-3">
              {[
                { icon: Zap, text: "Okamžité výsledky" },
                { icon: Shield, text: "Ověření odborníci" },
                { icon: Clock, text: "Rychlé rezervace" },
              ].map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-seafoam-200 border border-seafoam-300/50">
                    <benefit.icon className="h-5 w-5 text-seafoam-600" />
                  </div>
                  <span className="text-sm font-medium text-seafoam-700">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - AuthCard */}
          <div className="w-full flex justify-center md:justify-end">
            <AuthCard 
              onSuccess={handleAuthSuccess}
              redirectUrl={redirectUrl}
            />
          </div>
        </div>
      </div>

      {/* Bottom footer - Bibia style */}
      <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-seafoam-600">
          <Link href="/terms" className="hover:text-seafoam-700 transition-colors duration-300">
            Podmínky
          </Link>
          <span className="text-seafoam-300">•</span>
          <Link href="/pricing" className="hover:text-seafoam-700 transition-colors duration-300">
            Ceník
          </Link>
          <span className="text-seafoam-300">•</span>
          <Link href="/contact" className="hover:text-seafoam-700 transition-colors duration-300">
            Kontakt
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-seafoam-100 flex items-center justify-center">
        <div className="text-seafoam-700">Načítání...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

// Disable SSR to prevent hydration issues
export const dynamic = 'force-dynamic'
