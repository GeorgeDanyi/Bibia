import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-seafoam-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-seafoam-600 hover:text-seafoam-800 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Zpět na hlavní stránku
        </Link>
        
        <div className="bg-white rounded-3xl shadow-sm border border-seafoam-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-seafoam-900 mb-4">
            Kariéra
          </h1>
          <p className="text-seafoam-700 mb-6">
            Stránka "Kariéra" je momentálně v přípravě. Pokud máte zájem o spolupráci, 
            neváhejte nás kontaktovat.
          </p>
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white">
              Kontaktovat nás
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

