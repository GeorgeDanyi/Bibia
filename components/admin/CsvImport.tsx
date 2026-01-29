'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { validateCsvImport, exportValidationResults, generateCsvTemplate } from '@/lib/validation/csv-import'

interface CsvImportResult {
  success: boolean
  queryId: string
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
    successRate: number
  }
  validRows: any[]
  invalidRows: {
    rowNumber: number
    data: any
    errors: string[]
  }[]
  processingTimeMs: number
  timestamp: number
}

export function CsvImport() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import-therapists', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/import-therapists')
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'therapist-import-template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download template')
    }
  }

  const handleDownloadResults = () => {
    if (!result) return

    const csvContent = exportValidationResults({
      success: result.success,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      summary: result.summary
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-validation-results-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV Import Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? 'Validating...' : 'Validate CSV'}
            </Button>
            
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              Download Template
            </Button>
            
            {result && (
              <Button
                onClick={handleDownloadResults}
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                Download Results
              </Button>
            )}
            
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Clear
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-semibold">Total Rows</p>
                  <p className="text-blue-600 text-2xl">{result.summary.totalRows}</p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-semibold">Valid Rows</p>
                  <p className="text-green-600 text-2xl">{result.summary.validRows}</p>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold">Invalid Rows</p>
                  <p className="text-red-600 text-2xl">{result.summary.invalidRows}</p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-800 font-semibold">Success Rate</p>
                  <p className="text-purple-600 text-2xl">{result.summary.successRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Status */}
              <div className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`font-semibold ${
                  result.success ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {result.success ? '✅ All rows are valid!' : '⚠️ Some rows have validation errors'}
                </p>
                <p className={`text-sm ${
                  result.success ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  Processing time: {result.processingTimeMs}ms
                </p>
              </div>

              {/* Invalid Rows Details */}
              {result.invalidRows.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-800">Invalid Rows ({result.invalidRows.length})</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {result.invalidRows.map((invalid, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="font-medium text-red-800">Row {invalid.rowNumber}</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {invalid.errors.map((error, errorIndex) => (
                            <li key={errorIndex}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Rows Preview */}
              {result.validRows.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-800">Valid Rows Preview ({result.validRows.length})</h3>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {result.validRows.slice(0, 10).map((row, index) => (
                        <div key={index} className="p-2 bg-green-50 border border-green-200 rounded">
                          <p className="font-medium text-green-800">{row.id}</p>
                          <p className="text-green-600">{row.fullName}</p>
                          <p className="text-green-500">{row.city}</p>
                        </div>
                      ))}
                      {result.validRows.length > 10 && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-center">
                          <p className="text-green-600 text-sm">+{result.validRows.length - 10} more...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h3>Required Fields</h3>
            <ul>
              <li><strong>id</strong>: Unique identifier (alphanumeric, hyphens, underscores only)</li>
              <li><strong>fullName</strong>: Full name of the therapist</li>
              <li><strong>city</strong>: City name</li>
              <li><strong>latitude</strong>: Latitude coordinate (within Czech Republic: 48.5-51.1)</li>
              <li><strong>longitude</strong>: Longitude coordinate (within Czech Republic: 12.0-18.9)</li>
              <li><strong>practiceType</strong>: private, clinic, hospital, home_visits, or online</li>
              <li><strong>acceptingNew</strong>: true/false, 1/0, or yes/no</li>
              <li><strong>yearsExperience</strong>: Integer (0-50)</li>
              <li><strong>pricePerSession</strong>: Integer in CZK (0-10000)</li>
              <li><strong>languages</strong>: Comma-separated language codes (cs, en, de, ru, uk, sk, fr, es, it, pl)</li>
              <li><strong>specialties</strong>: Comma-separated specialty tags</li>
              <li><strong>diagnosisTags</strong>: Comma-separated diagnosis tags</li>
              <li><strong>tags</strong>: Comma-separated general tags</li>
            </ul>

            <h3>Optional Fields</h3>
            <ul>
              <li><strong>bio</strong>: Biography text (max 2000 characters)</li>
              <li><strong>profileImage</strong>: URL to profile image</li>
              <li><strong>clinicName</strong>: Name of clinic/practice</li>
              <li><strong>address</strong>: Full address</li>
              <li><strong>phone</strong>: Phone number</li>
              <li><strong>email</strong>: Email address</li>
              <li><strong>website</strong>: Website URL</li>
              <li><strong>insuranceAccepted</strong>: Comma-separated insurance codes</li>
              <li><strong>isVerified</strong>: true/false, 1/0, or yes/no</li>
              <li><strong>lastActive</strong>: ISO datetime string</li>
              <li><strong>regions</strong>: Comma-separated region names</li>
              <li><strong>modalities</strong>: Comma-separated treatment modalities</li>
              <li><strong>worksWith</strong>: Comma-separated population groups</li>
              <li><strong>reviewsCount</strong>: Integer (0-10000)</li>
              <li><strong>ratingAverage</strong>: Number (0-5)</li>
              <li><strong>ratingCount</strong>: Integer (0-10000)</li>
              <li><strong>nextAvailableDays</strong>: Integer (0-365)</li>
              <li><strong>workingHoursMorning/Midday/Evening/Weekend</strong>: true/false, 1/0, or yes/no</li>
              <li><strong>priceRangeMin/Max</strong>: Integer in CZK (0-10000)</li>
            </ul>

            <h3>Validation Rules</h3>
            <ul>
              <li>All coordinates must be within Czech Republic bounds</li>
              <li>Practice type must be one of the valid enum values</li>
              <li>Languages must be valid language codes</li>
              <li>Rating must be 0-5 scale</li>
              <li>Price range min must be ≤ max</li>
              <li>Email and website must be valid URLs</li>
              <li>Phone must be valid format</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

