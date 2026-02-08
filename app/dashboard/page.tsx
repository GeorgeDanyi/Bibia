import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AlertCircle } from "lucide-react"

type DashboardPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()

  if (!session) {
    redirect('/login?redirect=/dashboard')
  }

  const params = await searchParams
  const hasUnauthorizedError = params.error === 'unauthorized'

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Vítej v dashboardu
        </h1>
        
        {hasUnauthorizedError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Nemáte oprávnění</p>
              <p className="text-red-600 text-sm mt-1">
                Pro přístup k administračním stránkám potřebujete oprávnění administrátora.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            Přihlášen jako: <strong>{session.user?.email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Toto je protected route - vidíš ji jen když jsi přihlášený.
          </p>
        </div>
      </div>
    </div>
  )
}

