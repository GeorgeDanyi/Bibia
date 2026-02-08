# Middleware Protection Implementation Summary

## Změněné soubory

### 1. `middleware.ts` (root)
**Změny:**
- Přidán import `auth` z `@/lib/auth`
- Middleware nyní používá NextAuth v5 `auth()` wrapper
- Přidána ochrana pro `/dashboard` - vyžaduje přihlášení
- Přidána ochrana pro `/admin/*` - vyžaduje přihlášení + role "admin"
- Nepřihlášení uživatelé jsou přesměrováni na `/login?next=<původní_url>`
- Ne-admin uživatelé jsou přesměrováni na `/dashboard?error=unauthorized`

**Klíčové části:**
```typescript
export default auth((req) => {
  const session = req.auth
  
  // /dashboard protection
  if (pathname.startsWith('/dashboard') && !session) {
    redirect to /login?next=/dashboard
  }
  
  // /admin/* protection
  if (pathname.startsWith('/admin')) {
    if (!session) redirect to /login?next=/admin/...
    if (session.user.role !== 'admin') redirect to /dashboard?error=unauthorized
  }
})
```

### 2. `lib/auth.ts`
**Změny:**
- Přidána role logika do `jwt` callbacku
- Role se nastavuje na základě `ADMIN_EMAILS` env proměnné
- Role se propaguje do session přes `session` callback
- Všechny změny označeny komentářem "TEMP until DB roles"

**Klíčové části:**
```typescript
async jwt({ token, user }) {
  // TEMP until DB roles: Set role based on ADMIN_EMAILS env variable
  const adminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : []
  const userEmail = user.email?.toLowerCase() || ''
  const isAdmin = adminEmails.includes(userEmail)
  token.role = isAdmin ? 'admin' : 'user'
}

async session({ session, token }) {
  // TEMP until DB roles: Add role from token to session
  if (token.role) {
    session.user.role = token.role
  }
}
```

### 3. `app/dashboard/page.tsx`
**Změny:**
- Přidána podpora pro `searchParams` (Next.js 15 App Router)
- Přidáno zobrazení error hlášky při `error=unauthorized`
- Zobrazení červeného alert boxu s hláškou "Nemáte oprávnění"

**Klíčové části:**
```typescript
const params = await searchParams
const hasUnauthorizedError = params.error === 'unauthorized'

{hasUnauthorizedError && (
  <div className="bg-red-50 border border-red-200...">
    <p>Nemáte oprávnění</p>
  </div>
)}
```

---

## Environment Variables

Přidej do `.env.local`:
```env
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

**Formát:** Čárkami oddělený seznam emailů (bez mezer, nebo s mezerami - kód je trimuje)

---

## Jak otestovat

### 1. Nepřihlášený přístup na `/admin/consultations`

**Kroky:**
1. Otevři prohlížeč v anonymním režimu (nebo se odhlas)
2. Zadej URL: `http://localhost:3000/admin/consultations`
3. **Očekávaný výsledek:**
   - Automatický redirect na `/login?next=/admin/consultations`
   - Po přihlášení by měl být redirect zpět na `/admin/consultations` (pokud je admin)

**Ověření:**
- Network tab v DevTools ukáže 307 redirect na `/login`
- URL v prohlížeči se změní na `/login?next=/admin/consultations`

---

### 2. Přihlášený ne-admin uživatel

**Příprava:**
1. Zajisti, že email uživatele **NENÍ** v `ADMIN_EMAILS` v `.env.local`
2. Přihlas se s tímto emailem (Google OAuth nebo Credentials)

**Kroky:**
1. Po přihlášení zkus přistoupit na: `http://localhost:3000/admin/consultations`
2. **Očekávaný výsledek:**
   - Automatický redirect na `/dashboard?error=unauthorized`
   - Na dashboardu se zobrazí červený alert box s textem "Nemáte oprávnění"

**Ověření:**
- Network tab ukáže 307 redirect na `/dashboard?error=unauthorized`
- Na dashboardu je vidět error hláška
- Console log může ukázat `session.user.role = 'user'` (pokud přidáš debug log)

**Debug tip:**
Přidej do `middleware.ts` před redirect:
```typescript
console.log('User role:', (session.user as any)?.role)
```

---

### 3. Admin email uživatel

**Příprava:**
1. Přidej svůj email do `ADMIN_EMAILS` v `.env.local`:
   ```env
   ADMIN_EMAILS=your-email@example.com
   ```
2. **DŮLEŽITÉ:** Restartuj dev server (`npm run dev`) - env proměnné se načítají při startu
3. Přihlas se s tímto emailem
4. **DŮLEŽITÉ:** Pokud jsi už přihlášený, odhlas se a přihlas znovu - role se nastavuje při vytvoření JWT tokenu

**Kroky:**
1. Po přihlášení zkus přistoupit na: `http://localhost:3000/admin/consultations`
2. **Očekávaný výsledek:**
   - Stránka se načte bez redirectu
   - Vidíš admin stránku s konzultacemi

**Ověření:**
- Network tab ukáže 200 OK (ne redirect)
- URL zůstane `/admin/consultations`
- Admin stránka se zobrazí normálně

**Debug tip:**
Přidej do `app/admin/consultations/page.tsx` (client-side):
```typescript
useEffect(() => {
  // Debug - zkontroluj session
  fetch('/api/auth/session').then(r => r.json()).then(console.log)
}, [])
```

---

## Troubleshooting

### Role se nenastavuje správně

**Problém:** I když je email v `ADMIN_EMAILS`, role je stále "user"

**Řešení:**
1. Zkontroluj, že `ADMIN_EMAILS` je správně nastaveno v `.env.local`
2. **Restartuj dev server** - env proměnné se načítají při startu
3. **Odhlas se a přihlas znovu** - role se nastavuje při vytvoření JWT tokenu (při loginu)
4. Zkontroluj, že email v `ADMIN_EMAILS` přesně odpovídá emailu v session (case-insensitive, ale zkontroluj diakritiku)

**Debug:**
Přidej do `lib/auth.ts` v `jwt` callbacku:
```typescript
console.log('Admin emails:', adminEmails)
console.log('User email:', userEmail)
console.log('Is admin:', isAdmin)
```

### Middleware nefunguje

**Problém:** Middleware se nevolá nebo nefunguje redirect

**Řešení:**
1. Zkontroluj, že `middleware.ts` je v rootu projektu (ne v `src/`)
2. Zkontroluj `matcher` v `config` - měl by obsahovat `/dashboard/:path*` a `/admin/:path*`
3. Zkontroluj, že NextAuth v5 beta je správně nainstalován
4. Zkontroluj server logs - měly by být vidět případné chyby

### Redirect loop

**Problém:** Nekonečný redirect loop

**Řešení:**
1. Zkontroluj, že `/login` není v `matcher` (jinak by middleware kontroloval i login stránku)
2. Zkontroluj, že redirect URL není stejná jako původní URL
3. Zkontroluj, že session se správně načítá v middleware

---

## Bezpečnostní poznámky

1. **TEMP řešení:** Role mechanismus je dočasný a označen komentářem "TEMP until DB roles"
2. **Env proměnné:** `ADMIN_EMAILS` by mělo být v produkci v secure env storage (ne v git)
3. **Case sensitivity:** Email porovnání je case-insensitive (převod na lowercase)
4. **JWT token:** Role je uložena v JWT tokenu, takže změna `ADMIN_EMAILS` vyžaduje nový login

---

## Další kroky (pro produkci)

1. Implementovat role v databázi (místo env proměnné)
2. Přidat role management UI pro adminy
3. Přidat audit log pro přístup k admin stránkám
4. Přidat rate limiting pro admin routes
5. Přidat 2FA pro admin účty

