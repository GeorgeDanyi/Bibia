// Debug panel for questionnaire analytics (development only)
// Shows current selections and emitted events

"use client";

import { useState, useEffect } from 'react';
import { questionnaireAnalytics, QuestionnaireEventPayload } from '@/lib/analytics/questionnaireAnalytics';
import { QuestionnaireAnswers } from '@/lib/types/questionnaire';
import { getCzechConditionLabel, getCzechDetailLabel } from '@/lib/constants/canonical-taxonomy';
import { Eye, EyeOff, Trash2, Copy, Activity } from 'lucide-react';

interface QuestionnaireAnalyticsDebugProps {
  answers: QuestionnaireAnswers;
  currentStep: number;
}

export function QuestionnaireAnalyticsDebug({ 
  answers, 
  currentStep 
}: QuestionnaireAnalyticsDebugProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<QuestionnaireEventPayload[]>([]);
  const [sessionId, setSessionId] = useState('');

  // Always call hooks; no-op in non-dev

  useEffect(() => {
    if (!isDev) return;
    // Update events when they change
    const updateEvents = () => {
      setEvents(questionnaireAnalytics.getEvents());
      setSessionId(questionnaireAnalytics.getSessionId());
    };

    updateEvents();
    
    // Poll for new events (in a real app, you'd use a more sophisticated approach)
    const interval = setInterval(updateEvents, 1000);
    
    return () => clearInterval(interval);
  }, [isDev]);

  const clearEvents = () => {
    questionnaireAnalytics.clearEvents();
    setEvents([]);
  };

  const copyEvents = () => {
    const eventsJson = JSON.stringify(events, null, 2);
    navigator.clipboard.writeText(eventsJson);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'step2_view': return '👁️';
      case 'main_selected': return '✅';
      case 'detail_selected': return '🏷️';
      case 'error_no_main': return '❌';
      case 'next_clicked': return '➡️';
      default: return '📊';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isDev) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Toggle Analytics Debug Panel"
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Analytics Debug
            </h3>
            <div className="flex gap-1">
              <button
                onClick={copyEvents}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Copy Events"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={clearEvents}
                className="p-1 text-gray-500 hover:text-red-600"
                title="Clear Events"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Session Info */}
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
            <div><strong>Session:</strong> {sessionId}</div>
            <div><strong>Step:</strong> {currentStep}</div>
          </div>

          {/* Current Selections */}
          <div className="mb-3">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Current Selections</h4>
            <div className="text-xs space-y-1">
              <div>
                <strong>Main Conditions:</strong> {answers.conditionsMain?.length || 0}
                {answers.conditionsMain?.map(condition => (
                  <div key={condition.code} className="ml-2 text-gray-600">
                    • {condition.code} ({getCzechConditionLabel(condition.code)})
                  </div>
                ))}
              </div>
              <div>
                <strong>Detail Tags:</strong> {answers.conditionsDetail?.length || 0}
                {answers.conditionsDetail?.map(detail => (
                  <div key={detail.code} className="ml-2 text-gray-600">
                    • {detail.code} ({getCzechDetailLabel(detail.code)})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events List */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">
              Events ({events.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-xs text-gray-500 italic">No events yet</div>
              ) : (
                events.map((event, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getEventIcon(event.event)}</span>
                      <span className="font-medium">{event.event}</span>
                      <span className="text-gray-500">{formatTimestamp(event.timestamp)}</span>
                    </div>
                    <div className="text-gray-600">
                      <div>Step: {event.step}</div>
                      {event.mainConditions && event.mainConditions.length > 0 && (
                        <div>Main: {event.mainConditions.join(', ')}</div>
                      )}
                      {event.detailTags && event.detailTags.length > 0 && (
                        <div>Details: {event.detailTags.join(', ')}</div>
                      )}
                      {event.errorMessage && (
                        <div className="text-red-600">Error: {event.errorMessage}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event Counts */}
          {events.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <h4 className="font-medium text-sm text-gray-700 mb-1">Event Counts</h4>
              <div className="text-xs text-gray-600 grid grid-cols-2 gap-1">
                <div>step2_view: {events.filter(e => e.event === 'step2_view').length}</div>
                <div>main_selected: {events.filter(e => e.event === 'main_selected').length}</div>
                <div>detail_selected: {events.filter(e => e.event === 'detail_selected').length}</div>
                <div>error_no_main: {events.filter(e => e.event === 'error_no_main').length}</div>
                <div>next_clicked: {events.filter(e => e.event === 'next_clicked').length}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
