import Link from "next/link"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-seafoam-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-seafoam-600 hover:text-seafoam-800 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Zpět na hlavní stránku
        </Link>
        
        <div className="bg-white rounded-3xl shadow-sm border border-seafoam-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-seafoam-900 mb-6">
            Kontakt
          </h1>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <Mail className="h-5 w-5 text-seafoam-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-seafoam-900 mb-1">Email</h3>
                <a href="mailto:info@bibia.cz" className="text-seafoam-700 hover:text-seafoam-900">
                  info@bibia.cz
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <Phone className="h-5 w-5 text-seafoam-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-seafoam-900 mb-1">Telefon</h3>
                <a href="tel:+420123456789" className="text-seafoam-700 hover:text-seafoam-900">
                  +420 123 456 789
                </a>
              </div>
            </div>
          </div>
          
          <p className="text-seafoam-700 mb-6">
            Kontaktní formulář je momentálně v přípravě. Použijte prosím email nebo telefon.
          </p>
          
          <Link href="/">
            <Button className="bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white">
              Zpět na hlavní stránku
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

