"use client"

import { useState } from "react"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: "Lukáš",
      initials: "L",
      quote: "Našel jsem termín hned na druhej den, fakt super. Přístup terapeuta parádní a záda mě po pár sezeních přestaly bolet.",
      rating: 5
    },
    {
      name: "Veronika", 
      initials: "V",
      quote: "Dlouho jsem tápala, kam jít. Tady to bylo hned – klikla jsem, objednala a měla jasno. A hlavně fakt šikovná fyzio, už po pár návštěvách cítím rozdíl.",
      rating: 5
    },
    {
      name: "Roman",
      initials: "R", 
      quote: "Po operaci kolene jsem potřeboval někoho spolehlivýho. Přes Bibia jsem našel fyzioterapeuta kousek od baráku, nemusel jsem nikam složitě jezdit.",
      rating: 5
    },
    {
      name: "Petra",
      initials: "P",
      quote: "Celý den sedím u počítače a bolela mě záda. Našla jsem tady fyzio, která mi ukázala pár cviků a fakt to pomáhá. Jsem za to vděčná.",
      rating: 5
    },
    {
      name: "Michal",
      initials: "M",
      quote: "Za mě pecka, všechno jsem vyřešil online, žádný telefonování. Věděl jsem hned, kdo je volnej a kde má ordinaci.",
      rating: 5
    },
    {
      name: "Jana",
      initials: "J",
      quote: "Měla jsem trochu obavy, ale super, že si tu přečtu hodnocení od ostatních. Přijde mi to férový a člověk ví, kam jde.",
      rating: 5
    },
    {
      name: "Tomáš",
      initials: "T",
      quote: "Bolest zad mě chytla z ničeho nic, potřeboval jsem rychle pomoct. Díky tomu jsem měl fyzioterapeuta ještě ten tejden a dostal mě z toho.",
      rating: 5
    }
  ]

  // Avatar gradient colors
  const avatarGradients = [
    "bg-gradient-to-br from-[#2FA387] to-[#2A8B74]",
    "bg-gradient-to-br from-[#2A8B74] to-[#1F705D]", 
    "bg-gradient-to-br from-[#1F705D] to-[#155E52]",
    "bg-gradient-to-br from-[#2FA387] to-[#1F705D]",
    "bg-gradient-to-br from-[#2A8B74] to-[#155E52]",
    "bg-gradient-to-br from-[#1F705D] to-[#2FA387]"
  ]

  const getAvatarGradient = (index: number) => avatarGradients[index % avatarGradients.length]

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  // Get current 3 testimonials for display
  const getCurrentTestimonials = () => {
    const result = []
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length
      result.push({ ...testimonials[index], originalIndex: index })
    }
    return result
  }

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#103B34] mb-4">
            Zkušenosti našich klientů
          </h2>
          <div className="inline-flex items-center gap-2 text-sm text-[#4E6E67]">
            <Star className="w-4 h-4 fill-current text-amber-500" />
            <span className="font-medium">Hodnocení 4,8/5</span>
            <span>·</span>
            <span>300+ recenzí</span>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Desktop: 3 cards in a row with arrow navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Left Arrow */}
            <button
              onClick={prevSlide}
              className="group flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#2FA387] to-[#2A8B74] flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 hover:shadow-[#2FA387]/25"
            >
              <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </button>

            {/* Testimonials Cards */}
            <div className="flex-1 grid grid-cols-3 gap-6">
              {getCurrentTestimonials().map((testimonial, index) => (
                <div 
                  key={`${testimonial.originalIndex}-${index}`}
                  className="relative rounded-2xl bg-gradient-to-br from-white to-[#E9F7F3] p-6 shadow-[0_8px_24px_rgba(21,94,82,0.08)] border border-[#A6E7D8]/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(21,94,82,0.12)]"
                >
                  {/* Playful quotation mark */}
                  <div className="absolute top-4 right-4 text-[#2FA387]/20">
                    <Quote className="w-6 h-6" />
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full ${getAvatarGradient(testimonial.originalIndex)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#103B34]">{testimonial.name}</div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-[#4E6E67] leading-relaxed text-sm">
                    {testimonial.quote}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={nextSlide}
              className="group flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#2FA387] to-[#2A8B74] flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 hover:shadow-[#2FA387]/25"
            >
              <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>

          {/* Mobile: Single card carousel with smaller arrows */}
          <div className="md:hidden">
            <div className="relative overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="relative rounded-2xl bg-gradient-to-br from-white to-[#E9F7F3] p-6 shadow-[0_8px_24px_rgba(21,94,82,0.08)] border border-[#A6E7D8]/30">
                      {/* Playful quotation mark */}
                      <div className="absolute top-4 right-4 text-[#2FA387]/20">
                        <Quote className="w-6 h-6" />
                      </div>

                      {/* Avatar */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full ${getAvatarGradient(index)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                          {testimonial.initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#103B34]">{testimonial.name}</div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-[#4E6E67] leading-relaxed text-sm">
                        {testimonial.quote}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile navigation arrows - smaller and closer */}
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={prevSlide}
                className="group w-10 h-10 rounded-full bg-gradient-to-r from-[#2FA387] to-[#2A8B74] flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <button
                onClick={nextSlide}
                className="group w-10 h-10 rounded-full bg-gradient-to-r from-[#2FA387] to-[#2A8B74] flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
