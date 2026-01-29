import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login?redirect=/dashboard')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Vítej v dashboardu
        </h1>
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

