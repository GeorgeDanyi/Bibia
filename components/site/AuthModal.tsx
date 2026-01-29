"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Mail, Lock, Send, HeartPulse, ShieldCheck, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormErrors {
  email?: string
  password?: string
}

type AuthMethod = "passwordless" | "password"

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [authMethod, setAuthMethod] = useState<AuthMethod>("passwordless")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Single email input for both methods
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const emailInputRef = useRef<HTMLInputElement>(null)

  // Focus email input when modal opens
  useEffect(() => {
    if (open && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100)
    }
  }, [open, activeTab])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handlePasswordlessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setErrors({ email: "E-mail je povinný" })
      return
    }
    if (!validateEmail(email)) {
      setErrors({ email: "Zadejte platnou e-mailovou adresu" })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    const payload = {
      email,
      type: "magic_link",
      action: activeTab === "login" ? "login" : "signup",
    }
    
    console.log("Magic link payload:", payload)
    setIsSubmitting(false)
    onOpenChange(false)
    resetForm()
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: FormErrors = {}
    
    if (!email.trim()) {
      newErrors.email = "E-mail je povinný"
    } else if (!validateEmail(email)) {
      newErrors.email = "Zadejte platnou e-mailovou adresu"
    }

    if (!password.trim()) {
      newErrors.password = "Heslo je povinné"
    } else if (activeTab === "signup" && password.length < 6) {
      newErrors.password = "Heslo musí mít alespoň 6 znaků"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    const payload = {
      email,
      password,
      type: "email_password",
      action: activeTab === "login" ? "login" : "signup",
    }
    
    console.log("Email/password payload:", payload)
    setIsSubmitting(false)
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setErrors({})
    setShowPassword(false)
    setAuthMethod("passwordless")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "signup")
    resetForm()
  }

  const handleAuthMethodChange = (method: AuthMethod) => {
    setAuthMethod(method)
    setPassword("")
    setErrors({})
  }

  const benefits = [
    { icon: HeartPulse, text: "Najdi vhodného fyzioterapeuta" },
    { icon: ShieldCheck, text: "Bezpečné a ověřené profily" },
    { icon: Clock, text: "Rychlé rezervace termínů" },
  ]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-5xl max-w-[95vw] rounded-3xl border-0 bg-white p-0 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.25)] overflow-hidden [&>button]:z-10 [&>button]:right-6 [&>button]:top-6 [&>button]:text-gray-400 [&>button]:hover:text-gray-600"
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          onOpenChange(false)
        }}
        onInteractOutside={(e) => {
          e.preventDefault()
          onOpenChange(false)
        }}
      >
        <div className="flex flex-col md:flex-row min-h-[500px] md:min-h-[600px]">
          {/* Left Panel - Branding & Visual */}
          <div className="hidden md:flex relative w-full md:w-[42%] bg-gradient-to-br from-[#118A73] via-[#0F7A66] to-[#0D6B58] p-6 md:p-12 flex-col justify-between overflow-hidden order-2 md:order-1">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/8 rounded-full blur-2xl" />
            </div>

            {/* Logo & Brand */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <span className="text-white font-bold text-2xl">B</span>
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">BIBIA</span>
              </div>
              <p className="text-white/90 text-lg leading-relaxed mb-2">
                {activeTab === "login" 
                  ? "Vítej zpět!" 
                  : "Začni svou cestu k lepšímu zdraví"}
              </p>
              <p className="text-white/70 text-sm">
                {activeTab === "login"
                  ? "Přihlas se a pokračuj v hledání fyzioterapeuta"
                  : "Najdi si fyzioterapeuta za pár minut. Rychle, jednoduše a bez komplikací."}
              </p>
            </div>

            {/* Benefits */}
            <div className="relative z-10 space-y-4 mt-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-white/90">
                  <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                    <benefit.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Copyright */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
              <p className="text-white/60 text-xs">
                Copyright © {new Date().getFullYear()} BIBIA. Všechna práva vyhrazena.
              </p>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="relative w-full md:w-[58%] bg-white p-6 md:p-12 flex flex-col order-1 md:order-2">
            <div className="flex-1">
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
              >
                <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-transparent p-1 text-muted-foreground border-b border-gray-200 w-full mb-8">
                  <TabsTrigger
                    value="login"
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:bg-transparent data-[state=active]:text-[#118A73] data-[state=active]:border-[#118A73] data-[state=active]:shadow-none transition-all"
                    aria-label="Přihlášení"
                  >
                    Přihlášení
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:bg-transparent data-[state=active]:text-[#118A73] data-[state=active]:border-[#118A73] data-[state=active]:shadow-none transition-all"
                    aria-label="Vytvořit účet"
                  >
                    Vytvořit účet
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0 space-y-6">
                  <form 
                    onSubmit={authMethod === "passwordless" ? handlePasswordlessSubmit : handlePasswordSubmit}
                    className="space-y-6"
                  >
                    {/* Email input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="login-email"
                        className="text-sm font-medium text-gray-700"
                      >
                        E-mail
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                            "pl-11 h-12 border-gray-300 focus-visible:ring-2 focus-visible:ring-[#118A73] focus-visible:border-[#118A73] text-base",
                            errors.email && "border-red-500 focus-visible:ring-red-500"
                          )}
                          disabled={isSubmitting}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? "login-email-error" : undefined}
                        />
                      </div>
                      {errors.email && (
                        <p id="login-email-error" className="text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    {/* Auth method selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Způsob přihlášení
                      </label>
                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-1.5">
                        <button
                          type="button"
                          onClick={() => handleAuthMethodChange("passwordless")}
                          className={cn(
                            "px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
                            authMethod === "passwordless"
                              ? "bg-white text-[#118A73] shadow-sm border border-[#118A73]/20"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                          aria-label="Bez hesla (doporučeno)"
                          aria-pressed={authMethod === "passwordless"}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn(
                              "h-4 w-4",
                              authMethod === "passwordless" ? "text-[#118A73]" : "text-gray-400"
                            )} />
                            <span>Bez hesla</span>
                          </div>
                          <span className="block text-xs text-gray-500 mt-1 ml-6">(doporučeno)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAuthMethodChange("password")}
                          className={cn(
                            "px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
                            authMethod === "password"
                              ? "bg-white text-[#118A73] shadow-sm border border-[#118A73]/20"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                          aria-label="S heslem"
                          aria-pressed={authMethod === "password"}
                        >
                          <div className="flex items-center gap-2">
                            <Lock className={cn(
                              "h-4 w-4",
                              authMethod === "password" ? "text-[#118A73]" : "text-gray-400"
                            )} />
                            <span>S heslem</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Password field - only when "S heslem" is selected */}
                    {authMethod === "password" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="login-password"
                            className="text-sm font-medium text-gray-700"
                          >
                            Heslo
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              console.log("Zapomenuté heslo")
                            }}
                            className="text-sm text-[#118A73] hover:text-[#0F7A66] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#118A73] focus:ring-offset-2 rounded-sm"
                          >
                            Zapomenuté heslo?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value)
                              if (errors.password) setErrors({ ...errors, password: undefined })
                            }}
                            className={cn(
                              "pl-11 pr-11 h-12 border-gray-300 focus-visible:ring-2 focus-visible:ring-[#118A73] focus-visible:border-[#118A73] text-base",
                              errors.password && "border-red-500 focus-visible:ring-red-500"
                            )}
                            disabled={isSubmitting}
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "login-password-error" : undefined}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#118A73] focus:ring-offset-2 rounded-sm"
                            aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p id="login-password-error" className="text-sm text-red-600">{errors.password}</p>
                        )}
                      </div>
                    )}

                    {/* Submit button */}
                    <Button
                      type="submit"
                      className="w-full h-12 bg-[#118A73] hover:bg-[#0F7A66] text-white font-semibold text-base shadow-sm focus-visible:ring-2 focus-visible:ring-[#118A73] focus-visible:ring-offset-2 transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {authMethod === "passwordless" ? "Odesílám..." : "Přihlašuji..."}
                        </span>
                      ) : (
                        <>
                          {authMethod === "passwordless" ? (
                            <>
                              <Send className="mr-2 h-5 w-5" />
                              Poslat odkaz
                            </>
                          ) : (
                            "Přihlásit"
                          )}
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0 space-y-6">
                  <form 
                    onSubmit={authMethod === "passwordless" ? handlePasswordlessSubmit : handlePasswordSubmit}
                    className="space-y-6"
                  >
                    {/* Email input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="signup-email"
                        className="text-sm font-medium text-gray-700"
                      >
                        E-mail
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          ref={emailInputRef}
                          id="signup-email"
                          type="email"
                          placeholder="vas@email.cz"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (errors.email) setErrors({ ...errors, email: undefined })
                          }}
                          className={cn(
                            "pl-11 h-12 border-gray-300 focus-visible:ring-2 focus-visible:ring-[#118A73] focus-visible:border-[#118A73] text-base",
                            errors.email && "border-red-500 focus-visible:ring-red-500"
                          )}
                          disabled={isSubmitting}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? "signup-email-error" : undefined}
                        />
                      </div>
                      {errors.email && (
                        <p id="signup-email-error" className="text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    {/* Auth method selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Způsob registrace
                      </label>
                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-1.5">
                        <button
                          type="button"
                          onClick={() => handleAuthMethodChange("passwordless")}
                          className={cn(
                            "px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
                            authMethod === "passwordless"
                              ? "bg-white text-[#118A73] shadow-sm border border-[#118A73]/20"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                          aria-label="Bez hesla (doporučeno)"
                          aria-pressed={authMethod === "passwordless"}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn(
                              "h-4 w-4",
                              authMethod === "passwordless" ? "text-[#118A73]" : "text-gray-400"
                            )} />
                            <span>Bez hesla</span>
                          </div>
                          <span className="block text-xs text-gray-500 mt-1 ml-6">(doporučeno)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAuthMethodChange("password")}
                          className={cn(
                            "px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
                            authMethod === "password"
                              ? "bg-white text-[#118A73] shadow-sm border border-[#118A73]/20"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                          aria-label="S heslem"
                          aria-pressed={authMethod === "password"}
                        >
                          <div className="flex items-center gap-2">
                            <Lock className={cn(
                              "h-4 w-4",
                              authMethod === "password" ? "text-[#118A73]" : "text-gray-400"
                            )} />
                            <span>S heslem</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Password field - only when "S heslem" is selected */}
                    {authMethod === "password" && (
                      <div className="space-y-2">
                        <label
                          htmlFor="signup-password"
                          className="text-sm font-medium text-gray-700"
                        >
                          Heslo
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value)
                              if (errors.password) setErrors({ ...errors, password: undefined })
                            }}
                            className={cn(
                              "pl-11 pr-11 h-12 border-gray-300 focus-visible:ring-2 focus-visible:ring-[#118A73] focus-visible:border-[#118A73] text-base",
                              errors.password && "border-red-500 focus-visible:ring-red-500"
                            )}
                            disabled={isSubmitting}
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "signup-password-error" : undefined}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#118A73] focus:ring-offset-2 rounded-sm"
                            aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p id="signup-password-error" className="text-sm text-red-600">{errors.password}</p>
                        )}
                      </div>
                    )}

                    {/* Info text for passwordless */}
                    {authMethod === "passwordless" && (
                      <div className="bg-[#E9F7F3] border border-[#118A73]/20 rounded-xl p-4">
                        <p className="text-sm text-[#0D6B58] leading-relaxed">
                          <strong className="font-semibold">Co se stane dál?</strong> Po odeslání odkazu ti přijde e-mail s odkazem na přihlášení. Kliknutím na odkaz se automaticky přihlásíš a můžeš začít hledat fyzioterapeuta.
                        </p>
                      </div>
                    )}

                    {/* Submit button */}
                    <Button
                      type="submit"
                      className="w-full h-12 bg-[#118A73] hover:bg-[#0F7A66] text-white font-semibold text-base shadow-sm focus-visible:ring-2 focus-visible:ring-[#118A73] focus-visible:ring-offset-2 transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {authMethod === "passwordless" ? "Odesílám..." : "Vytvářím..."}
                        </span>
                      ) : (
                        <>
                          {authMethod === "passwordless" ? (
                            <>
                              <Send className="mr-2 h-5 w-5" />
                              Poslat odkaz
                            </>
                          ) : (
                            "Vytvořit účet"
                          )}
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
