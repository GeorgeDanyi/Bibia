'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ROUTES } from '@/src/config/routes'

// Ensure error component is properly exported

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-red-600">Chyba</h1>
          <h2 className="text-2xl font-semibold text-red-900">Něco se pokazilo</h2>
          <p className="text-red-700">
            Omlouváme se, došlo k neočekávané chybě.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex flex-col gap-3">
            <Button onClick={reset} className="w-full">
              Zkusit znovu
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.questionnaire}>
                Spustit dotazník
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Zpět na hlavní stránku
              </Link>
            </Button>
          </div>
        </div>
        
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="pt-4 border-t border-red-200">
            <p className="text-xs text-red-500 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

