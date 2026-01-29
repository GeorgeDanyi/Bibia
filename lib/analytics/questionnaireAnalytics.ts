// Privacy-safe analytics system for questionnaire events
// Tracks user interactions without PII for future weight tuning

import { CanonicalCondition, CanonicalDetail } from '../types/questionnaire';

// Event types for questionnaire analytics
export type QuestionnaireEventType = 
  | 'step2_view'           // User views step 2 (conditions selection)
  | 'main_selected'        // User selects/deselects a main condition
  | 'detail_selected'      // User selects/deselects a detail tag
  | 'error_no_main'        // User tries to proceed without selecting main conditions
  | 'next_clicked';        // User clicks next button

// Privacy-safe event payload (no PII)
export type QuestionnaireEventPayload = {
  event: QuestionnaireEventType;
  timestamp: string; // ISO timestamp
  step: number; // Current step number
  // Condition/detail data (only codes, no labels)
  mainConditions?: string[]; // Canonical condition codes
  detailTags?: string[]; // Canonical detail codes
  // Error context
  errorMessage?: string; // Generic error message (no user data)
  // Session context
  sessionId: string; // Anonymous session identifier
};

// Analytics event emitter
class QuestionnaireAnalytics {
  private events: QuestionnaireEventPayload[] = [];
  private sessionId: string;
  private isDevelopment: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private generateSessionId(): string {
    // Generate anonymous session ID (no PII)
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Emit an analytics event
  emit(event: QuestionnaireEventType, context: {
    step: number;
    mainConditions?: CanonicalCondition[];
    detailTags?: CanonicalDetail[];
    errorMessage?: string;
  }): void {
    const payload: QuestionnaireEventPayload = {
      event,
      timestamp: new Date().toISOString(),
      step: context.step,
      sessionId: this.sessionId,
      // Extract only canonical codes (no PII)
      mainConditions: context.mainConditions?.map(c => c.code),
      detailTags: context.detailTags?.map(d => d.code),
      errorMessage: context.errorMessage
    };

    // Store event locally
    this.events.push(payload);

    // Log in development
    if (this.isDevelopment) {
      console.log('📊 Questionnaire Analytics Event:', payload);
    }

    // In production, this would send to analytics service
    // Example: analytics.track('questionnaire_event', payload);
  }

  // Get all events for debugging
  getEvents(): QuestionnaireEventPayload[] {
    return [...this.events];
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Clear events (for testing)
  clearEvents(): void {
    this.events = [];
  }

  // Get events by type
  getEventsByType(eventType: QuestionnaireEventType): QuestionnaireEventPayload[] {
    return this.events.filter(event => event.event === eventType);
  }

  // Get events for current session
  getSessionEvents(): QuestionnaireEventPayload[] {
    return this.events.filter(event => event.sessionId === this.sessionId);
  }
}

// Singleton instance
export const questionnaireAnalytics = new QuestionnaireAnalytics();

// Convenience functions for common events
export const trackStep2View = (step: number) => {
  questionnaireAnalytics.emit('step2_view', { step });
};

export const trackMainSelected = (
  step: number, 
  mainConditions: CanonicalCondition[]
) => {
  questionnaireAnalytics.emit('main_selected', { 
    step, 
    mainConditions 
  });
};

export const trackDetailSelected = (
  step: number, 
  detailTags: CanonicalDetail[]
) => {
  questionnaireAnalytics.emit('detail_selected', { 
    step, 
    detailTags 
  });
};

export const trackErrorNoMain = (step: number, errorMessage: string) => {
  questionnaireAnalytics.emit('error_no_main', { 
    step, 
    errorMessage 
  });
};

export const trackNextClicked = (
  step: number, 
  mainConditions?: CanonicalCondition[],
  detailTags?: CanonicalDetail[]
) => {
  questionnaireAnalytics.emit('next_clicked', { 
    step, 
    mainConditions, 
    detailTags 
  });
};

// Export the analytics instance for direct access
// (already exported above as singleton instance)
