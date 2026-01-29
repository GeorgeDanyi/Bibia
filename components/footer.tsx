import Link from "next/link"
import { Instagram, Linkedin, Mail, Phone, MessageCircle, ChevronDown, Users, Info, Mail as MailIcon } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#1c4a44] text-[#e9f6f3] relative">
      {/* Country selector ribbon */}
      <div className="bg-[#225f56] border-b border-[#2e8b75]/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-sm">
              <span>Země:</span>
              <div className="flex items-center gap-1 bg-[#1c4a44] rounded-lg px-3 py-1">
                <span className="text-xs font-medium">🇨🇿 Česká republika</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
            </div>
            <div className="text-xs opacity-80">
              Dostupné pouze v ČR
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Logo + claim */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#3da188] to-[#2e8b75] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold text-[#e9f6f3]">BIBIA</span>
            </Link>
            <p className="text-base text-[#e9f6f3]/80 leading-relaxed">
              Pomáháme lidem najít kvalitní fyzioterapii.
            </p>
          </div>

          {/* Column 2: O nás */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#e9f6f3]">
              <Info className="w-4 h-4" />
              O nás
            </h3>
            <div className="space-y-3 text-base">
              <Link 
                href="#how-it-works" 
                className="block text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                Jak to funguje
              </Link>
              <Link 
                href="#therapy" 
                className="block text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                Terapie
              </Link>
              <Link 
                href="#insurance" 
                className="block text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                Pro pojišťovny
              </Link>
              <Link 
                href="#blog" 
                className="block text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* Column 3: Pro terapeuty */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#e9f6f3]">
              <Users className="w-4 h-4" />
              Pro terapeuty
            </h3>
            <div className="space-y-3 text-base">
              <Link 
                href="/pro-terapeuty" 
                className="block text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                Registrace
              </Link>
              <Link 
                href="#conditions" 
                className="block text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                Podmínky spolupráce
              </Link>
              <Link 
                href="#recommendations" 
                className="block text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                Doporučení
              </Link>
            </div>
          </div>

          {/* Column 4: Kontakt */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#e9f6f3]">
              <MailIcon className="w-4 h-4" />
              Kontakt
            </h3>
            <div className="space-y-4 text-base">
              <Link 
                href="#contact-form" 
                className="flex items-center gap-3 text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span>Kontakt. formulář</span>
              </Link>
              <Link 
                href="mailto:podpora@bibia.cz" 
                className="flex items-center gap-3 text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>podpora@bibia.cz</span>
              </Link>
              <Link 
                href="tel:+420123456789" 
                className="flex items-center gap-3 text-[#e9f6f3]/80 hover:text-[#e9f6f3] hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+420 123 456 789</span>
              </Link>
              <div className="flex items-center gap-4 pt-2">
                <Link 
                  href="#" 
                  className="text-[#e9f6f3]/60 hover:text-[#e9f6f3] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </Link>
                <Link 
                  href="#" 
                  className="text-[#e9f6f3]/60 hover:text-[#e9f6f3] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#1c4a44] rounded-sm"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal line - thin bottom bar */}
      <div className="border-t border-[#2e8b75]/30 bg-[#153b36]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[#e9f6f3]/60">
            <p>© 2025 BIBIA • IČO 12345678</p>
            <div className="flex items-center gap-4">
              <Link 
                href="#gdpr" 
                className="hover:text-[#e9f6f3]/80 hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#153b36] rounded-sm"
              >
                GDPR
              </Link>
              <Link 
                href="#terms" 
                className="hover:text-[#e9f6f3]/80 hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#153b36] rounded-sm"
              >
                Podmínky
              </Link>
              <Link 
                href="#privacy" 
                className="hover:text-[#e9f6f3]/80 hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3da188] focus:ring-offset-2 focus:ring-offset-[#153b36] rounded-sm"
              >
                Soukromí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

