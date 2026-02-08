import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { findUserById } from "@/lib/database/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"
import { ProfileForm } from "./ProfileForm"

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect('/login?next=/profile')
  }

  // Get full user data from database
  const user = session.user?.id ? await findUserById(session.user.id) : null

  if (!user) {
    redirect('/login?next=/profile')
  }

  // Format role for display
  const roleLabels: Record<string, string> = {
    patient: 'Pacient',
    therapist: 'Terapeut',
    admin: 'Administrátor',
  }

  const roleLabel = roleLabels[user.role] || user.role

  // Format date
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Můj účet</h1>
          <p className="text-gray-600 mt-2">
            Spravujte své osobní informace a nastavení účtu
          </p>
        </div>

        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Osobní informace</CardTitle>
            <CardDescription>
              Vaše základní informace o účtu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                E-mail nelze změnit
              </p>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={roleLabel}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            {createdAt && (
              <div>
                <Label htmlFor="createdAt">Datum vytvoření účtu</Label>
                <Input
                  id="createdAt"
                  value={createdAt}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Name Card */}
        <Card>
          <CardHeader>
            <CardTitle>Změna jména</CardTitle>
            <CardDescription>
              Aktualizujte své zobrazované jméno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialName={user.name} />
          </CardContent>
        </Card>

        {/* Sign Out Card */}
        <Card>
          <CardHeader>
            <CardTitle>Odhlášení</CardTitle>
            <CardDescription>
              Odhlaste se ze svého účtu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                Odhlásit se
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

