// EDIT ONLY THIS CANONICAL QUESTIONNAIRE.
// This page mounts the canonical questionnaire client.

import { Suspense } from "react"
import QuestionnaireCanonicalClient from "./QuestionnaireCanonicalClient"
import { QuestionnaireCanonicalProvider } from "./QuestionnaireCanonicalContext"

export default function QuestionnairePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0d5e4c] to-[#1b8a70] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/80">Načítání dotazníku...</p>
        </div>
      </div>
    }>
      <QuestionnaireCanonicalProvider>
        <QuestionnaireCanonicalClient />
      </QuestionnaireCanonicalProvider>
    </Suspense>
  )
}


