'use client'

import React, { useState, useEffect } from 'react'
import { searchLogger } from '@/lib/utils/search-logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QualityDashboardProps {
  isVisible: boolean
  onClose: () => void
}

export function QualityDashboard({ isVisible, onClose }: QualityDashboardProps) {
  const [stats, setStats] = useState(searchLogger.getSearchStats())
  const [zeroResultAnalysis, setZeroResultAnalysis] = useState(searchLogger.getZeroResultAnalysis())
  const [exportData, setExportData] = useState<any>(null)

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setStats(searchLogger.getSearchStats())
        setZeroResultAnalysis(searchLogger.getZeroResultAnalysis())
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const handleExport = () => {
    const data = searchLogger.exportLogs()
    setExportData(data)
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bibia-quality-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    searchLogger.clearLogs()
    setStats(searchLogger.getSearchStats())
    setZeroResultAnalysis(searchLogger.getZeroResultAnalysis())
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Quality Dashboard - Zero Results & Fallback Analysis</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Search Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalSearches}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Zero Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {stats.zeroResultSearches}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.totalSearches > 0 ? ((stats.zeroResultSearches / stats.totalSearches) * 100).toFixed(1) : 0}% of searches
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {stats.avgResultsPerSearch.toFixed(1)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fallback Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {(stats.fallbackUsageRate * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Zero Result Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zero Result Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Zero Results</span>
                    <span className="font-semibold">{zeroResultAnalysis.totalZeroResults}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fallback Success Rate</span>
                    <span className="font-semibold">
                      {(zeroResultAnalysis.fallbackSuccessRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Fallback Radius</span>
                    <span className="font-semibold">
                      {zeroResultAnalysis.avgFallbackRadius.toFixed(1)} km
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Processing Time</span>
                    <span className="font-semibold">{stats.avgProcessingTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quality Score</span>
                    <span className="font-semibold">
                      {stats.avgResultsPerSearch > 5 ? 'Good' : stats.avgResultsPerSearch > 2 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Locations */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Top Search Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topLocations.slice(0, 10).map((location, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm font-mono">{location.location}</span>
                    <span className="text-sm font-semibold">{location.count} searches</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Common Must-Have Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Common Must-Have Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.commonMustHaveFilters.slice(0, 10).map((filter, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm font-mono">{filter.filter}</span>
                    <span className="text-sm font-semibold">{filter.count} times</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Zero Result Patterns */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Zero Result Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zeroResultAnalysis.commonPatterns.slice(0, 10).map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold">Pattern #{index + 1}</span>
                      <span className="text-sm text-red-600 font-semibold">{pattern.count} occurrences</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div><span className="font-medium">Location:</span> {pattern.location}</div>
                      <div><span className="font-medium">Must-Have:</span> {pattern.mustHave}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fallback Expansions Table */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Fallback Expansions Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Query ID</th>
                      <th className="text-left py-2">Location</th>
                      <th className="text-left py-2">Requested Radius</th>
                      <th className="text-left py-2">Final Radius</th>
                      <th className="text-left py-2">Results Found</th>
                      <th className="text-left py-2">Processing Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchLogger.exportLogs().zeroResultQueries.slice(0, 20).map((query, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-mono text-xs">{query.queryId.slice(-8)}</td>
                        <td className="py-2">{query.location.value}</td>
                        <td className="py-2">{query.radiusKmRequested}km</td>
                        <td className="py-2">
                          {query.fallbackExpansions.length > 0 
                            ? `${Math.max(...query.fallbackExpansions.map(f => f.radiusKm))}km`
                            : `${query.radiusKmRequested}km`
                          }
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            query.finalResultsCount > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {query.finalResultsCount}
                          </span>
                        </td>
                        <td className="py-2">{query.processingTimeMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 mb-6">
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
              Export Quality Data
            </Button>
            <Button onClick={handleClear} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Clear All Data
            </Button>
          </div>

          {/* Export Preview */}
          {exportData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(exportData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Quality Status */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Quality Status</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Search logging: ✅ Active</p>
              <p>• Zero result tracking: ✅ Active</p>
              <p>• Fallback analysis: ✅ Active</p>
              <p>• Pattern detection: ✅ Active</p>
              <p>• Data export: ✅ Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

