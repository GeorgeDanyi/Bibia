import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface InputWithLabelProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

const InputWithLabel = React.forwardRef<HTMLInputElement, InputWithLabelProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId} 
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <Input
          id={inputId}
          className={cn(
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p 
            id={`${inputId}-error`} 
            className="text-sm text-red-600" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`} 
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
InputWithLabel.displayName = "InputWithLabel"

export { InputWithLabel }
