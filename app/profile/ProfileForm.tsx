'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateNameAction } from './actions'
import { CheckCircle2 } from 'lucide-react'

interface ProfileFormProps {
  initialName: string | null
}

export function ProfileForm({ initialName }: ProfileFormProps) {
  const [name, setName] = useState(initialName || '')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateNameAction(name || null)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Jméno</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Zadejte své jméno"
          className="mt-1"
          disabled={isPending}
        />
        <p className="text-xs text-gray-500 mt-1">
          Můžete nechat prázdné, pokud nechcete zobrazovat jméno
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800">Jméno bylo úspěšně uloženo</p>
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Ukládám...' : 'Uložit'}
      </Button>
    </form>
  )
}

