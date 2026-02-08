# Password Reset Implementation Summary

## Změněné soubory

### 1. `lib/database/migrations/005_create_password_reset_tokens.sql` (NOVÝ)
- Tabulka `password_reset_tokens` s poli: id, user_id, token_hash, expires_at, used_at, created_at
- Indexy pro performance
- Foreign key na users s CASCADE delete

### 2. `lib/database/password-reset.ts` (NOVÝ)
- `createPasswordResetToken()` - vytvoří token s SHA-256 hashem
- `findValidPasswordResetToken()` - najde platný token (neexpirovaný, nepoužitý)
- `markPasswordResetTokenAsUsed()` - označí token jako použitý

### 3. `lib/utils/email.ts` (NOVÝ)
- `sendPasswordResetEmail()` - posílá email přes Nodemailer SMTP
- HTML a plain text verze emailu
- Používá env proměnné: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

### 4. `app/api/auth/forgot-password/route.ts` (NOVÝ)
- POST endpoint pro žádost o reset hesla
- Vždy vrací 200 (prevence email enumeration)
- Generuje 32-byte token, ukládá SHA-256 hash
- Token expiruje za 30 minut
- Posílá email s reset linkem

### 5. `app/api/auth/reset-password/route.ts` (NOVÝ)
- POST endpoint pro reset hesla
- Ověřuje token (hash, expirace, used_at)
- Aktualizuje password_hash v users tabulce (bcrypt)
- Označí token jako použitý

### 6. `app/forgot-password/page.tsx` (UPRAVENO)
- Formulář pro zadání emailu
- Success hláška: "Pokud účet s tímto e-mailem existuje, poslali jsme odkaz..."
- Loading states a error handling

### 7. `app/reset-password/page.tsx` (NOVÝ)
- Formulář pro nové heslo + potvrzení
- "Zobrazit heslo" toggle pro obě pole
- Validace: minimálně 8 znaků, shoda hesel
- Success screen s auto-redirect na login

### 8. `package.json` (UPRAVENO)
- Přidána dependency: `"nodemailer": "^6.9.8"`
- Přidána dev dependency: `"@types/nodemailer": "^6.4.14"`

---

## Environment Variables

Přidej do `.env.local`:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bibia.cz

# NextAuth URL (pro reset linky)
NEXTAUTH_URL=http://localhost:3000
```

**Poznámka pro Gmail:**
- Použij "App Password" místo běžného hesla
- Nastavení: Google Account → Security → 2-Step Verification → App passwords

---

## Jak spustit migraci

```bash
psql $DATABASE_URL -f lib/database/migrations/005_create_password_reset_tokens.sql
```

Nebo:
```bash
psql -d your_database_name -f lib/database/migrations/005_create_password_reset_tokens.sql
```

---

## Jak otestovat

### 1. Instalace závislostí

```bash
npm install
```

### 2. Nastavení SMTP

Přidej SMTP konfiguraci do `.env.local` (viz výše).

### 3. Spuštění migrace

```bash
psql $DATABASE_URL -f lib/database/migrations/005_create_password_reset_tokens.sql
```

### 4. Test Forgot Password Flow

**Krok 1: Žádost o reset**
1. Jdi na `http://localhost:3000/forgot-password`
2. Zadej email existujícího uživatele
3. Klikni "Poslat odkaz pro obnovu hesla"
4. **Očekávaný výsledek:**
   - Success hláška se zobrazí
   - Email přijde do schránky (zkontroluj spam)
   - V DB je nový řádek v `password_reset_tokens` s hashem tokenu

**Ověření v DB:**
```sql
SELECT id, user_id, token_hash, expires_at, used_at, created_at
FROM password_reset_tokens
ORDER BY created_at DESC
LIMIT 1;
```

**Krok 2: Reset hesla**
1. Otevři email a klikni na reset link (nebo zkopíruj token z URL)
2. Jdi na `http://localhost:3000/reset-password?token=<token>`
3. Zadej nové heslo (min 8 znaků) a potvrzení
4. Klikni "Obnovit heslo"
5. **Očekávaný výsledek:**
   - Success screen se zobrazí
   - Auto-redirect na login po 3 sekundách
   - V DB je `password_reset_tokens.used_at` nastaveno
   - V DB je `users.password_hash` aktualizováno

**Ověření v DB:**
```sql
-- Token je označen jako použitý
SELECT used_at FROM password_reset_tokens WHERE token_hash = '<hash>';

-- Heslo je změněno
SELECT id, email, password_hash IS NOT NULL as has_password
FROM users
WHERE email = 'test@example.com';
```

**Krok 3: Login s novým heslem**
1. Jdi na `/login`
2. Zadej email a nové heslo
3. **Očekávaný výsledek:**
   - Úspěšné přihlášení

---

### 5. Test Edge Cases

#### A) Neexistující email
1. Zadej neexistující email na `/forgot-password`
2. **Očekávaný výsledek:**
   - Stejná success hláška (prevence enumeration)
   - Žádný email není odeslán
   - Žádný token není vytvořen v DB

#### B) Expirovaný token
1. Vytvoř token (nebo uprav `expires_at` v DB na minulost)
2. Zkus reset hesla s expirovaným tokenem
3. **Očekávaný výsledek:**
   - Error: "Neplatný nebo expirovaný token"

#### C) Použitý token
1. Použij token pro reset hesla
2. Zkus použít stejný token znovu
3. **Očekávaný výsledek:**
   - Error: "Neplatný nebo expirovaný token" (token má `used_at` nastaveno)

#### D) Chybějící token v URL
1. Jdi na `/reset-password` bez tokenu
2. **Očekávaný výsledek:**
   - Error hláška: "Chybí token pro obnovu hesla"

#### E) Krátké heslo
1. Zadej heslo < 8 znaků
2. **Očekávaný výsledek:**
   - Error: "Heslo musí mít alespoň 8 znaků"

#### E) Neshodná hesla
1. Zadej různá hesla v obou polích
2. **Očekávaný výsledek:**
   - Error: "Hesla se neshodují"

---

## Bezpečnostní poznámky

✅ **Implementováno:**
- Token je hashován (SHA-256) před uložením do DB
- Token expiruje za 30 minut
- Token může být použit jen jednou
- Email enumeration prevence (vždy 200 response)
- Heslo je hashováno bcrypt před uložením
- Token je 32 bytes (256 bits) - kryptograficky bezpečný

⚠️ **Doporučení pro produkci:**
- Použij HTTPS pro reset linky
- Zvaž rate limiting na `/api/auth/forgot-password`
- Zvaž cleanup job pro expired tokens
- Použij silné SMTP credentials
- Zvaž 2FA pro reset hesla

---

## Troubleshooting

### Email se neposílá
1. Zkontroluj SMTP konfiguraci v `.env.local`
2. Zkontroluj server logs pro chyby
3. Pro Gmail: použij App Password, ne běžné heslo
4. Zkontroluj spam složku

### Token nefunguje
1. Zkontroluj, že token není expirovaný: `SELECT expires_at FROM password_reset_tokens WHERE ...`
2. Zkontroluj, že token není použitý: `SELECT used_at FROM password_reset_tokens WHERE ...`
3. Zkontroluj, že token hash odpovídá: token v URL musí být hashován SHA-256 a porovnán s DB

### Build errors
1. Spusť `npm install` pro instalaci nodemailer
2. Zkontroluj, že `@types/nodemailer` je v devDependencies

---

## Shrnutí

✅ **Všechny komponenty implementovány:**
- SQL migrace
- Database functions
- Email sending
- API endpoints
- Frontend pages
- Bezpečnostní opatření

✅ **Připraveno k testování:**
- Forgot password flow
- Reset password flow
- Edge cases
- Bezpečnostní testy

**Další krok:** Spusť migraci, nastav SMTP a otestuj celý flow.

