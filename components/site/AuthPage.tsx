"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Zap,
  Shield,
  Clock,
} from "lucide-react"
import { AuthCard } from "./AuthCard"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasHistory, setHasHistory] = useState(false)

  // Check if there's meaningful browser history
  useEffect(() => {
    // Check if we can go back (window.history.length > 1 means there's previous page)
    // Also check if referrer exists and is from same origin
    const referrer = document.referrer
    const sameOrigin = referrer && new URL(referrer).origin === window.location.origin
    const canGoBack = typeof window !== 'undefined' && window.history.length > 1
    
    setHasHistory(canGoBack && (sameOrigin || referrer !== ''))
  }, [])

  const handleAuthSuccess = (mode: "login" | "register") => {
    // Get redirect URL from query param or default to "/"
    const nextUrl = searchParams.get('next') || '/'
    
    // Redirect after successful auth
    router.push(nextUrl)
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
              redirectUrl={searchParams.get('next') || undefined}
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
