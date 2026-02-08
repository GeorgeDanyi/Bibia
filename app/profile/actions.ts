'use server'

import { auth } from '@/lib/auth'
import { updateUserName } from '@/lib/database/auth'
import { revalidatePath } from 'next/cache'

export async function updateNameAction(newName: string | null) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: 'Nejste přihlášeni' }
  }

  try {
    // Trim and validate name
    const trimmedName = newName ? newName.trim() : null
    
    await updateUserName(session.user.id, trimmedName)
    
    // Revalidate the profile page to show updated data
    revalidatePath('/profile')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating name:', error)
    return { error: 'Chyba při ukládání jména' }
  }
}

