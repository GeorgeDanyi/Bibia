import { GraduationCap, Briefcase, Heart, MessageCircle, Laptop } from "lucide-react"

export function Requirements() {
  const requirements = [
    {
      icon: GraduationCap,
      title: "Osvědčení nebo diplom z fyzioterapie",
      description: "Uznávané vzdělání v oboru fyzioterapie nebo příbuzném oboru",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Briefcase,
      title: "Aktivní praxe nebo studium v oboru",
      description: "Praktické zkušenosti v oboru nebo aktuální studium fyzioterapie",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Heart,
      title: "Profesionální přístup k pacientům",
      description: "Respektující a empatický přístup k pacientům a jejich potřebám",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: MessageCircle,
      title: "Ochota spolupracovat a komunikovat",
      description: "Otevřená komunikace a ochota spolupracovat s týmem",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      icon: Laptop,
      title: "Základní znalost práce s počítačem",
      description: "Komfortní práce s počítačem a moderními technologiemi",
      gradient: "from-indigo-500 to-blue-500"
    }
  ]

  return (
    <section className="py-20 md:py-28 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-seafoam-900 mb-3 md:mb-4">
            Co potřebujeme?
          </h2>
          <p className="text-lg md:text-xl text-seafoam-700 max-w-2xl mx-auto">
            Základní požadavky pro spolupráci
          </p>
        </div>

        {/* Requirements - narrow vertical panels */}
        <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto">
          {requirements.map((requirement, index) => (
            <div
              key={index}
              className="group relative bg-white p-5 md:p-6 rounded-2xl border border-seafoam-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${requirement.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              {/* Content - horizontal layout */}
              <div className="relative flex items-center gap-4 md:gap-5">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-seafoam-100 to-seafoam-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <requirement.icon className="h-6 w-6 md:h-7 md:w-7 text-seafoam-600 group-hover:text-seafoam-700 transition-colors" />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-seafoam-900 mb-0.5 md:mb-1 group-hover:text-seafoam-700 transition-colors">
                    {requirement.title}
                  </h3>
                  <p className="text-sm md:text-base text-seafoam-700 leading-relaxed">
                    {requirement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
