import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface StepShellProps {
  currentStep: number
  totalSteps: number
  title: string
  description: string
  children: React.ReactNode
  onBack?: () => void
  onNext?: () => void
  isNextDisabled?: boolean
  isSubmitting?: boolean
  nextButtonText?: string
  showBackButton?: boolean
  onReset?: () => void
  showResetButton?: boolean
}

export function StepShell({
  currentStep,
  totalSteps,
  title,
  description,
  children,
  onBack,
  onNext,
  isNextDisabled = false,
  isSubmitting = false,
  nextButtonText = "Continue",
  showBackButton = true,
  onReset,
  showResetButton = false,
}: StepShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back to start link and reset button */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to start
          </Link>
          
          {showResetButton && onReset && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              Reset form
            </Button>
          )}
        </div>

        {/* Step indicator - removed since we now have top progress bar */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Form section */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground text-lg">{description}</p>
            </div>

            <div className="space-y-6">
              {children}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6">
              {showBackButton && onBack ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {onNext && (
                <Button 
                  type="button"
                  onClick={onNext}
                  disabled={isNextDisabled || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? "Processing..." : nextButtonText}
                </Button>
              )}
            </div>
          </section>

          {/* Right side - Illustration placeholder */}
          <section className="hidden lg:block">
            <div 
              role="img"
              aria-label={`Step ${currentStep} illustration`}
              className="w-full h-96 rounded-2xl border bg-muted/30 flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{currentStep}</span>
                </div>
                <p className="text-muted-foreground font-medium">
                  Step {currentStep} Illustration
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
