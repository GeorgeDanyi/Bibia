import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/src/config/routes'

// Ensure not-found component is properly exported

export default function NotFound() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-emerald-600">404</h1>
          <h2 className="text-2xl font-semibold text-emerald-900">Stránka nenalezena</h2>
          <p className="text-emerald-700">
            Omlouváme se, ale stránka kterou hledáte neexistuje.
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-emerald-600 font-medium">
            Zkuste tyto hlavní stránky:
          </p>
          
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={ROUTES.questionnaire}>
                Spustit dotazník
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.results}>
                Zobrazit výsledky
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t border-emerald-200">
          <p className="text-xs text-emerald-500">
            Tato stránka se zobrazuje pouze ve vývojovém prostředí
          </p>
        </div>
      </div>
    </div>
  )
}
