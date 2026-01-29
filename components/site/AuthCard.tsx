"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "register"

interface AuthCardProps {
  onSuccess?: (mode: AuthMode) => void
  redirectUrl?: string
}

export function AuthCard({ onSuccess, redirectUrl }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<AuthMode>("login")

  return (
    <div className="w-full max-w-md">
      {/* Bibia card - glassy style with Bibia design system */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-seafoam-200/50 shadow-[0_10px_30px_rgba(0,0,0,.08)] transition-all duration-300 flex flex-col hover:shadow-[0_0_24px_rgba(61,161,136,.35)] overflow-hidden">
        <div className="p-6 pb-4 flex-shrink-0">
          <Tabs defaultValue="login" className="w-full" onValueChange={(value) => setActiveTab(value as AuthMode)}>
            {/* Compact header - F-pattern optimized */}
            <div className="mb-6">
              {/* Tabs first - top of F-pattern */}
              <div className="flex items-center gap-8 mb-5 border-b border-seafoam-200">
                <TabsList className="inline-flex items-center gap-8 p-0 bg-transparent border-0">
                  <TabsTrigger
                    value="login"
                    className={cn(
                      "px-0 py-2.5 text-sm font-medium text-seafoam-700 transition-all duration-300 relative border-0 bg-transparent",
                      "data-[state=active]:text-seafoam-600 data-[state=active]:font-semibold",
                      "data-[state=inactive]:hover:text-seafoam-900",
                      "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:bg-seafoam-600 before:transition-all before:duration-300",
                      "data-[state=active]:before:scale-x-100",
                      "data-[state=inactive]:before:scale-x-0 data-[state=inactive]:before:opacity-0"
                    )}
                  >
                    Přihlášení
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className={cn(
                      "px-0 py-2.5 text-sm font-medium text-seafoam-700 transition-all duration-300 relative border-0 bg-transparent",
                      "data-[state=active]:text-seafoam-600 data-[state=active]:font-semibold",
                      "data-[state=inactive]:hover:text-seafoam-900",
                      "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:bg-seafoam-600 before:transition-all before:duration-300",
                      "data-[state=active]:before:scale-x-100",
                      "data-[state=inactive]:before:scale-x-0 data-[state=inactive]:before:opacity-0"
                    )}
                  >
                    Registrace
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Title - F-pattern horizontal bar */}
              <h1 className="text-2xl font-bold text-seafoam-900 mb-1">
                {activeTab === "login" ? "Vítej zpět" : "Začni ještě dnes"}
              </h1>
              <p className="text-sm font-medium text-seafoam-700">
                {activeTab === "login" 
                  ? "Přihlas se ke svému účtu" 
                  : "Vytvoř si účet a začni hledat"}
              </p>
            </div>
          </Tabs>
        </div>

        {/* Form content - smooth transitions */}
        <div className="flex-1 overflow-visible px-6 transition-all duration-300">
          <Tabs defaultValue="login" className="w-full" onValueChange={(value) => setActiveTab(value as AuthMode)}>
            <TabsContent value="login" className="mt-0">
              <LoginForm 
                onSuccess={() => onSuccess?.("login")}
                redirectUrl={redirectUrl}
              />
            </TabsContent>
            <TabsContent value="register" className="mt-0">
              <RegisterForm 
                onSuccess={() => onSuccess?.("register")}
                redirectUrl={redirectUrl}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Trust signal - fixed at bottom, inside card */}
        <div className="flex-shrink-0 px-6 pt-3 pb-4 border-t border-seafoam-100">
          <p className="text-xs text-center text-seafoam-600 font-medium">
            {activeTab === "login" 
              ? "Vaše údaje jsou v bezpečí" 
              : "Registrace je zdarma a trvá pár sekund"}
          </p>
        </div>
      </div>
    </div>
  )
}

