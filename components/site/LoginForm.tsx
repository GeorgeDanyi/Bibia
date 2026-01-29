"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LoginFormProps {
  onSuccess?: () => void
  redirectUrl?: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function LoginForm({ onSuccess, redirectUrl = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100)
    }
  }, [])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setErrors({})

    const newErrors: FormErrors = {}
    
    if (!email.trim()) {
      newErrors.email = "E-mail je povinný"
    } else if (!validateEmail(email)) {
      newErrors.email = "Zadejte platnou e-mailovou adresu"
    }

    if (!password.trim()) {
      newErrors.password = "Heslo je povinné"
    } else if (password.length < 8) {
      newErrors.password = "Heslo musí mít alespoň 8 znaků"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: redirectUrl,
      })

      if (result?.error) {
        setErrors({ general: "Neplatný e-mail nebo heslo." })
        return
      }

      onSuccess?.()
      router.push(result?.url || redirectUrl)
    } catch (error: any) {
      console.error('Error signing in:', error)
      setErrors({ general: 'Chyba při přihlášení. Zkuste to prosím znovu.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email + password fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-seafoam-900"
          >
            E-mail
          </label>
          <Input
            ref={emailInputRef}
            id="login-email"
            type="email"
            placeholder="vas@email.cz"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: undefined })
            }}
            className={cn(
              "h-11 text-sm border-seafoam-200 focus-visible:ring-2 focus-visible:ring-seafoam-400/20 focus-visible:border-seafoam-400 rounded-xl transition-all duration-300",
              errors.email && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500"
            )}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
          {errors.email && (
            <p 
              id="login-email-error" 
              role="alert"
              className="text-sm text-red-600 mt-1"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-seafoam-900"
          >
            Heslo
          </label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Vaše heslo"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: undefined })
              }}
              className={cn(
                "h-11 pr-24 text-sm border-gray-300 focus-visible:ring-2 focus-visible:ring-seafoam-500/20 focus-visible:border-seafoam-500 rounded-lg",
                errors.password && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500"
              )}
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-seafoam-400 hover:text-seafoam-600 text-xs font-medium"
              disabled={isSubmitting}
            >
              {showPassword ? "Skrýt" : "Zobrazit"}
            </button>
          </div>
          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="text-sm text-red-600 mt-1"
            >
              {errors.password}
            </p>
          )}
          <div className="text-right">
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
              className="text-xs font-medium text-seafoam-600 hover:text-seafoam-800 underline-offset-4 hover:underline"
            >
              Zapomenuté heslo?
            </Link>
          </div>
        </div>

      </div>

      {/* General error message - before CTA for visibility */}
      {errors.general && (
        <div 
          role="alert" 
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      {/* Primary CTA - Bibia style */}
      <div className="pt-1">
          <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-seafoam-600 to-seafoam-500 hover:from-seafoam-500 hover:to-seafoam-400 text-white font-semibold text-sm rounded-xl shadow-[0_10px_30px_rgba(0,0,0,.08)] hover:shadow-[0_0_24px_rgba(61,161,136,.35)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-400 focus-visible:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_30px_rgba(0,0,0,.08)]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Přihlašuji...
            </span>
          ) : (
            "Přihlásit se"
          )}
        </Button>
      </div>

    </form>
  )
}

