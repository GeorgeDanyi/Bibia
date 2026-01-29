"use client"

export function FeatureCards() {
  const benefits = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "Správný fyzioterapeut pro tebe",
      description: "Vyber podle potíží, zkušeností a blízkosti. Žádné složité hledání."
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Rychlá rezervace bez stresu",
      description: "Přehledné profily, jasné ceny a volné termíny během chvilky."
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Jen ověření odborníci",
      description: "Všichni terapeuti jsou prověření a recenze od pacientů transparentní."
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Volné termíny hned",
      description: "Aktuální dostupnost v reálném čase. Už žádné čekací listiny."
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Platíš tak, jak ti vyhovuje",
      description: "Bezpečná platba kartou online nebo pohodlně na místě."
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
      ),
      title: "Nejsi na to sám",
      description: "Když něco nevyjde, pomůžeme ti do 24 hodin najít řešení."
    }
  ]

  return (
    <section id="proc-bibia" className="relative isolate py-16 md:py-20 scroll-mt-[calc(var(--header-h,64px)+1rem)]">
      {/* Background layer with gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(61,161,136,0.10),transparent_60%)] md:bg-[radial-gradient(100%_80%_at_50%_0%,rgba(61,161,136,0.12),transparent_58%)]" />
      
      {/* Soft top wave */}
      <div className="absolute top-0 left-0 right-0 h-24 opacity-[0.08]">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
        </svg>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink/95">
            Proč právě Bibia?
          </h2>
          <p className="mt-2 text-base md:text-lg text-ink/70 max-w-2xl mx-auto">
            Výhody, díky kterým je hledání fyzioterapeuta rychlé a bez stresu.
          </p>
        </div>

        <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.title}
              className="group/icon h-full rounded-2xl border border-seafoam-200/50 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)] md:shadow-[0_10px_34px_rgba(0,0,0,0.07)] p-6 md:p-7 transition will-change-transform hover:-translate-y-[3px] hover:shadow-[0_16px_38px_rgba(0,0,0,0.10)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300"
              style={{
                background: 'linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.92)_100%)',
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Icon wrapper */}
              <div className="w-14 h-14 rounded-full bg-seafoam-100 border border-seafoam-200 flex items-center justify-center shadow-[inset_0_0_0_4px_rgba(255,255,255,0.6)] group-hover/icon:shadow-[0_0_0_8px_rgba(61,161,136,0.10)] transition">
                <div className="text-seafoam-700">
                  {benefit.icon}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="mt-4 text-[18px] md:text-[20px] font-semibold text-ink line-clamp-1">
                  {benefit.title}
                </h3>
                
                <p className="mt-1.5 text-[15px] md:text-[16px] text-ink/70 leading-relaxed line-clamp-2">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom micro-CTA */}
        <div className="mt-8 text-center">
          <a 
            href="#jak-to-funguje" 
            className="text-seafoam-700 hover:text-seafoam-800 font-medium underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 focus-visible:ring-offset-2 rounded"
          >
            Jak Bibia funguje →
          </a>
        </div>
      </div>
    </section>
  )
}