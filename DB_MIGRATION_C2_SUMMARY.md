# C2: PostgreSQL Integration Summary

## Změněné soubory

### 1. `package.json`
**Změny:**
- Přidána dependency: `"pg": "^8.11.3"`
- Přidána dev dependency: `"@types/pg": "^8.10.9"`

### 2. `src/lib/db.ts` (NOVÝ)
**Obsah:**
- PostgreSQL Pool z `pg` knihovny
- Používá `process.env.DATABASE_URL`
- Global cache v development (`globalThis.__dbPool`) pro Next.js hot reload
- Exportuje `query(text, params)` funkci
- Exportuje `transaction(fn)` funkci pro transakce
- **Sanity check:** Vyhodí error pokud chybí `DATABASE_URL`

### 3. `lib/database/auth.ts`
**Změny:**
- ❌ Odstraněno: `initAuthDb()`, `DatabaseClient` interface, `getDb()`, `db` proměnná
- ✅ Přidáno: Import `query` z `@/src/lib/db`
- ✅ Všechny `getDb().query(...)` přepsány na `query(...)`
- ✅ Zachovány všechny exporty a typy (User, Account, findUserByEmail, createUser, findAccountByProvider, linkAccount)

**Funkce používající query:**
- `findUserByEmail()` - řádek 38
- `findUserById()` - řádek 65
- `createUser()` - řádek 98
- `verifyUserEmail()` - řádek 129
- `findAccountByProvider()` - řádek 142
- `linkAccount()` - řádek 181

### 4. `lib/database/auth-init.ts`
**Změny:**
- Přepsáno na no-op (prázdný soubor s komentářem)
- Odstraněna všechna inicializační logika
- Zachováno pro backwards compatibility

### 5. `lib/auth.ts`
**Změny:**
- ❌ Odstraněn: `import "@/lib/database/auth-init"` (side-effect import)
- ✅ Zachován: Import funkcí z `@/lib/database/auth`

---

## Test Plan

### Předpoklady
1. PostgreSQL databáze běží lokálně nebo vzdáleně
2. `.env.local` obsahuje: `DATABASE_URL=postgresql://user:password@localhost:5432/dbname`
3. Migrace jsou spuštěny (viz níže)
4. Dev server běží: `npm run dev`

---

### 1. Lokální registrace přes `/api/auth/register`

**Kroky:**
1. Otevři Postman/curl nebo frontend formulář
2. POST request na `http://localhost:3000/api/auth/register`
3. Body:
   ```json
   {
     "email": "test@example.com",
     "password": "testpassword123",
     "name": "Test User"
   }
   ```

**Očekávaný výsledek:**
- ✅ Status 201 Created
- ✅ Response obsahuje `user` objekt s `id`, `email`, `name`
- ✅ V databázi je nový řádek v `users` tabulce
- ✅ `password_hash` je bcrypt hash (ne plaintext)
- ✅ `role` je `'user'` (default)
- ✅ `email_verified_at` je `null`

**Ověření v DB:**
```sql
SELECT id, email, name, role, password_hash IS NOT NULL as has_password, 
       email_verified_at, created_at 
FROM users 
WHERE email = 'test@example.com';
```

**Edge cases:**
- ❌ Duplicitní email → 409 Conflict
- ❌ Neplatný email → 400 Bad Request
- ❌ Heslo < 8 znaků → 400 Bad Request

---

### 2. Login přes Credentials

**Kroky:**
1. Použij uživatele vytvořeného v kroku 1
2. Jdi na `http://localhost:3000/login`
3. Vyplň email: `test@example.com`
4. Vyplň heslo: `testpassword123`
5. Klikni "Přihlásit se"

**Očekávaný výsledek:**
- ✅ Úspěšné přihlášení
- ✅ Redirect na `/dashboard` (nebo `redirectUrl` pokud je v query)
- ✅ Session cookie je nastavená
- ✅ Na dashboardu vidíš email uživatele

**Ověření:**
- Network tab: Cookie `next-auth.session-token` je nastavená
- Dashboard zobrazuje: "Přihlášen jako: test@example.com"

**Edge cases:**
- ❌ Špatné heslo → Error message, zůstaneš na `/login`
- ❌ Neexistující email → Error message
- ❌ Prázdné pole → Validation error

---

### 3. Google Sign-In

**Příprava:**
1. Zkontroluj, že `.env.local` obsahuje:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
2. Google OAuth app má redirect URI: `http://localhost:3000/api/auth/callback/google`

**Kroky:**
1. Jdi na `http://localhost:3000/login`
2. Klikni "Pokračovat s Google"
3. Přihlas se Google účtem (např. `google-user@gmail.com`)
4. Autorizuj aplikaci

**Očekávaný výsledek:**
- ✅ Redirect na Google OAuth consent screen
- ✅ Po autorizaci redirect zpět na `/dashboard`
- ✅ V databázi je nový řádek v `users` tabulce s Google emailem
- ✅ V databázi je nový řádek v `accounts` tabulce:
  - `provider = 'google'`
  - `provider_account_id` = Google user ID
  - `user_id` = UUID z `users` tabulky

**Ověření v DB:**
```sql
-- Zkontroluj user
SELECT id, email, name, image, role, email_verified_at 
FROM users 
WHERE email = 'google-user@gmail.com';

-- Zkontroluj account linking
SELECT a.id, a.provider, a.provider_account_id, a.user_id, u.email
FROM accounts a
JOIN users u ON a.user_id = u.id
WHERE u.email = 'google-user@gmail.com';
```

---

### 4. Account Linking (stejný email)

**Scénář:** Uživatel má účet s email+heslo, pak použije Google se stejným emailem.

**Příprava:**
1. Vytvoř uživatele přes `/api/auth/register` s emailem `same@example.com`
2. Ověř v DB, že existuje v `users` tabulce

**Kroky:**
1. Jdi na `http://localhost:3000/login`
2. Klikni "Pokračovat s Google"
3. Přihlas se Google účtem se stejným emailem: `same@example.com`
4. Autorizuj aplikaci

**Očekávaný výsledek:**
- ✅ Úspěšné přihlášení
- ✅ **NENÍ vytvořen nový user** - používá se existující
- ✅ V databázi je nový řádek v `accounts` tabulce:
  - `provider = 'google'`
  - `user_id` = UUID existujícího usera (ne nový)
- ✅ V `users` tabulce je stále jen **jeden** řádek s `same@example.com`

**Ověření v DB:**
```sql
-- Měl by být jen jeden user
SELECT COUNT(*) as user_count FROM users WHERE email = 'same@example.com';
-- Očekáváno: 1

-- Měly by být 2 accounts (credentials + google) pro stejného usera
SELECT a.provider, a.provider_account_id, a.user_id
FROM accounts a
JOIN users u ON a.user_id = u.id
WHERE u.email = 'same@example.com';
-- Očekáváno: 2 řádky (credentials a google)
```

**Edge case:**
- Pokud Google account už existuje (stejný `provider_account_id`), měl by se aktualizovat (ON CONFLICT DO UPDATE)

---

## Spuštění migrací lokálně

### Metoda 1: Přes psql CLI

```bash
# Připoj se k databázi
psql -d your_database_name

# Spusť migraci
\i lib/database/migrations/004_create_auth_tables.sql

# Nebo přímo z terminálu:
psql -d your_database_name -f lib/database/migrations/004_create_auth_tables.sql
```

### Metoda 2: Přes DATABASE_URL

```bash
psql $DATABASE_URL -f lib/database/migrations/004_create_auth_tables.sql
```

### Metoda 3: Vytvoř migrační script (volitelné)

Vytvoř `scripts/migrate-auth.ts`:
```typescript
import { readFileSync } from 'fs'
import { query } from '@/src/lib/db'

const migration = readFileSync('lib/database/migrations/004_create_auth_tables.sql', 'utf-8')
await query(migration)
```

---

## Troubleshooting

### Chyba: "DATABASE_URL environment variable is not set"
**Řešení:** Přidej `DATABASE_URL` do `.env.local` a restartuj dev server

### Chyba: "relation 'users' does not exist"
**Řešení:** Spusť migraci (viz výše)

### Chyba: "extension 'pgcrypto' does not exist"
**Řešení:** V PostgreSQL spusť:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Chyba: "password authentication failed"
**Řešení:** Zkontroluj `DATABASE_URL` - user, password, host, port, dbname

### Pool connection errors
**Řešení:** 
- Zkontroluj, že PostgreSQL běží
- Zkontroluj firewall/network settings
- Zkontroluj max_connections v PostgreSQL

---

## Ověření správné funkčnosti

### Quick check script

Vytvoř `scripts/test-db-connection.ts`:
```typescript
import { query } from '@/src/lib/db'

async function test() {
  try {
    // Test connection
    const result = await query('SELECT NOW() as time')
    console.log('✅ DB connection OK:', result.rows[0].time)
    
    // Test users table
    const users = await query('SELECT COUNT(*) as count FROM users')
    console.log('✅ Users table exists, count:', users.rows[0].count)
    
    // Test accounts table
    const accounts = await query('SELECT COUNT(*) as count FROM accounts')
    console.log('✅ Accounts table exists, count:', accounts.rows[0].count)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

test()
```

Spusť: `npx tsx scripts/test-db-connection.ts`

---

## Shrnutí

✅ **Všechny změny jsou hotové:**
- DB client vytvořen (`src/lib/db.ts`)
- Auth layer přepisán na reálný Postgres
- Mocky odstraněny
- Sanity check přidán
- Importy opraveny

✅ **Připraveno k testování:**
- Registrace přes API
- Credentials login
- Google sign-in
- Account linking

**Další krok:** Spusť migraci a otestuj všechny scénáře podle test planu výše.

