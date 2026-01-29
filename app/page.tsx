import HeroSection from "@/components/site/sections/Hero"
import { FeatureCards } from "@/components/site/sections/FeatureCards"
import { Steps } from "@/components/site/sections/Steps"
import { UseCases } from "@/components/site/sections/UseCases"
import { InsuranceContribution } from "@/components/site/sections/InsuranceContribution"
import { Newsletter } from "@/components/site/sections/Newsletter"
import { Testimonials } from "@/components/site/sections/Testimonials"
import { ProTherapistsBanner } from "@/components/site/sections/ProTherapistsBanner"
import { Faq } from "@/components/site/sections/Faq"
import { FinalCta } from "@/components/site/sections/FinalCta"

export default function HomePage() {
  return (
    <div className="hover-fast space-y-0">
      <HeroSection />
      <FeatureCards />
      <Steps />
      <UseCases />
      <InsuranceContribution />
      <Newsletter />
      <Testimonials />
      <ProTherapistsBanner />
      <Faq />
      <FinalCta />
    </div>
  )
}
