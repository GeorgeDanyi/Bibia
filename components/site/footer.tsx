import Link from "next/link"
import { Facebook, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-100">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-emerald-100 mb-4">O BIBIA</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-emerald-50/80 hover:text-white transition-colors">O nás</Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-emerald-50/80 hover:text-white transition-colors">Jak to funguje</Link>
              </li>
              <li>
                <Link href="/team" className="text-emerald-50/80 hover:text-white transition-colors">Náš tým</Link>
              </li>
              <li>
                <Link href="/careers" className="text-emerald-50/80 hover:text-white transition-colors">Kariéra</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-emerald-100 mb-4">Užitečné</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/faq" className="text-emerald-50/80 hover:text-white transition-colors">Často kladené otázky</Link>
              </li>
              <li>
                <Link href="/insurance" className="text-emerald-50/80 hover:text-white transition-colors">Pojištění</Link>
              </li>
              <li>
                <Link href="/pricing" className="text-emerald-50/80 hover:text-white transition-colors">Ceník</Link>
              </li>
              <li>
                <Link href="/blog" className="text-emerald-50/80 hover:text-white transition-colors">Blog</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-emerald-100 mb-4">Pro fyzioterapeuty</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/pro-terapeuty" className="text-emerald-50/80 hover:text-white transition-colors">Registrace</Link>
              </li>
              <li>
                <Link href="/login" className="text-emerald-50/80 hover:text-white transition-colors">Přihlášení</Link>
              </li>
              <li>
                <Link href="/pro-terapeuty" className="text-emerald-50/80 hover:text-white transition-colors">Výhody spolupráce</Link>
              </li>
              <li>
                <Link href="/contact" className="text-emerald-50/80 hover:text-white transition-colors">Podpora</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-emerald-100 mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-emerald-50/80 hover:text-white transition-colors">Kontaktní formulář</Link>
              </li>
              <li>
                <a href="mailto:info@bibia.cz" className="text-emerald-50/80 hover:text-white transition-colors">info@bibia.cz</a>
              </li>
              <li>
                <a href="tel:+420123456789" className="text-emerald-50/80 hover:text-white transition-colors">+420 123 456 789</a>
              </li>
              <li>
                <Link href="/contact" className="text-emerald-50/80 hover:text-white transition-colors">Technická podpora</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-800">
        <div className="mx-auto max-w-screen-2xl px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" aria-label="Facebook" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700 hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700 hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
            <div className="text-sm text-emerald-300 text-center">
              © {currentYear} BIBIA. Všechna práva vyhrazena. • ICO: 12345678 • GDPR
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
