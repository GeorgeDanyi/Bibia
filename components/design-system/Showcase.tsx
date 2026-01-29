"use client"

import { useState } from "react"

export function DesignSystemShowcase() {
  const [inputValue, setInputValue] = useState("")
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)

  return (
    <div className="min-h-screen bg-seafoam-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-h1 text-seafoam-900 mb-4">Bibia Design System</h1>
          <p className="text-body text-seafoam-700 max-w-2xl mx-auto">
            A comprehensive design system for the Bibia physiotherapy platform, 
            ensuring consistency, accessibility, and maintainability.
          </p>
        </div>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "Seafoam 900", value: "var(--seafoam-900)", bg: "bg-seafoam-900" },
              { name: "Seafoam 700", value: "var(--seafoam-700)", bg: "bg-seafoam-700" },
              { name: "Seafoam 600", value: "var(--seafoam-600)", bg: "bg-seafoam-600" },
              { name: "Seafoam 500", value: "var(--seafoam-500)", bg: "bg-seafoam-500" },
              { name: "Seafoam 400", value: "var(--seafoam-400)", bg: "bg-seafoam-400" },
              { name: "Seafoam 300", value: "var(--seafoam-300)", bg: "bg-seafoam-300" },
              { name: "Seafoam 200", value: "var(--seafoam-200)", bg: "bg-seafoam-200" },
              { name: "Seafoam 100", value: "var(--seafoam-100)", bg: "bg-seafoam-100" },
              { name: "White", value: "var(--white)", bg: "bg-white" },
              { name: "Ink", value: "var(--ink)", bg: "bg-ink" },
            ].map((color) => (
              <div key={color.name} className="text-center">
                <div className={`w-20 h-20 ${color.bg} rounded-lg mx-auto mb-2 shadow-soft`} />
                <p className="text-small text-seafoam-700 font-medium">{color.name}</p>
                <p className="text-small text-seafoam-300">{color.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Typography</h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-h1 text-seafoam-900 mb-2">Heading 1 - 48px/56px/700</h1>
              <p className="text-small text-seafoam-300">Hero headlines and major page titles</p>
            </div>
            <div>
              <h2 className="text-h2 text-seafoam-900 mb-2">Heading 2 - 32px/40px/700</h2>
              <p className="text-small text-seafoam-300">Section headlines and important headings</p>
            </div>
            <div>
              <p className="text-body text-seafoam-700 mb-2">Body text - 16px/26px/500</p>
              <p className="text-small text-seafoam-300">Main content, paragraphs, and descriptions</p>
            </div>
            <div>
              <p className="text-small text-seafoam-700 mb-2">Small text - 14px/22px/400</p>
              <p className="text-small text-seafoam-300">Captions, labels, and secondary information</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <button className="btn-ghost">Ghost Button</button>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-glassy p-6">
              <h3 className="text-h2 text-seafoam-900 mb-3">Glassy Card</h3>
              <p className="text-body text-seafoam-700">
                This card demonstrates the glassy effect with backdrop blur and subtle borders.
              </p>
            </div>
            <div className="card-glassy p-6">
              <h3 className="text-h2 text-seafoam-900 mb-3">Hover Effect</h3>
              <p className="text-body text-seafoam-700">
                Hover over this card to see the lift animation and glow effect.
              </p>
            </div>
            <div className="card-glassy p-6">
              <h3 className="text-h2 text-seafoam-900 mb-3">Accessibility</h3>
              <p className="text-body text-seafoam-700">
                All cards include proper focus states and keyboard navigation support.
              </p>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Inputs</h2>
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-small text-seafoam-700 mb-2">Email Address</label>
              <input
                type="email"
                className="input-base"
                placeholder="Enter your email..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-small text-seafoam-700 mb-2">Password</label>
              <input
                type="password"
                className="input-base"
                placeholder="Enter your password..."
              />
            </div>
          </div>
        </section>

        {/* Accordion */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Accordion</h2>
          <div className="card-glassy p-6">
            <button
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full flex items-center justify-between text-left"
              aria-expanded={isAccordionOpen}
            >
              <h3 className="text-h2 text-seafoam-900">Accordion Example</h3>
              <svg
                className={`w-5 h-5 text-seafoam-600 transition-transform duration-300 ${
                  isAccordionOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isAccordionOpen && (
              <div className="mt-4 pt-4 border-t border-seafoam-200">
                <p className="text-body text-seafoam-700">
                  This accordion demonstrates proper accessibility with ARIA attributes,
                  keyboard navigation, and smooth animations.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Animations */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Animations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-glassy p-6 text-center">
              <div className="w-16 h-16 bg-seafoam-400 rounded-lg mx-auto mb-4 animate-float" />
              <h3 className="text-h2 text-seafoam-900 mb-2">Float Animation</h3>
              <p className="text-body text-seafoam-700">Gentle floating motion</p>
            </div>
            <div className="card-glassy p-6 text-center">
              <div className="w-16 h-16 bg-seafoam-400 rounded-lg mx-auto mb-4 animate-pulse-glow" />
              <h3 className="text-h2 text-seafoam-900 mb-2">Pulse Glow</h3>
              <p className="text-body text-seafoam-700">Subtle glow effect</p>
            </div>
            <div className="card-glassy p-6 text-center">
              <div className="w-16 h-16 bg-seafoam-400 rounded-lg mx-auto mb-4 animate-fade-up" />
              <h3 className="text-h2 text-seafoam-900 mb-2">Fade Up</h3>
              <p className="text-body text-seafoam-700">Fade in with upward motion</p>
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-6">
          <h2 className="text-h2 text-seafoam-900">Accessibility</h2>
          <div className="card-glassy p-6">
            <h3 className="text-h2 text-seafoam-900 mb-4">Features</h3>
            <ul className="space-y-2 text-body text-seafoam-700">
              <li>• WCAG AA color contrast compliance</li>
              <li>• Keyboard navigation support</li>
              <li>• Screen reader compatibility</li>
              <li>• Focus indicators on all interactive elements</li>
              <li>• Reduced motion support</li>
              <li>• Semantic HTML structure</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
