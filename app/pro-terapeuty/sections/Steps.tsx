import { FileText, CheckCircle2, User, Users, TrendingUp } from "lucide-react"

export function Steps() {
  const steps = [
    {
      icon: FileText,
      title: "Vyplň přihlášku",
      description: "Pošli nám základní informace o sobě a své praxi.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: CheckCircle2,
      title: "Ověření",
      description: "Zkontrolujeme tvou kvalifikaci a ověříme údaje.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: User,
      title: "Profil",
      description: "Vytvoříme ti profesionální profil na naší platformě.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Users,
      title: "Začni přijímat klienty",
      description: "Pacienti tě najdou a mohou si u tebe objednat konzultaci.",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      icon: TrendingUp,
      title: "Růst praxe",
      description: "Sleduj svůj růst a buduj dlouhodobé vztahy s klienty.",
      gradient: "from-indigo-500 to-blue-500"
    }
  ]

  return (
    <section className="py-20 md:py-28 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-seafoam-900 mb-4">
            Jak to funguje?
          </h2>
          <p className="text-lg text-seafoam-700 max-w-2xl mx-auto">
            Jednoduchý proces v pěti krocích
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, index) => {
              const stepNumber = index + 1
              
              return (
                <div key={index} className="relative">
                  <div
                    className="group relative bg-white p-8 rounded-2xl border border-seafoam-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                    
                    {/* Icon with step number badge */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-seafoam-100 to-seafoam-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm relative">
                        <step.icon className="h-8 w-8 text-seafoam-600 group-hover:text-seafoam-700 transition-colors" />
                        {/* Step number badge on icon */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-seafoam-500 to-seafoam-600 text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-white">
                          {stepNumber}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-seafoam-900 mb-3 group-hover:text-seafoam-700 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-seafoam-700 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
