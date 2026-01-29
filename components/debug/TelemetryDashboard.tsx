'use client'

import React, { useState, useEffect } from 'react'
import { telemetry } from '@/lib/utils/telemetry'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TelemetryDashboardProps {
  isVisible: boolean
  onClose: () => void
}

export function TelemetryDashboard({ isVisible, onClose }: TelemetryDashboardProps) {
  const [summary, setSummary] = useState(telemetry.getTelemetrySummary())
  const [exportData, setExportData] = useState<any>(null)

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setSummary(telemetry.getTelemetrySummary())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const handleExport = () => {
    const data = telemetry.exportTelemetryData()
    setExportData(data)
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bibia-telemetry-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    // Clear localStorage analytics data
    localStorage.removeItem('bibia_analytics')
    setSummary(telemetry.getTelemetrySummary())
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Data Hygiene & Telemetry Dashboard</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Session ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-mono text-gray-600 break-all">
                  {summary.sessionId}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.totalEvents}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hygiene Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {summary.hygieneEvents}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {summary.criticalIssues}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Result Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Quality</span>
                    <span className="font-semibold">
                      {(summary.avgResultQuality * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${summary.avgResultQuality * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Efficiency</span>
                    <span className="font-semibold">
                      {(summary.avgSearchEfficiency * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${summary.avgSearchEfficiency * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
              Export Telemetry Data
            </Button>
            <Button onClick={handleClear} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Clear Analytics Data
            </Button>
          </div>

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

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Data Hygiene Status</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Input validation: ✅ Active</p>
              <p>• Data sanitization: ✅ Active</p>
              <p>• Consistency checking: ✅ Active</p>
              <p>• Error logging: ✅ Active</p>
              <p>• Telemetry collection: ✅ Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

