import { Hero } from "./sections/Hero"
import { Benefits } from "./sections/Benefits"
import { Steps } from "./sections/Steps"
import { Requirements } from "./sections/Requirements"
import { TherapistApplyForm } from "./TherapistApplyForm"

export default function ProTerapeutyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Benefits />
      <Steps />
      <Requirements />
      
      {/* Form Section */}
      <section id="form" className="scroll-mt-24 py-16 md:py-24 px-4 bg-gradient-to-b from-white via-seafoam-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-seafoam-900 mb-3">
              Přihláška ke spolupráci
            </h2>
            <p className="text-lg text-seafoam-700 max-w-2xl mx-auto">
              Vyplňte formulář a my se vám ozveme do 2 pracovních dnů
            </p>
          </div>
          <TherapistApplyForm />
        </div>
      </section>
    </div>
  )
}
