# Troubleshooting - Internal Server Error

## Možné příčiny Internal Server Error

### 1. Database Client není inicializovaný

**Chyba**: `Database client not initialized. Call initAuthDb() first.`

**Řešení**: Vytvoř `lib/database/pool.ts` a inicializuj DB client:

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

Pak importuj tento soubor v `app/api/auth/[...nextauth]/route.ts`:
```typescript
import '@/lib/database/pool' // Initialize DB
```

### 2. Chybí Environment Variables

**Zkontroluj `.env.local`**:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generuj-nahodny-secret-min-32-znaku
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**Generování NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Database tabulky neexistují

**Spusť migraci:**
```bash
psql -d your_database < lib/database/migrations/003_create_auth_tables.sql
```

### 4. NextAuth v5 Beta kompatibilita

Pokud máš problémy s NextAuth v5 beta, zkus:
- Restart dev serveru: `npm run dev`
- Smazat `.next` cache: `rm -rf .next`
- Zkontrolovat, že všechny importy jsou správné

### 5. Middleware problémy

Middleware v Next.js 14 nemůže být async. Auth check je nyní v page komponentách.

## Jak zjistit přesnou chybu

1. **Zkontroluj server logs** v terminálu, kde běží `npm run dev`
2. **Zkontroluj browser console** pro client-side chyby
3. **Zkontroluj Network tab** v DevTools pro API errors

## Rychlý test

1. Otevři `/login` - mělo by fungovat bez DB (jen UI)
2. Zkus poslat kód - mělo by vyhodit chybu pokud DB není nastavená
3. Zkontroluj server logs pro přesnou chybovou hlášku

