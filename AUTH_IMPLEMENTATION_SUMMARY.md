# Auth MVP - Implementace Dokončena ✅

## Co bylo implementováno

### 1. Database Schema ✅
- **Migrace**: `lib/database/migrations/003_create_auth_tables.sql`
- **Tabulky**:
  - `users` (email unique, emailVerifiedAt, role)
  - `accounts` (provider, providerAccountId, userId) - pro OAuth linking
  - `sessions` (NextAuth)
  - `magic_tokens` (email, tokenHash, expiresAt, consumedAt, attempts)

### 2. Database Helpers ✅
- **Soubor**: `lib/database/auth.ts`
- **Funkce**:
  - `findUserByEmail()`, `findUserById()`, `createUser()`
  - `verifyUserEmail()`
  - `findAccountByProvider()`, `linkAccount()`
  - `createMagicToken()` - hashuje kód před uložením
  - `verifyMagicToken()` - ověří bez consumování
  - `consumeMagicToken()` - označí jako použité
  - `cleanupExpiredMagicTokens()`

### 3. NextAuth Konfigurace ✅
- **Soubor**: `app/api/auth/[...nextauth]/route.ts`
- **Providers**:
  - Google OAuth
  - Credentials provider pro magic link
- **Account Linking**: Automatické propojení pokud email existuje
- **Session**: JWT strategy, 30 dní expirace

### 4. API Endpoints ✅

#### POST /api/auth/send-code
- Validuje email
- Generuje 6místný kód
- Hashuje a ukládá do DB
- Rate limiting (3/min)
- Stejná odpověď proti enumeraci
- TODO: Skutečné odesílání emailu

#### POST /api/auth/verify-code
- Validuje 6místný kód
- Ověřuje hash a expiraci
- Rate limiting (5/min)
- Max 5 pokusů na token
- Vytvoří user pokud neexistuje
- Nastaví emailVerifiedAt

### 5. Frontend ✅

#### /login
- Google OAuth tlačítko (primární)
- Email input + "Poslat kód"
- Loading states
- Error handling
- Redirect na /auth/verify po odeslání

#### /auth/verify
- 6místný kód input
- Auto-focus, numeric input
- Loading states
- Error handling
- Resend kódu
- Po úspěchu → NextAuth signIn → redirect na /dashboard

### 6. Middleware ✅
- **Soubor**: `middleware.ts`
- Protected routes: `/dashboard`, `/admin`
- Redirect na `/login` pokud není session
- Zachovává legacy redirects

### 7. Session Provider ✅
- **Soubor**: `components/providers/SessionProvider.tsx`
- Přidán do `app/layout.tsx`
- Zajišťuje session v celé app

### 8. Protected Route Example ✅
- **Soubor**: `app/dashboard/page.tsx`
- Server-side session check
- Redirect pokud není přihlášen

## Bezpečnostní opatření ✅

- ✅ Tokeny ukládány jako bcrypt hash
- ✅ Expirace 10 minut
- ✅ Rate limiting (in-memory, TODO: Redis)
- ✅ Stejné odpovědi proti enumeraci
- ✅ Max 5 pokusů na token
- ✅ Token consumed po úspěšném použití
- ✅ Email verification tracking

## TODO pro produkci

1. **Email Service**
   - Implementovat Resend/SMTP v `send-code` endpointu (hotovo pro Resend API – viz `RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
   - Nastavit produkční odesílací doménu (SPF, DKIM, DMARC) pro vyšší doručitelnost a důvěryhodnost
   - Ověřit zobrazení CZ HTML + text šablony ve většině e-mailových klientů

2. **Apple Sign-In**
   - Odkomentovat AppleProvider v NextAuth
   - Nastavit APPLE_CLIENT_ID a APPLE_CLIENT_SECRET

3. **Produkční Cookies**
   - Odkomentovat cookies config v NextAuth
   - Nastavit `Secure`, `HttpOnly`, `SameSite=lax` (nebo `strict` podle potřeb) pro produkční prostředí
   - Ověřit, že cookies nejsou dostupné z JS (XSS) a že fungují správně za reverzní proxy/Load Balancerem

4. **Rate Limiting**
   - Přesunout z in-memory do Redis
   - Globální rate limits

5. **Monitoring**
   - Logging failed attempts (včetně IP + email hash) a rate-limit eventů
   - Metrics pro auth flow (odeslané e-maily, úspěšné/selhané verifikace, OAuth přihlášení)
   - Alerting při nárůstu chyb (např. Resend/SMTP výpadky, zvýšené 4xx/5xx na auth endpointech)

6. **Cleanup Job**
   - Cron job pro cleanup expired tokens
   - Archivace starých sessions

## Jak použít

1. **Instalace**:
   ```bash
   npm install next-auth@beta bcryptjs
   npm install -D @types/bcryptjs
   ```

2. **Database**:
   ```bash
   psql -d your_db < lib/database/migrations/003_create_auth_tables.sql
   ```

3. **Setup DB client**:
   - Vytvoř `lib/database/pool.ts` nebo podobný
   - Zavolej `initAuthDb()` s tvým DB clientem

4. **Environment**:
   - Přidej do `.env.local` (viz AUTH_SETUP.md)

5. **Testování**:
   - Spusť `npm run dev`
   - Otevři `/login`
   - Zkus Google OAuth nebo email kód

## Flow Diagram

```
User → /login
  ├─ Google OAuth → NextAuth → /dashboard
  └─ Email → POST /api/auth/send-code
            → /auth/verify
            → Zadá kód
            → POST /api/auth/verify-code
            → NextAuth signIn (magic-link)
            → /dashboard
```

## Account Linking Flow

```
User má účet s email@example.com (magic link)
User se přihlásí přes Google se stejným emailem
  → NextAuth signIn callback
  → findUserByEmail() → najde existujícího usera
  → linkAccount() → propojí Google account
  → User má oba způsoby přihlášení
```

## Struktura souborů

```
lib/database/
  migrations/003_create_auth_tables.sql
  auth.ts

app/api/auth/
  [...nextauth]/route.ts
  send-code/route.ts
  verify-code/route.ts

app/
  login/page.tsx
  auth/verify/page.tsx
  dashboard/page.tsx

components/providers/
  SessionProvider.tsx

middleware.ts
```

## Status: ✅ MVP Funkční

Všechny požadované funkce jsou implementovány a připraveny k testování.

