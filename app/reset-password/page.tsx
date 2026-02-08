"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("Chybí token pro obnovu hesla.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Hesla se neshodují.")
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Došlo k chybě. Zkuste to prosím znovu.")
        return
      }

      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?message=password-reset-success")
      }, 3000)
    } catch (err) {
      setError("Došlo k chybě. Zkuste to prosím znovu.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-seafoam-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-seafoam-100 p-8 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Chybí token pro obnovu hesla. Zkontrolujte odkaz v e-mailu.
            </p>
          </div>
          <Link href="/forgot-password">
            <Button className="w-full" variant="outline">
              Požádat o nový odkaz
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-seafoam-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-seafoam-100 p-8 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">
                  Heslo bylo úspěšně změněno
                </p>
                <p className="text-sm text-green-700">
                  Budete přesměrováni na přihlášení...
                </p>
              </div>
            </div>
          </div>
          <Link href="/login">
            <Button className="w-full">
              Pokračovat na přihlášení
            </Button>
          </Link>
        </div>
      </div>
    )
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
            Obnova hesla
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-seafoam-900 mb-2">
              Nové heslo
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimálně 8 znaků"
                required
                disabled={loading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-seafoam-600 hover:text-seafoam-800"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-seafoam-900 mb-2">
              Potvrzení hesla
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Zadejte heslo znovu"
                required
                disabled={loading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-seafoam-600 hover:text-seafoam-800"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white"
          >
            {loading ? "Ukládám..." : "Obnovit heslo"}
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
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-seafoam-50">
        <div className="text-seafoam-700">Načítání...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

