interface ProgressProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function Progress({ currentStep, totalSteps, className = "" }: ProgressProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100)
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Progress
        </span>
        <span className="text-sm text-muted-foreground">
          {percentage}%
        </span>
      </div>
      
      <div 
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Questionnaire progress: step ${currentStep} of ${totalSteps}`}
        className="w-full bg-muted rounded-full h-2 overflow-hidden"
      >
        <div 
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">Step 1</span>
        <span className="text-xs text-muted-foreground">Step {totalSteps}</span>
      </div>
    </div>
  )
}
