"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface RegisterFormProps {
  onSuccess?: () => void
  redirectUrl?: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

interface PasswordRules {
  minLength: boolean
  hasLetter: boolean
  hasNumber: boolean
  hasSymbol: boolean
}

export function RegisterForm({ onSuccess, redirectUrl }: RegisterFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  
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

  // Password rules validation
  const passwordRules: PasswordRules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    }
  }, [password])

  const isPasswordValid = passwordRules.minLength && passwordRules.hasLetter && passwordRules.hasNumber && passwordRules.hasSymbol
  const isEmailValid = email.trim() !== "" && validateEmail(email)
  const isFormValid = isEmailValid && isPasswordValid && acceptTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    setServerError(null)
    
    const newErrors: FormErrors = {}
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = "E-mail je povinný"
    } else if (!validateEmail(email)) {
      newErrors.email = "Zadejte platnou e-mailovou adresu"
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = "Heslo je povinné"
    } else if (!isPasswordValid) {
      newErrors.password = "Heslo nesplňuje všechny požadavky"
    }

    if (!acceptTerms) {
      newErrors.general = "Musíte souhlasit s podmínkami použití"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setServerError(data?.error || "Registrace se nezdařila.")
        return
      }

      onSuccess?.()

      const target = redirectUrl || "/login"
      router.push(target)
    } catch (error) {
      setServerError("Něco se pokazilo. Zkuste to prosím znovu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields - grouped, F-pattern optimized */}
      <div className="space-y-4">
        {/* Email input */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-email"
            className="text-sm font-medium text-seafoam-900"
          >
            E-mail
          </label>
          <Input
            ref={emailInputRef}
            id="register-email"
            type="email"
            placeholder="vas@email.cz"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: undefined })
              setServerError(null)
            }}
            onBlur={() => {
              if (email.trim() && !validateEmail(email)) {
                setErrors(prev => ({ ...prev, email: "Zadejte platnou e-mailovou adresu" }))
              }
            }}
            className={cn(
              "h-11 text-sm border-seafoam-200 focus-visible:ring-2 focus-visible:ring-seafoam-400/20 focus-visible:border-seafoam-400 rounded-xl transition-all duration-300",
              errors.email && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500",
              email.trim() && !errors.email && isEmailValid && "border-seafoam-400"
            )}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "register-email-error" : undefined}
          />
          {errors.email && (
            <p 
              id="register-email-error" 
              role="alert"
              className="text-sm text-red-600 mt-1"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Password input with strength checklist */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-password"
            className="text-sm font-medium text-seafoam-900"
          >
            Heslo
          </label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Zadej heslo"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: undefined })
                setServerError(null)
              }}
              onBlur={() => {
                if (password.trim() && !isPasswordValid) {
                  setErrors(prev => ({ ...prev, password: "Heslo nesplňuje všechny požadavky" }))
                }
              }}
              className={cn(
                "h-11 pr-11 text-sm border-gray-300 focus-visible:ring-2 focus-visible:ring-seafoam-500/20 focus-visible:border-seafoam-500 rounded-lg",
                errors.password && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500",
                password.trim() && !errors.password && isPasswordValid && "border-seafoam-400"
              )}
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "register-password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-seafoam-400 hover:text-seafoam-600 focus:outline-none transition-colors duration-300"
              aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p 
              id="register-password-error" 
              role="alert"
              className="text-sm text-red-600 mt-1"
            >
              {errors.password}
            </p>
          )}
          
          {/* Password strength checklist - compact */}
          {password.trim() && (
            <div className="mt-2 p-3 rounded-xl bg-seafoam-50 border border-seafoam-200">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                    passwordRules.minLength 
                      ? "bg-seafoam-600 text-white" 
                      : "bg-seafoam-200"
                  )}>
                    {passwordRules.minLength && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className={cn(
                    "text-xs transition-colors",
                    passwordRules.minLength ? "text-seafoam-700" : "text-seafoam-600"
                  )}>
                    Min. 8 znaků
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                    passwordRules.hasLetter 
                      ? "bg-seafoam-600 text-white" 
                      : "bg-seafoam-200"
                  )}>
                    {passwordRules.hasLetter && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className={cn(
                    "text-xs transition-colors",
                    passwordRules.hasLetter ? "text-seafoam-700" : "text-seafoam-600"
                  )}>
                    Obsahuje písmeno
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                    passwordRules.hasNumber 
                      ? "bg-seafoam-600 text-white" 
                      : "bg-seafoam-200"
                  )}>
                    {passwordRules.hasNumber && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className={cn(
                    "text-xs transition-colors",
                    passwordRules.hasNumber ? "text-seafoam-700" : "text-seafoam-600"
                  )}>
                    Obsahuje číslo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                    passwordRules.hasSymbol 
                      ? "bg-seafoam-600 text-white" 
                      : "bg-seafoam-200"
                  )}>
                    {passwordRules.hasSymbol && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className={cn(
                    "text-xs transition-colors",
                    passwordRules.hasSymbol ? "text-seafoam-700" : "text-seafoam-600"
                  )}>
                    Obsahuje symbol
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms checkbox - secondary action */}
      <div className="flex items-start pt-1">
        <input
          type="checkbox"
          id="accept-terms"
          checked={acceptTerms}
          onChange={(e) => {
            setAcceptTerms(e.target.checked)
            if (errors.general) setErrors({ ...errors, general: undefined })
            setServerError(null)
          }}
          disabled={isSubmitting}
          className="mt-0.5 h-4 w-4 rounded border-seafoam-200 text-seafoam-600 focus:ring-2 focus:ring-seafoam-400/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
        />
        <label 
          htmlFor="accept-terms" 
          className="ml-2 text-sm font-medium text-seafoam-700 cursor-pointer leading-tight"
        >
          Souhlasím s{" "}
          <Link href="/terms" className="text-seafoam-600 hover:text-seafoam-700 underline-offset-4 hover:underline transition-all font-medium" onClick={(e) => e.stopPropagation()}>
            podmínkami
          </Link>
          {" "}a{" "}
          <Link href="/privacy" className="text-seafoam-600 hover:text-seafoam-700 underline-offset-4 hover:underline transition-all font-medium" onClick={(e) => e.stopPropagation()}>
            ochranou soukromí
          </Link>
        </label>
      </div>

      {/* Error messages - before CTA for visibility */}
      {serverError && (
        <div 
          role="alert" 
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}
      {errors.general && (
        <div 
          role="alert" 
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      {/* Primary CTA - F-pattern bottom, prominent */}
      <div className="pt-1">
        <Button
          type="submit"
          className={cn(
            "w-full h-11 font-semibold text-sm rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-400 focus-visible:ring-offset-2 transition-all duration-300",
            !isFormValid && !isSubmitting
              ? "bg-seafoam-200 text-seafoam-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-seafoam-600 to-seafoam-500 hover:from-seafoam-500 hover:to-seafoam-400 text-white shadow-[0_10px_30px_rgba(0,0,0,.08)] hover:shadow-[0_0_24px_rgba(61,161,136,.35)] hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_30px_rgba(0,0,0,.08)]"
          )}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Vytvářím...
            </span>
          ) : (
            "Vytvořit účet"
          )}
        </Button>
      </div>

    </form>
  )
}
