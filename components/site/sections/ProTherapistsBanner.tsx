import Link from "next/link"
import { UserCheck, ArrowRight, Heart, Users } from "lucide-react"

export function ProTherapistsBanner() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E9F7F3] to-white p-8 md:p-10 shadow-[0_8px_32px_rgba(21,94,82,0.08)] border border-[#A6E7D8]/30">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-6 right-8 w-20 h-20 bg-[#2FA387]/5 rounded-full blur-2xl" />
            <div className="absolute bottom-6 left-6 w-16 h-16 bg-[#2A8B74]/5 rounded-full blur-xl" />
            <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-[#2FA387]/20 rounded-full animate-pulse" />
          </div>

          <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left side - Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                {/* Illustrative icon */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2FA387] to-[#2A8B74] flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium text-[#2FA387] bg-[#2FA387]/10 px-3 py-1 rounded-full">
                  Pro fyzioterapeuty
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#103B34] mb-4 leading-tight">
                Staň se součástí sítě Bibia ✨
              </h3>
              
              <p className="text-[#4E6E67] text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Spojujeme ověřené fyzioterapeuty s novými klienty. Získej přístup k moderním nástrojům pro správu a růst tvé praxe.
              </p>
            </div>

            {/* Right side - Buttons */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                {/* Primary CTA Button */}
                <Link 
                  href="/pro-terapeuty" 
                  className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#1F705D] to-[#2A8B74] text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-[0_8px_24px_rgba(31,112,93,0.25)] hover:shadow-[0_12px_32px_rgba(31,112,93,0.35)] hover:-translate-y-1 transition-all duration-200 min-w-[200px]"
                >
                  <UserCheck className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  <span>Přidat se jako terapeut</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>

                {/* Secondary Button */}
                <Link 
                  href="/pro-terapeuty#vice" 
                  className="group inline-flex items-center justify-center gap-2 border-2 border-[#2FA387] text-[#2FA387] px-6 py-4 rounded-2xl font-semibold text-lg hover:bg-[#2FA387] hover:text-white transition-all duration-200 min-w-[160px]"
                >
                  <Heart className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Zjistit více</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom decorative element */}
          <div className="absolute bottom-4 right-8 opacity-10">
            <div className="w-8 h-8 bg-[#2FA387] rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
