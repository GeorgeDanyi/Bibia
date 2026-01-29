"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Search, MapPin, Globe, Settings, Laptop } from "lucide-react"

export interface EmptyStateStepperProps {
  title: string
  description: string
  currentRadius: number
  onExpandRadius: (newRadius: number) => void
  onModifyPreferences: () => void
  onShowOnline: () => void
  className?: string
}

export function EmptyStateStepper({ 
  title, 
  description, 
  currentRadius,
  onExpandRadius,
  onModifyPreferences,
  onShowOnline,
  className 
}: EmptyStateStepperProps) {
  // Define radius expansion options
  const radiusOptions = [50, 75, 100]
  const availableRadii = radiusOptions.filter(radius => radius > currentRadius)
  const hasReachedMaxRadius = currentRadius >= 100
  
  return (
    <div className={cn("text-center py-16", className)}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-seafoam-50 to-seafoam-100 border border-seafoam-200 rounded-2xl p-8 shadow-soft">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-seafoam-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-seafoam-600" />
          </div>
          
          {/* Content */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {description}
          </p>

          {/* Stepper */}
          <div className="mb-8">
            <div className="bg-white rounded-xl p-6 border border-seafoam-200">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-seafoam-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Aktuální okruh: {currentRadius} km</span>
                </div>
                {availableRadii.length > 0 && (
                  <>
                    <div className="text-seafoam-400">→</div>
                    <div className="flex items-center gap-2 text-seafoam-700">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Rozšířit okruh?</span>
                    </div>
                  </>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                {hasReachedMaxRadius 
                  ? "Dosáhli jsme maximálního okruhu 100 km. Zkuste online konzultace nebo upravte své preference."
                  : "Rozšířením okruhu najdeme více terapeutů, kteří ti mohou pomoci."
                }
              </p>
              
              <div className="flex flex-col gap-4">
                {/* Radius expansion buttons */}
                {availableRadii.length > 0 ? (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {availableRadii.map((radius) => (
                      <Button 
                        key={radius}
                        onClick={() => onExpandRadius(radius)}
                        className="px-6 py-3 bg-seafoam-600 text-white rounded-xl font-semibold hover:bg-seafoam-700 transition-colors shadow-lg hover:shadow-xl"
                      >
                        Rozšířit na {radius} km
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Maximální okruh {currentRadius} km již byl dosažen.
                    </p>
                  </div>
                )}
                
                {/* Edit preferences button */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline"
                    onClick={onModifyPreferences}
                    className="px-6 py-3 border-2 border-seafoam-600 text-seafoam-600 rounded-xl font-medium hover:bg-seafoam-600 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Upravit preference
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Online Mode Option */}
          <div className="border-t border-seafoam-200 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Laptop className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900">Online konzultace</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4 text-center">
                Získejte odbornou pomoc odkudkoliv v České republice. Online konzultace jsou stejně efektivní jako osobní návštěvy.
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={onShowOnline}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <Laptop className="w-4 h-4 mr-2" />
                  Zobrazit online terapeuty
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmptyStateStepper
