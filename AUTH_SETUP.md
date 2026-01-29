# Auth MVP - Setup Instructions

## 1. Instalace závislostí

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

## 2. Database Setup

Spusť migraci:

```bash
# Připoj se k PostgreSQL a spusť:
psql -d your_database < lib/database/migrations/003_create_auth_tables.sql
```

## 3. Database Client Setup

Vytvoř nebo uprav `lib/database/pool.ts` (nebo podobný soubor):

```typescript
import { Pool } from 'pg'
import { initAuthDb } from './auth'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Initialize auth DB functions
initAuthDb({
  query: (text: string, params?: any[]) => pool.query(text, params),
})

export { pool }
```

## 4. Environment Variables

Přidej do `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generuj-nahodny-secret-min-32-znaku

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**Generování NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## 5. Google OAuth Setup

1. Jdi na https://console.cloud.google.com
2. Vytvoř projekt → APIs & Services → Credentials
3. OAuth 2.0 Client ID
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Zkopíruj Client ID a Client Secret do `.env.local`

## 6. Testování

```bash
npm run dev
```

1. Otevři http://localhost:3000/login
2. Zkus Google OAuth
3. Nebo zadej email → "Poslat kód"
4. Zkontroluj console log pro kód (v produkci se pošle email)
5. Zadej kód na /auth/verify
6. Měl bys být přesměrován na /dashboard

## 7. TODO pro produkci

- [ ] Implementovat skutečné odesílání emailů (Resend/SMTP)
- [ ] Přidat Apple Sign-In konfiguraci
- [ ] Nastavit produkční cookies (Secure, SameSite)
- [ ] Přidat Redis pro rate limiting (místo in-memory)
- [ ] Přidat monitoring a logging
- [ ] Nastavit cleanup job pro expired magic tokens

## Struktura souborů

```
lib/database/
  migrations/003_create_auth_tables.sql  # DB schema
  auth.ts                                 # DB helper funkce

app/api/auth/
  [...nextauth]/route.ts                  # NextAuth konfigurace
  send-code/route.ts                      # Odeslání magic kódu
  verify-code/route.ts                    # Ověření kódu

app/
  login/page.tsx                          # Login stránka
  auth/verify/page.tsx                    # Verifikace kódu
  dashboard/page.tsx                      # Protected route example

middleware.ts                             # Auth middleware
components/providers/SessionProvider.tsx   # Session provider
```

## Bezpečnostní opatření

✅ Tokeny se ukládají jako bcrypt hash  
✅ Expirace 10 minut  
✅ Rate limiting (3 send, 5 verify per minute)  
✅ Stejné odpovědi proti enumeraci  
✅ Max 5 pokusů na token  
✅ Token se označí jako consumed po použití  

