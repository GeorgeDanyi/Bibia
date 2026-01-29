"use client"
import { ROUTES } from "@/src/config/routes"

import { useState, useEffect } from "react"

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Smooth scroll handler for arrow button
  const handleScrollToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Try to find the next section after hero
    const heroSection = document.getElementById('hero')
    if (heroSection) {
      const nextSection = heroSection.nextElementSibling
      if (nextSection) {
        nextSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
        return
      }
    }
    
    // Fallback: scroll by viewport height
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
        <section 
          id="hero"
          className="relative overflow-hidden min-h-[72vh] md:min-h-[78vh] flex items-center first:mt-0 pt-[calc(var(--header-h)+1.75rem)] md:pt-[calc(var(--header-h)+2.25rem)]"
          style={{
            scrollMarginTop: 'calc(var(--header-h, 64px) + 1rem)'
          }}
        >
      {/* Layered seafoam gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1c4a44] via-[#2e8b75] to-[#3da188]">
        {/* Subtle animated glow layer */}
        <div className="absolute inset-0 bg-gradient-radial from-[#3da188]/15 via-[#2e8b75]/8 to-transparent animate-[glow_20s_ease-in-out_infinite] motion-reduce:animate-none will-change-transform" />
        {/* Additional depth layer */}
        <div className="absolute inset-0 bg-gradient-to-tl from-[#1c4a44]/20 via-transparent to-[#3da188]/15" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Subtle background illustration on the right */}
      <div className="absolute top-1/4 right-8 md:right-16 opacity-[0.06] pointer-events-none z-0">
        <svg className="w-32 h-32 md:w-40 md:h-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 200 200" strokeWidth="1">
          {/* Organic wave shapes for playful accent */}
          <path d="M20 100 Q60 60, 100 100 T180 100" strokeLinecap="round" opacity="0.8" />
          <path d="M20 120 Q60 80, 100 120 T180 120" strokeLinecap="round" opacity="0.6" />
          <path d="M20 140 Q60 100, 100 140 T180 140" strokeLinecap="round" opacity="0.4" />
          {/* Flowing curves */}
          <path d="M40 40 Q80 80, 120 40" strokeLinecap="round" opacity="0.5" />
          <path d="M40 160 Q80 120, 120 160" strokeLinecap="round" opacity="0.5" />
          {/* Subtle dots for texture */}
          <circle cx="50" cy="50" r="2" opacity="0.3" />
          <circle cx="150" cy="50" r="2" opacity="0.3" />
          <circle cx="50" cy="150" r="2" opacity="0.3" />
          <circle cx="150" cy="150" r="2" opacity="0.3" />
        </svg>
      </div>

      {/* Friendly badges and organic elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Friendly chat badge */}
        <div 
          className="absolute top-16 right-8 md:top-20 md:right-16 bg-[#e9f6f3] backdrop-blur-sm rounded-2xl px-3 py-2 md:px-4 md:py-2 shadow-sm border border-[#2e8b75]/20 animate-float motion-reduce:animate-none hover:translate-y-[-2px] hover:shadow-md/20 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * 0.01}px)`
          }}
          tabIndex={0}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#2e8b75]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="text-xs md:text-sm font-medium text-[#1c4a44]">Online chat 24/7 — jsme tu pro tebe</span>
          </div>
        </div>


        {/* Organic blobs for depth */}
        <div 
          className="absolute top-1/5 right-1/8 w-32 h-32 bg-[#2e8b75]/5 rounded-full blur-lg animate-float motion-reduce:animate-none will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * -0.003}px, ${mousePosition.y * 0.005}px)`
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/5 w-24 h-24 bg-[#3da188]/6 rounded-full blur-md animate-float motion-reduce:animate-none will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * 0.005}px, ${mousePosition.y * -0.003}px)`
          }}
        />
        <div 
          className="absolute top-3/4 right-1/6 w-16 h-16 bg-[#1c4a44]/5 rounded-full blur-sm animate-float motion-reduce:animate-none will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * -0.004}px, ${mousePosition.y * 0.004}px)`
          }}
        />
      </div>

      <div className="relative z-10 w-full pb-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 items-center gap-8 md:gap-12 lg:gap-16">
            {/* Left — content */}
            <div className="text-center lg:text-left">
              <h1 className="text-[clamp(34px,5.6vw,64px)] md:text-[clamp(42px,4.6vw,56px)] font-bold leading-tight tracking-[-0.01em] text-white">
                Najdi si fyzioterapeuta<br className="hidden lg:block" /> během pár minut
              </h1>
              <p className="mt-6 md:mt-7 max-w-[65ch] text-[16px] md:text-[17px] lg:text-[18px] text-white/95 leading-relaxed">
                Jednoduché a rychlé objednání fyzioterapie online – ověření odborníci, jasná hodnocení a volné termíny bez čekání.
              </p>

              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4 lg:gap-5 justify-center lg:justify-start max-w-[65ch]">
                <a 
                  href={ROUTES.questionnaire} 
                  className="group relative inline-flex items-center justify-center h-11 md:h-12 lg:h-14 px-6 md:px-7 lg:px-9 rounded-full bg-gradient-to-r from-[#2e8b75] to-[#3da188] text-white shadow-[0_0_16px_rgba(46,139,117,0.25)] hover:scale-105 hover:bg-gradient-to-r hover:from-[#3da188] hover:to-[#7fd1bf] hover:shadow-[0_0_20px_rgba(46,139,117,0.35)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 focus-visible:ring-offset-2"
                  aria-label="Spustit dotazník a najít fyzioterapeuta"
                >
                  <span className="text-sm md:text-base font-semibold">Najít fyzioterapeuta</span>
                  <svg className="ml-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a 
                  href="/pro-terapeuty" 
                  className="group inline-flex items-center justify-center h-11 md:h-12 lg:h-14 px-5 md:px-6 lg:px-8 rounded-full border-2 border-white/90 text-white hover:bg-white/10 hover:border-white bg-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300"
                >
                  <span className="text-sm md:text-base font-medium">Pro terapeuty</span>
                </a>
              </div>
            </div>

                {/* Right — glassmorphism dashboard mock */}
                <div className="relative flex justify-center lg:justify-end">
                  {/* Spotlight gradient background behind dashboard card */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center w-[600px] h-[600px] blur-3xl rounded-full opacity-[0.15] pointer-events-none -z-10"
                    style={{
                      background: 'radial-gradient(circle, rgba(61,161,136,0.15) 0%, rgba(61,161,136,0) 70%)'
                    }}
                  />
                  
                  {/* Subtle physiotherapy accent behind dashboard */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-0">
                    <svg className="w-40 h-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 100 100" strokeWidth="0.8">
                      {/* Organic wave representing movement and healing */}
                      <path d="M20 50 Q30 30, 50 50 T80 50" strokeLinecap="round" />
                      <path d="M20 60 Q30 40, 50 60 T80 60" strokeLinecap="round" opacity="0.7" />
                      <path d="M20 70 Q30 50, 50 70 T80 70" strokeLinecap="round" opacity="0.5" />
                      {/* Subtle energy flow lines */}
                      <path d="M25 25 Q35 35, 45 25" strokeLinecap="round" opacity="0.4" />
                      <path d="M55 25 Q65 35, 75 25" strokeLinecap="round" opacity="0.4" />
                      <path d="M25 75 Q35 65, 45 75" strokeLinecap="round" opacity="0.4" />
                      <path d="M55 75 Q65 65, 75 75" strokeLinecap="round" opacity="0.4" />
                    </svg>
                  </div>
                  
                  <div className="relative group z-10">
                    {/* Main dashboard card with soft glassmorphism */}
                    <div 
                      className="relative rounded-2xl md:rounded-3xl bg-white/70 backdrop-blur-md px-5 py-4 md:px-8 md:py-6 border border-white/60 shadow-xl/25 transition-all duration-300 hover:rotate-[2deg] hover:scale-105 motion-reduce:transition-none motion-reduce:hover:rotate-0 motion-reduce:hover:scale-100 will-change-transform"
                    >
                      {/* Dashboard header - centered */}
                      <div className="text-center mb-6 md:mb-8">
                        <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gradient-to-br from-[#1c4a44] to-[#2e8b75] flex items-center justify-center">
                            <span className="text-white text-xs md:text-sm font-bold">B</span>
                          </div>
                          <div>
                            <h3 className="text-base md:text-lg font-bold text-[#1c4a44]">Bibia Dashboard</h3>
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-[#2e8b75]">Fyzioterapie online</p>
                      </div>

                      {/* Stats grid - centered */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8">
                        <div className="bg-white/70 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
                          <div className="text-xl md:text-2xl font-bold text-[#1c4a44]">1 247</div>
                          <div className="text-xs md:text-sm text-[#2e8b75]">Aktivní terapeuti</div>
                        </div>
                        <div className="bg-white/70 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
                          <div className="text-xl md:text-2xl font-bold text-[#1c4a44]">4,8</div>
                          <div className="text-xs md:text-sm text-[#2e8b75]">Průměrné hodnocení</div>
                        </div>
                      </div>

                      {/* Recent activity - centered */}
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white/60 rounded-lg">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#2e8b75]/20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#2e8b75]"></div>
                          </div>
                          <div>
                            <div className="text-xs md:text-sm font-medium text-[#1c4a44]">Nové rezervace</div>
                            <div className="text-xs md:text-sm text-[#2e8b75]">+12 dnes</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs md:text-sm text-[#1c4a44] font-bold">+24%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                
                    {/* Floating elements around card */}
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-white/30 rounded-full animate-[float_4s_ease-in-out_infinite] will-change-transform" />
                    <div className="absolute -bottom-4 -left-4 w-4 h-4 bg-white/20 rounded-full animate-[float_5s_ease-in-out_infinite] will-change-transform" />

                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-white/15 to-white/8 blur-lg group-hover:blur-xl transition-all duration-300" />

                {/* Friendly wellness illustration */}
                <div className="absolute -top-12 -right-12 opacity-20">
                  <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 100 100">
                    <path d="M50 20c-16.569 0-30 13.431-30 30 0 8.284 3.358 15.784 8.787 21.213L50 90l21.213-18.787C76.642 65.784 80 58.284 80 50c0-16.569-13.431-30-30-30zm0 40c-5.523 0-10-4.477-10-10s4.477-10 10-10 10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Interactive scroll arrow */}
          <div className="absolute bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 z-20">
            <button
              onClick={handleScrollToNext}
              className="group flex items-center justify-center w-10 h-10 md:w-12 md:h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 rounded-full transition-all duration-300 hover:bg-white/10 cursor-pointer"
              aria-label="Přejít na další sekci"
              type="button"
            >
              <svg className="h-6 w-6 md:h-7 md:w-7 text-white/80 group-hover:text-white transition-colors duration-300 animate-[gentleFloat_6s_ease-in-out_infinite] motion-reduce:animate-none will-change-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

    </section>
  )
}