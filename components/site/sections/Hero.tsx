"use client"

import Image from "next/image";
import { useState, useEffect } from "react";
import { ROUTES } from "@/src/config/routes";

// Configuration
const QUESTIONNAIRE_URL = ROUTES.questionnaire;
const HOW_IT_WORKS_URL = '/jak-to-funguje';

export default function HeroSection() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);

  // Analytics tracking
  const track = (name: string, props: Record<string, any> = {}) => {
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: name, ...props });
    }
  };

  const timeSlots = [
    "Pá 20. 9. • 11:00",
    "So 21. 9. • 16:30",
    "Ne 22. 9. • 09:30"
  ];

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Auto-rotate time slots for widget display
  useEffect(() => {
    if (isReducedMotion) return;

    // Add delay to prevent conflicts with initial animations
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrentSlotIndex((prev) => (prev + 1) % timeSlots.length);
      }, 3000);

      return () => clearInterval(interval);
    }, 2000); // Wait 2 seconds before starting rotation

    return () => clearTimeout(timer);
  }, [isReducedMotion, timeSlots.length]);

  // Click handlers for analytics only (let default navigation work)
  useEffect(() => {
    const handlePrimaryClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.cta-primary, .nav-reserve')) {
        track('cta_click', { location: target.closest('.nav-reserve') ? 'nav' : 'hero', label: 'najit_fyzioterapeuta' });
        // Don't prevent default - let the anchor tag work normally
      }
    };

    const handleSecondaryClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.cta-secondary')) {
        track('cta_click', { location: 'hero', label: 'jak_to_funguje' });
        // Don't prevent default - let the anchor tag work normally
      }
    };

    document.addEventListener('click', handlePrimaryClick);
    document.addEventListener('click', handleSecondaryClick);

    return () => {
      document.removeEventListener('click', handlePrimaryClick);
      document.removeEventListener('click', handleSecondaryClick);
    };
  }, []);

  return (
    <>
      <style jsx>{`
        /* GPU-optimized utility classes */
        /* GPU acceleration classes removed to prevent visual artifacts */

        .press {
          transition: transform 100ms cubic-bezier(0.2, 0.7, 0.3, 1);
        }

        .press:active {
          transform: translateY(0) scale(0.995);
        }

        /* Button styles - GPU optimized */
        .btn {
          transform: translate3d(0, 0, 0);
          will-change: transform, opacity;
          backface-visibility: hidden;
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
          text-decoration: none;
          display: inline-flex;
          cursor: pointer;
          position: relative;
          z-index: 20;
        }

        .btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #B6F0D0, 0 0 0 6px rgba(182, 240, 208, 0.35);
        }

        .btn:hover {
          transform: translateY(-1px);
          text-decoration: none;
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn-primary {
          background: white;
          color: #007f4f;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .btn-secondary {
          border: 2px solid white;
          color: white;
        }

        .btn-content {
          /* Text content wrapper - no transforms applied to this */
        }

        /* iOS-style floating widgets - clean and simple */
        .ios-widget {
          position: absolute;
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 16px;
          z-index: 10;
          opacity: 1;
          /* No animations, transforms, or GPU acceleration */
          animation: none;
          transition: none;
          transform: none;
          will-change: auto;
          backface-visibility: visible;
          outline: none;
        }

        .ios-widget:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
          .ios-widget, .btn, .widget {
            transform: none !important;
          }
        }

        /* Font smoothing for better text rendering */
        html {
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        /* Remove any potential debug styles or browser dev tools interference */
        * {
          outline: none !important;
        }
        
        /* Ensure no debug borders or outlines */
        .ios-widget * {
          outline: none !important;
        }
        
        /* Remove any potential browser dev tools grid lines */
        .ios-widget::before,
        .ios-widget::after {
          display: none !important;
        }

        /* Clean widget styling without conflicts */
        .ios-widget * {
          outline: none;
        }


        /* All animations removed to prevent visual artifacts */

        .widget-icon {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          margin-bottom: 10px;
          flex-shrink: 0;
        }

        .widget-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 5px;
          line-height: 1.2;
        }

        .widget-subtitle {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
          font-weight: 500;
        }

        .widget-large {
          width: 150px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .widget-medium {
          width: 160px;
        }

        .widget-small {
          width: 140px;
        }

        .widget-pill {
          width: auto;
          padding: 8px 16px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rating-stars {
          display: flex;
          gap: 3px;
          margin-bottom: 6px;
          align-items: center;
        }

        .star {
          width: 13px;
          height: 13px;
          color: #ffb400;
          flex-shrink: 0;
        }

        .time-slot {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .time-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          flex-shrink: 0;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .ios-widget {
            position: static;
            margin: 8px auto;
            width: 100% !important;
            max-width: 280px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ios-widget {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
      <section className="relative w-full h-screen overflow-hidden" style={{ zIndex: 0, background: 'radial-gradient(500px 250px at 5% 5%, rgba(255,255,255,0.35), rgba(0,0,0,0) 35%), radial-gradient(500px 250px at 95% 95%, rgba(255,255,255,0.3), rgba(0,0,0,0) 35%), linear-gradient(180deg, #118A73 0%, #0F7A66 55%, #0D6B58 100%)' }}>
      
      {/* BIBIA Logo - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <a href="/" className="text-white text-4xl font-bold tracking-wide hover:opacity-80 transition-opacity duration-200">
          BIBIA
        </a>
      </div>

      {/* Radial vignette behind person image */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[400px] h-[400px] bg-black/18 rounded-full blur-[120px]" style={{ zIndex: 1 }}></div>
      
      {/* Soft ambient background shapes */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-32 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/8 rounded-full blur-3xl" />
      </div>

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
        {/* Subtle curved lines */}
        <svg className="absolute top-1/4 left-0 w-full h-full opacity-5" viewBox="0 0 1200 800" fill="none">
          <path d="M0,200 Q300,150 600,200 T1200,200" stroke="white" strokeWidth="2" />
          <path d="M0,400 Q400,350 800,400 T1200,400" stroke="white" strokeWidth="1.5" />
        </svg>
        {/* Light calendar watermark */}
        <div className="absolute top-1/3 right-1/3 opacity-3">
          <svg className="w-16 h-16 text-white/10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-8 lg:px-10 relative z-10 h-full flex items-center">
        <div className="md:grid md:grid-cols-[1.2fr_0.8fr] md:gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Side - Text */}
          <div className="text-left max-w-[720px] flex flex-col justify-center">
            {/* Main heading */}
            <h1 className="text-[48px] font-extrabold text-white mb-6" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif', letterSpacing: '-0.01em', lineHeight: '1.15' }}>
              Najdi si <span className="relative inline-block px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                fyzioterapeuta
              </span>,<br />
              který ti opravdu pomůže
            </h1>
            
            {/* Subtext */}
            <p className="text-[1.25rem] text-[#E5E5E5] max-w-[70%] mb-10" style={{ letterSpacing: '0em', lineHeight: '1.5', opacity: '0.92' }}>
              Rychlá online rezervace. Ověření odborníci. Volné termíny bez čekání. Začni už dnes.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex items-center gap-4 mb-8 relative z-20">
              <a 
                href={ROUTES.questionnaire}
                className="btn btn-primary cta-primary inline-flex items-center gap-3 rounded-full bg-white text-[#007f4f] px-8 py-4 text-base font-semibold shadow-lg relative z-20"
                aria-label="Spustit dotazník a najít fyzioterapeuta"
                onClick={() => console.log('Primary CTA clicked')}
              >
                <span className="btn-content">Najít fyzioterapeuta</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a 
                href={HOW_IT_WORKS_URL}
                className="btn btn-secondary cta-secondary inline-flex items-center gap-3 rounded-full border-2 border-white text-white px-8 py-4 text-base font-semibold relative z-20"
                aria-label="Zjistit, jak služba funguje"
                onClick={() => console.log('Secondary CTA clicked')}
              >
                <span className="btn-content">Jak to funguje</span>
              </a>
            </div>
            
            {/* Social proof - positioned at bottom */}
            <div className="mt-auto">
              <div className="flex items-center gap-3 text-white text-sm font-medium">
                <div className="flex -space-x-1.5">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white">
                    A
                  </span>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white">
                    B
                  </span>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-500 border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white">
                    C
                  </span>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-300 to-green-400 border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white">
                    +
                  </span>
                </div>
                <span>Připoj se ke stovkám spokojených, kteří už našli svého fyzioterapeuta.</span>
              </div>
            </div>
          </div>

          {/* Right Side - Image + Cards */}
          <div className="relative md:justify-self-end mt-12 md:mt-0">
            {/* Person image container with elliptical shadow */}
            <div className="relative max-w-[520px] w-full mx-auto" style={{ zIndex: 3 }}>
              <div className="relative">
                {/* Radial gradient glow behind person */}
                <div className="absolute inset-0 bg-gradient-radial from-white/20 via-white/5 to-transparent rounded-full blur-[80px] scale-110" style={{ zIndex: 0 }}></div>
                
                <Image
                  src="/images/person5.png"
                  alt="Osoba používající telefon pro rezervaci fyzioterapeuta"
                  width={520}
                  height={520}
                  className="w-full h-auto object-contain relative"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 520px"
                  style={{ zIndex: 2 }}
                />
                
                {/* Smooth circular/oval fade overlay */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[120%] h-[200px] bg-gradient-to-t from-[#C8E9D0] via-[#C8E9D0]/80 to-transparent rounded-full pointer-events-none" style={{ zIndex: 1 }}></div>
                
                {/* Soft bottom fade-out gradient */}
                <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-[#C8E9D0] to-transparent pointer-events-none" style={{ zIndex: 3 }}></div>
                
                {/* Elliptical shadow under person */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[140%] h-[80px] bg-black/15 rounded-full blur-[60px] scale-110" style={{ zIndex: 1 }}></div>
              </div>
            </div>

                {/* iOS-style Floating Widgets - Clean implementation */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                  {/* Widget 1: Confirmation (top-left corner) */}
                  <div className="ios-widget widget-large" style={{ top: '2%', left: '-12%' }} role="status" aria-live="polite" aria-atomic="true">
                    <div className="widget-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="widget-title">Rezervace potvrzena</div>
                    <div className="widget-subtitle">Út 24. 9. • 14:00</div>
                  </div>

                  {/* Widget 2: Available Times (top-right corner) */}
                  <div className="ios-widget widget-large" style={{ top: '2%', right: '-12%' }}>
                    <div className="widget-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="widget-title">Volné termíny</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                      <div className="time-slot">
                        <div className="time-dot"></div>
                        {timeSlots[currentSlotIndex]}
                      </div>
                      <div className="time-slot">
                        <div className="time-dot"></div>
                        {timeSlots[(currentSlotIndex + 1) % timeSlots.length]}
                      </div>
                    </div>
                  </div>

                  {/* Widget 3: Rating (bottom-left corner) */}
                  <div className="ios-widget widget-large" style={{ bottom: '-2%', left: '-12%' }}>
                    <div className="widget-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div className="widget-title">4,8 z 5</div>
                    <div className="rating-stars">
                      <span className="star">★</span>
                      <span className="star">★</span>
                      <span className="star">★</span>
                      <span className="star">★</span>
                      <span className="star">★</span>
                    </div>
                    <div className="widget-subtitle">127 recenzí</div>
                  </div>

                  {/* Widget 4: Today's Bookings (bottom-right corner) */}
                  <div className="ios-widget widget-large" style={{ bottom: '-2%', right: '-12%' }}>
                    <div className="widget-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="widget-title">Dnes rezervováno</div>
                    <div className="widget-subtitle">12 lidí si objednalo termín</div>
                  </div>

                </div>

          </div>

        </div>
        
        {/* Bottom arrow with subtle animation */}
        <button 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 p-2 rounded-full group"
          onClick={() => {
            const nextSection = document.querySelector('section:nth-of-type(2)');
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          aria-label="Scroll to next section"
        >
          <svg className="w-6 h-6 text-white/60 group-hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      </section>
    </>
  )
}