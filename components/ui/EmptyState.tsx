"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, MapPin, Clock, Users, MessageCircle, Star } from "lucide-react"
import { Button } from "./button"

export interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  suggestions?: string[]
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  actions, 
  suggestions = [],
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-seafoam-50 to-seafoam-100 border border-seafoam-200 rounded-2xl p-8 shadow-soft">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-seafoam-100 rounded-full flex items-center justify-center">
            {icon || (
              <Search className="w-8 h-8 text-seafoam-600" />
            )}
          </div>
          
          {/* Content */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {description}
          </p>

          {/* Actions */}
          {actions && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              {actions}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Zkus to jinak:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-seafoam-400 mt-2 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function EmptyStateWithAlternatives({ 
  title, 
  description, 
  alternatives = [],
  onContact,
  onModifyFilters,
  className 
}: {
  title: string
  description: string
  alternatives?: Array<{
    id: string
    name: string
    city: string
    distanceKm: number
    specialties: string[]
    rating?: { avg: number; count: number }
  }>
  onContact?: () => void
  onModifyFilters?: () => void
  className?: string
}) {
  return (
    <div className={cn("py-16", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Main empty state */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-br from-seafoam-50 to-seafoam-100 border border-seafoam-200 rounded-2xl p-8 shadow-soft">
            <div className="w-16 h-16 mx-auto mb-6 bg-seafoam-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-seafoam-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {title}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onContact && (
                <Button 
                  onClick={onContact}
                  className="px-8 py-4 bg-seafoam-600 text-white rounded-xl font-semibold hover:bg-seafoam-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Spojit se s námi
                </Button>
              )}
              {onModifyFilters && (
                <Button 
                  variant="outline"
                  onClick={onModifyFilters}
                  className="px-6 py-4 border-2 border-seafoam-600 text-seafoam-600 rounded-xl font-medium hover:bg-seafoam-600 hover:text-white transition-colors"
                >
                  Upravit filtry
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Alternative suggestions */}
        {alternatives.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Doporučené alternativy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alternatives.slice(0, 3).map((alternative) => (
                <div 
                  key={alternative.id} 
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{alternative.name}</h4>
                      <p className="text-sm text-gray-600">{alternative.city}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {alternative.distanceKm.toFixed(0)} km
                    </span>
                  </div>
                  
                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {alternative.specialties.slice(0, 2).map((spec) => (
                      <span key={spec} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  {alternative.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{alternative.rating.avg}</span>
                      <span className="text-xs text-gray-500">({alternative.rating.count})</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1 px-3 py-2 bg-seafoam-600 text-white text-sm rounded-lg hover:bg-seafoam-700 transition-colors">
                      Rezervovat
                    </Button>
                    <Button variant="outline" className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmptyState
