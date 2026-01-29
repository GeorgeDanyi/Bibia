'use client'

import React, { useState, useEffect } from 'react'
import { searchTracer, SearchTrace, TraceSpan } from '@/lib/utils/search-tracer'
import { failureVisibility, SearchFailure, ZeroResultAnalysis } from '@/lib/utils/failure-visibility'

interface TracingDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchTracingDashboard({ isOpen, onClose }: TracingDashboardProps) {
  const [traces, setTraces] = useState<SearchTrace[]>([])
  const [spans, setSpans] = useState<TraceSpan[]>([])
  const [failures, setFailures] = useState<SearchFailure[]>([])
  const [zeroResults, setZeroResults] = useState<ZeroResultAnalysis[]>([])
  const [selectedTrace, setSelectedTrace] = useState<SearchTrace | null>(null)
  const [activeTab, setActiveTab] = useState<'traces' | 'failures' | 'zero-results' | 'stats'>('traces')

  useEffect(() => {
    if (isOpen) {
      loadTracingData()
    }
  }, [isOpen])

  const loadTracingData = () => {
    const sessionTraces = searchTracer.getSessionTraces()
    const failedTraces = searchTracer.getFailedTraces()
    const zeroResultTraces = searchTracer.getZeroResultTraces()
    
    setTraces(sessionTraces)
    setSpans([]) // Spans are embedded in traces
    setFailures(failureVisibility.getRecentFailures())
    setZeroResults(failureVisibility.getRecentZeroResults())
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'cancelled': return 'text-yellow-600'
      case 'in_progress': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100'
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Search Tracing Dashboard</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={loadTracingData}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'traces', label: `Traces (${traces.length})` },
            { id: 'failures', label: `Failures (${failures.length})` },
            { id: 'zero-results', label: `Zero Results (${zeroResults.length})` },
            { id: 'stats', label: 'Statistics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'traces' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Traces List */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Recent Traces</h3>
                  {traces.slice(-10).reverse().map(trace => (
                    <div
                      key={trace.traceId}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedTrace?.traceId === trace.traceId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedTrace(trace)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getStatusColor(trace.status)}`}>
                            {trace.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(trace.startTime)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {trace.duration ? formatDuration(trace.duration) : 'In progress'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Query: {trace.queryId}
                      </div>
                      <div className="text-sm text-gray-600">
                        Results: {trace.results.totalFound || 0}
                        {trace.results.fallbackUsed && (
                          <span className="text-yellow-600 ml-2">(Fallback used)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trace Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Trace Details</h3>
                  {selectedTrace ? (
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="p-3 border rounded">
                        <h4 className="font-medium mb-2">Basic Information</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Trace ID:</strong> {selectedTrace.traceId}</div>
                          <div><strong>Query ID:</strong> {selectedTrace.queryId}</div>
                          <div><strong>Status:</strong> <span className={getStatusColor(selectedTrace.status)}>{selectedTrace.status}</span></div>
                          <div><strong>Duration:</strong> {selectedTrace.duration ? formatDuration(selectedTrace.duration) : 'In progress'}</div>
                          <div><strong>Start Time:</strong> {formatTimestamp(selectedTrace.startTime)}</div>
                        </div>
                      </div>

                      {/* URL Info */}
                      <div className="p-3 border rounded">
                        <h4 className="font-medium mb-2">URL Information</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Initial URL:</strong> {selectedTrace.url.initial}</div>
                          {selectedTrace.url.final && (
                            <div><strong>Final URL:</strong> {selectedTrace.url.final}</div>
                          )}
                        </div>
                      </div>

                      {/* Results */}
                      <div className="p-3 border rounded">
                        <h4 className="font-medium mb-2">Results</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Total Found:</strong> {selectedTrace.results.totalFound || 0}</div>
                          <div><strong>Returned:</strong> {selectedTrace.results.returned || 0}</div>
                          <div><strong>Zero Results:</strong> {selectedTrace.results.zeroResults ? 'Yes' : 'No'}</div>
                          {selectedTrace.results.fallbackUsed && (
                            <div><strong>Fallback Used:</strong> Yes - {selectedTrace.results.fallbackReason}</div>
                          )}
                        </div>
                      </div>

                      {/* Errors */}
                      {selectedTrace.errors.length > 0 && (
                        <div className="p-3 border rounded">
                          <h4 className="font-medium mb-2">Errors</h4>
                          <div className="space-y-2">
                            {selectedTrace.errors.map((error, index) => (
                              <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                                <div className="font-medium text-red-800">{error.stage}: {error.error}</div>
                                <div className="text-sm text-red-600 mt-1">
                                  {error.userVisible ? 'User Visible' : 'Internal'} - 
                                  {error.recoverable ? ' Recoverable' : ' Non-recoverable'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Performance */}
                      {selectedTrace.performance && (
                        <div className="p-3 border rounded">
                          <h4 className="font-medium mb-2">Performance</h4>
                          <div className="space-y-1 text-sm">
                            <div><strong>Total Duration:</strong> {selectedTrace.performance.totalDuration ? formatDuration(selectedTrace.performance.totalDuration) : 'N/A'}</div>
                            <div><strong>API Duration:</strong> {selectedTrace.performance.apiDuration ? formatDuration(selectedTrace.performance.apiDuration) : 'N/A'}</div>
                            <div><strong>Data Processing:</strong> {selectedTrace.performance.dataProcessingDuration ? formatDuration(selectedTrace.performance.dataProcessingDuration) : 'N/A'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Select a trace to view details
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'failures' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Recent Failures</h3>
              {failures.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No recent failures</div>
              ) : (
                <div className="space-y-3">
                  {failures.map((failure, index) => (
                    <div key={index} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(failure.severity)}`}>
                            {failure.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">{formatTimestamp(failure.timestamp)}</span>
                        </div>
                        <span className="text-sm font-medium">{failure.stage}</span>
                      </div>
                      <div className="space-y-2">
                        <div><strong>Error:</strong> {failure.error}</div>
                        <div><strong>User Message:</strong> {failure.userMessage}</div>
                        <div><strong>Recoverable:</strong> {failure.recoverable ? 'Yes' : 'No'}</div>
                        {failure.suggestedActions.length > 0 && (
                          <div>
                            <strong>Suggested Actions:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {failure.suggestedActions.map((action, i) => (
                                <li key={i} className="text-sm">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'zero-results' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Recent Zero Results</h3>
              {zeroResults.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No recent zero results</div>
              ) : (
                <div className="space-y-3">
                  {zeroResults.map((zeroResult, index) => (
                    <div key={index} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{formatTimestamp(zeroResult.timestamp)}</span>
                        <span className="text-sm font-medium">Query: {zeroResult.queryId}</span>
                      </div>
                      <div className="space-y-2">
                        <div><strong>Location:</strong> {zeroResult.location.value} ({zeroResult.location.type})</div>
                        <div><strong>Radius:</strong> {zeroResult.radiusKm}km</div>
                        {zeroResult.possibleReasons.length > 0 && (
                          <div>
                            <strong>Possible Reasons:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {zeroResult.possibleReasons.map((reason, i) => (
                                <li key={i} className="text-sm">{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {zeroResult.suggestedActions.length > 0 && (
                          <div>
                            <strong>Suggested Actions:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {zeroResult.suggestedActions.map((action, i) => (
                                <li key={i} className="text-sm">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="font-semibold">Performance Statistics</h3>
              
              {/* Trace Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded">
                  <h4 className="font-medium mb-2">Trace Statistics</h4>
                  <div className="space-y-1 text-sm">
                    <div>Total Traces: {traces.length}</div>
                    <div>Failed Traces: {searchTracer.getFailedTraces().length}</div>
                    <div>Zero Result Traces: {searchTracer.getZeroResultTraces().length}</div>
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      const stats = searchTracer.getPerformanceStats()
                      return (
                        <>
                          <div>Avg Total Duration: {formatDuration(stats.avgTotalDuration)}</div>
                          <div>Avg API Duration: {formatDuration(stats.avgApiDuration)}</div>
                          <div>Avg Results Count: {stats.avgResultsCount.toFixed(1)}</div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <h4 className="font-medium mb-2">Quality Metrics</h4>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      const stats = searchTracer.getPerformanceStats()
                      return (
                        <>
                          <div>Zero Result Rate: {(stats.zeroResultRate * 100).toFixed(1)}%</div>
                          <div>Error Rate: {(stats.errorRate * 100).toFixed(1)}%</div>
                          <div>Fallback Usage: {(stats.fallbackUsageRate * 100).toFixed(1)}%</div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Failure Stats */}
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Failure Statistics</h4>
                {(() => {
                  const failureStats = failureVisibility.getFailureStats()
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>Total Failures: {failureStats.totalFailures}</div>
                      <div>Critical: {failureStats.criticalFailures}</div>
                      <div>Recoverable: {failureStats.recoverableFailures}</div>
                      <div>Avg/Hour: {failureStats.avgFailuresPerHour.toFixed(1)}</div>
                    </div>
                  )
                })()}
              </div>

              {/* Zero Results Stats */}
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Zero Results Statistics</h4>
                {(() => {
                  const zeroStats = failureVisibility.getZeroResultsStats()
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>Total Zero Results: {zeroStats.totalZeroResults}</div>
                      <div>Fallback Success Rate: {(zeroStats.fallbackSuccessRate * 100).toFixed(1)}%</div>
                      <div>Avg Fallback Radius: {zeroStats.avgFallbackRadius.toFixed(1)}km</div>
                      <div>Common Patterns: {zeroStats.commonZeroResultPatterns.length}</div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
