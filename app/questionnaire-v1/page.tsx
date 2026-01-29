import { Suspense } from "react"
import QuestionnaireV1Client from "./QuestionnaireV1Client"
import { QuestionnaireV1Provider } from "@/deprecated/questionnaire_v1_20250929/questionnaire-v1/QuestionnaireV1Context"

export default function QuestionnaireV1Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0d5e4c] to-[#1b8a70] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/80">Načítání dotazníku...</p>
        </div>
      </div>
    }>
      <QuestionnaireV1Provider>
        <QuestionnaireV1Client />
      </QuestionnaireV1Provider>
    </Suspense>
  )
}
