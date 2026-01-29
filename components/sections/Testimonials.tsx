"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoplay, setIsAutoplay] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const testimonials = [
    {
      name: "Jana P.",
      city: "Praha",
      initials: "JP",
      quote: "Objednáno za pár minut a bez telefonování. Super!",
      rating: 5
    },
    {
      name: "Martin S.",
      city: "Brno",
      initials: "MS",
      quote: "Skvělé vedení po operaci kolene. Doporučuju.",
      rating: 5
    },
    {
      name: "Eva R.",
      city: "Ostrava",
      initials: "ER",
      quote: "Transparentní ceny a volné termíny na pár kliků.",
      rating: 5
    },
    {
      name: "Petr K.",
      city: "Plzeň",
      initials: "PK",
      quote: "Rychlé vyhledání specialisty podle mých potřeb.",
      rating: 5
    },
    {
      name: "Anna M.",
      city: "České Budějovice",
      initials: "AM",
      quote: "Profesionální přístup a skvělé výsledky léčby.",
      rating: 5
    },
    {
      name: "Tomáš V.",
      city: "Hradec Králové",
      initials: "TV",
      quote: "Jednoduché rezervování a kvalitní fyzioterapie.",
      rating: 5
    }
  ]

  // Premium avatar color palette with gradients
  const avatarGradients = [
    "bg-gradient-to-br from-[#1c4a44] to-[#2e8b75]",
    "bg-gradient-to-br from-[#2e8b75] to-[#3da188]", 
    "bg-gradient-to-br from-[#3da188] to-[#7fd1bf]",
    "bg-gradient-to-br from-[#1c4a44] to-[#3da188]",
    "bg-gradient-to-br from-[#2e8b75] to-[#7fd1bf]",
    "bg-gradient-to-br from-[#3da188] to-[#bfe9df]"
  ]

  const getAvatarGradient = (index: number) => avatarGradients[index % avatarGradients.length]

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
    setIsAutoplay(false) // Pause autoplay when user interacts
  }

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : testimonials.length - 1
    goToIndex(newIndex)
  }

  const handleNext = () => {
    const newIndex = currentIndex < testimonials.length - 1 ? currentIndex + 1 : 0
    goToIndex(newIndex)
  }

  // Autoplay functionality with pause on hover
  useEffect(() => {
    if (isAutoplay && !isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex < testimonials.length - 1 ? prevIndex + 1 : 0
        )
      }, 5000) // 5 seconds per slide (slower)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoplay, isHovered, testimonials.length])

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      setIsAutoplay(false)
    }
    
    // Listen for changes in the media query
    const handleChange = (e: MediaQueryListEvent) => {
      setIsAutoplay(!e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#e9f6f3] py-16 md:py-20">
      {/* Subtle animated background elements */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#2e8b75]/6 blur-3xl animate-float motion-reduce:animate-none" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-[#3da188]/4 blur-3xl animate-float motion-reduce:animate-none" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInWhenVisible direction="up">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1c4a44] mb-4">
              Co říkají naši klienti
            </h2>
            <div className="inline-flex items-center gap-2 text-sm text-[#2e8b75] mb-4">
              <Star className="w-4 h-4 fill-current text-amber-500" />
              <span className="font-medium">Hodnocení 4,8/5</span>
              <span>·</span>
              <span>300+ recenzí</span>
            </div>
          </div>
        </FadeInWhenVisible>
        
        {/* 3-card carousel container */}
        <div className="max-w-5xl mx-auto">
          <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="overflow-hidden rounded-3xl">
              <div 
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-1/3 flex-shrink-0 px-4">
                    <div className="group relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-[#2e8b75]/20 card-hover-lg focus-seafoam">
                      {/* Soft gradient accent at the top */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1c4a44] via-[#2e8b75] to-[#3da188] rounded-t-3xl" />
                      
                      {/* Avatar with premium gradient */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 ${getAvatarGradient(index)} rounded-2xl flex items-center justify-center text-white text-lg font-bold group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                          {testimonial.initials}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#1c4a44]">{testimonial.name}</div>
                          {testimonial.city && (
                            <div className="text-sm text-[#2e8b75]">{testimonial.city}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Stars with subtle animation */}
                      <div className="flex items-center gap-1 mb-4" aria-hidden>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className="w-5 h-5 fill-amber-400 text-amber-400 transition-all duration-300 group-hover:scale-110" 
                            style={{ transitionDelay: `${i * 50}ms` }}
                          />
                        ))}
                      </div>
                      
                      {/* Quote with premium typography */}
                      <blockquote className="text-[#1c4a44] leading-relaxed text-base font-medium">
                        &ldquo;{testimonial.quote}&rdquo;
                      </blockquote>

                      {/* Subtle glow effect on hover */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2e8b75]/5 to-[#3da188]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium navigation arrows */}
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-xl hover:bg-white hover:shadow-2xl transition-all duration-300 flex items-center justify-center text-aa-contrast hover:text-aa-contrast-light border border-[#2e8b75]/20 btn-hover focus-seafoam"
              aria-label="Předchozí recenze"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-xl hover:bg-white hover:shadow-2xl transition-all duration-300 flex items-center justify-center text-aa-contrast hover:text-aa-contrast-light border border-[#2e8b75]/20 btn-hover focus-seafoam"
              aria-label="Další recenze"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Premium dots indicator */}
          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-[#1c4a44] to-[#2e8b75] w-10 shadow-lg' 
                    : 'bg-[#2e8b75]/30 hover:bg-[#2e8b75]/50 w-3 hover:w-6'
                }`}
                aria-label={`Přejít na ${index + 1}. recenzi`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}