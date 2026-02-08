"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Došlo k chybě. Zkuste to prosím znovu.")
        return
      }

      setSuccess(true)
    } catch (err) {
      setError("Došlo k chybě. Zkuste to prosím znovu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-seafoam-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-seafoam-100 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-seafoam-600 hover:text-seafoam-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-seafoam-900">
            Zapomenuté heslo
          </h1>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-seafoam-50 border border-seafoam-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-seafoam-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-seafoam-900 mb-1">
                    Email odeslán
                  </p>
                  <p className="text-sm text-seafoam-700">
                    Pokud účet s tímto e-mailem existuje, poslali jsme odkaz pro obnovu hesla. 
                    Zkontrolujte svou e-mailovou schránku.
                  </p>
                </div>
              </div>
            </div>
            <Link href="/login">
              <Button className="w-full" variant="outline">
                Zpět na přihlášení
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-seafoam-900 mb-2">
                E-mailová adresa
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.com"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white"
            >
              {loading ? "Odesílám..." : "Poslat odkaz pro obnovu hesla"}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-seafoam-600 hover:text-seafoam-800 underline-offset-4 hover:underline"
              >
                Zpět na přihlášení
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}


