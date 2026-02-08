import { Users, Calendar, TrendingUp, Shield } from "lucide-react"

export function Benefits() {
  const benefits = [
    {
      icon: Users,
      title: "Více klientů",
      description: "Připoj se k platformě, která přivádí nové pacienty přímo k tobě.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Calendar,
      title: "Flexibilní rozvrh",
      description: "Nastav si vlastní dostupnost a pracuj podle svého času.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Růst praxe",
      description: "Buduj svou reputaci a rozšiřuj svou klientelu systematicky.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Shield,
      title: "Důvěryhodnost",
      description: "Ověřený profil zvyšuje důvěru pacientů v tvoje služby.",
      gradient: "from-amber-500 to-orange-500"
    }
  ]

  return (
    <section className="py-20 md:py-28 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-seafoam-900 mb-4">
            Proč se přidat?
          </h2>
          <p className="text-lg text-seafoam-700 max-w-2xl mx-auto">
            Získej přístup k moderní platformě, která ti pomůže růst
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative bg-white p-8 rounded-2xl border border-seafoam-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-seafoam-100 to-seafoam-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <benefit.icon className="h-8 w-8 text-seafoam-600 group-hover:text-seafoam-700 transition-colors" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-seafoam-900 mb-3 group-hover:text-seafoam-700 transition-colors">
                {benefit.title}
              </h3>
              <p className="text-seafoam-700 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
