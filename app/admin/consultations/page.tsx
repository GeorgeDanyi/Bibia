'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, X, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConsultationRequest, ConsultationStatus } from '@/lib/types/consultation-request'

const STATUS_CONFIG: Record<ConsultationStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Čeká', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  contacted: { label: 'Kontaktováno', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  scheduled: { label: 'Naplánováno', color: 'bg-green-100 text-green-800 border-green-200', icon: Calendar },
  done: { label: 'Dokončeno', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle2 },
  cancelled: { label: 'Zrušeno', color: 'bg-red-100 text-red-800 border-red-200', icon: X },
}

export default function ConsultationsAdminPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequest | null>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/consultation-requests/list')
      if (!response.ok) {
        throw new Error('Failed to load requests')
      }
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (requestId: string, newStatus: ConsultationStatus) => {
    try {
      const response = await fetch(`/api/consultation-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Reload requests
      await loadRequests()
      
      // Update selected request if it's the one we updated
      if (selectedRequest?.id === requestId) {
        const updated = await fetch(`/api/consultation-requests/${requestId}`)
        if (updated.ok) {
          setSelectedRequest(await updated.json())
        }
      }
    } catch (err: any) {
      alert(`Chyba: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Načítání žádostí...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Chyba: {error}</p>
            <Button onClick={loadRequests} className="mt-2" variant="outline">
              Zkusit znovu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Správa žádostí o konzultace
          </h1>
          <p className="text-gray-600">
            Celkem: {requests.length} žádostí
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {requests.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Žádné žádosti k zobrazení</p>
              </div>
            ) : (
              requests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status]
                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedRequest?.id === request.id
                        ? 'border-seafoam-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">
                            {request.id.slice(0, 8)}...
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Terapeut: {request.therapistId}
                        </p>
                        <p className="text-xs text-gray-600">
                          Služba: {request.serviceId} • {request.form === 'online' ? 'Online' : 'Osobně'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleString('cs-CZ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Detail žádosti
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      ID
                    </label>
                    <p className="text-sm font-mono text-gray-900 mt-1">
                      {selectedRequest.id}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Status
                    </label>
                    <div className="mt-2">
                      <select
                        value={selectedRequest.status}
                        onChange={(e) =>
                          updateStatus(selectedRequest.id, e.target.value as ConsultationStatus)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Terapeut
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedRequest.therapistId}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Služba
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedRequest.serviceId}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Forma
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedRequest.form === 'online' ? 'Online' : 'Osobně'}
                    </p>
                  </div>

                  {selectedRequest.preferredLanguages.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Jazyky
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedRequest.preferredLanguages.join(', ')}
                      </p>
                    </div>
                  )}

                  {selectedRequest.note && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Poznámka
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedRequest.note}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Vytvořeno
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(selectedRequest.createdAt).toLocaleString('cs-CZ')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-500 text-sm">
                  Vyberte žádost pro zobrazení detailu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

