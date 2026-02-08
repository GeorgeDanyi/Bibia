# Roles Implementation - Patient/Therapist/Admin

## Změněné soubory

### 1. `lib/database/migrations/006_update_user_roles.sql` (NOVÝ)
**Změny:**
- Přenastaví existující `users.role = 'user'` na `'patient'`
- Změní default z `'user'` na `'patient'`
- Přidá CHECK constraint pro povolené hodnoty: `'patient' | 'therapist' | 'admin'`

### 2. `lib/database/auth.ts`
**Změny:**
- `User` interface: `role: 'patient' | 'therapist' | 'admin'` (místo `'user' | 'admin'`)
- `createUser()`: Přidán parametr `role?: 'patient' | 'therapist' | 'admin'` (default `'patient'`)

### 3. `lib/auth.ts`
**Změny:**
- **jwt callback:**
  - Admin z `ADMIN_EMAILS` má vždy `role='admin'` (přepíše DB hodnotu)
  - Jinak čte role z DB (`users.role`) pomocí `findUserByEmail()`
  - Fallback `'patient'` pokud uživatel není v DB
- **session callback:**
  - Fallback změněn z `'user'` na `'patient'`
- **signIn callback (OAuth):**
  - Noví OAuth uživatelé dostanou default role `'patient'`

### 4. `app/api/auth/register/route.ts`
**Změny:**
- Přijímá `role` parametr z request body
- Validuje, že role je `'patient'` nebo `'therapist'` (ne `'admin'`)
- Default `'patient'` pokud není poskytnut nebo je neplatný
- Předává `role` do `createUser()`

### 5. `components/site/RegisterForm.tsx`
**Změny:**
- Přidán state `role` (default `'patient'`)
- Přidán výběr role pomocí radio buttons: "Pacient" / "Fyzioterapeut"
- Předává `role` do API při registraci

### 6. `lib/utils/auth.ts`
**Změny:**
- Přidána funkce `getDefaultRedirectUrl(role)`:
  - `therapist` → `/pro-terapeuty`
  - `admin` → `/admin/consultations`
  - `patient` nebo neznámá → `/dashboard`

### 7. `middleware.ts`
**Změny:**
- Fallback role změněn z `'user'` na `'patient'` při kontrole admin role

---

## Jak to funguje

### 1. Registrace

**Flow:**
1. Uživatel vyplní email, heslo a vybere roli (patient/therapist)
2. `RegisterForm` pošle `{ email, password, role }` do `/api/auth/register`
3. API validuje role (musí být `'patient'` nebo `'therapist'`)
4. `createUser()` vytvoří uživatele s danou rolí
5. Uživatel je přesměrován na `/login`

### 2. Login

**Flow:**
1. Uživatel se přihlásí (credentials nebo Google)
2. **jwt callback:**
   - Pokud email je v `ADMIN_EMAILS` → `role = 'admin'` (přepíše DB)
   - Jinak načte uživatele z DB a použije `user.role`
   - Fallback `'patient'` pokud uživatel není v DB
3. Role se uloží do JWT tokenu
4. **session callback:**
   - Role se přidá do session z tokenu
5. Redirect:
   - Pokud je `?next=` parametr → použije se
   - Jinak default podle role (zatím `/dashboard` pro všechny)

### 3. OAuth (Google)

**Flow:**
1. Uživatel se přihlásí přes Google
2. Pokud uživatel neexistuje → vytvoří se s `role = 'patient'`
3. Pokud uživatel existuje → použije se jeho DB role
4. Admin z `ADMIN_EMAILS` má vždy `role = 'admin'`

---

## Migrace

### Spuštění migrace:

```bash
psql $DATABASE_URL -f lib/database/migrations/006_update_user_roles.sql
```

Nebo:
```bash
psql -d your_database_name -f lib/database/migrations/006_update_user_roles.sql
```

### Co migrace dělá:

1. **UPDATE** všechny existující `users.role = 'user'` → `'patient'`
2. **ALTER** default hodnotu z `'user'` na `'patient'`
3. **ADD CONSTRAINT** `users_role_check` pro povolené hodnoty: `'patient' | 'therapist' | 'admin'`

### Ověření:

```sql
-- Zkontroluj, že všechny role jsou validní
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Zkontroluj constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname = 'users_role_check';
```

---

## Jak otestovat

### Test 1: Registrace jako Patient

**Kroky:**
1. Jdi na `/login` → tab "Registrace"
2. Vyplň email, heslo
3. Vyber "Pacient"
4. Klikni "Vytvořit účet"
5. **Očekávaný výsledek:**
   - Účet vytvořen s `role = 'patient'`
   - Redirect na `/login`

**Ověření v DB:**
```sql
SELECT email, role FROM users WHERE email = 'test@example.com';
-- Očekávaný výsledek: role = 'patient'
```

### Test 2: Registrace jako Therapist

**Kroky:**
1. Jdi na `/login` → tab "Registrace"
2. Vyplň email, heslo
3. Vyber "Fyzioterapeut"
4. Klikni "Vytvořit účet"
5. **Očekávaný výsledek:**
   - Účet vytvořen s `role = 'therapist'`
   - Redirect na `/login`

**Ověření v DB:**
```sql
SELECT email, role FROM users WHERE email = 'therapist@example.com';
-- Očekávaný výsledek: role = 'therapist'
```

### Test 3: Login jako Patient

**Kroky:**
1. Přihlas se s patient účtem
2. **Očekávaný výsledek:**
   - Session obsahuje `user.role = 'patient'`
   - Redirect na `/dashboard` (nebo `?next=` pokud je)

**Ověření:**
- Otevři DevTools → Application → Cookies → `next-auth.session-token`
- Dekóduj JWT token (např. jwt.io)
- Zkontroluj `role` field → mělo by být `'patient'`

### Test 4: Login jako Therapist

**Kroky:**
1. Přihlas se s therapist účtem
2. **Očekávaný výsledek:**
   - Session obsahuje `user.role = 'therapist'`
   - Redirect na `/dashboard` (nebo `?next=` pokud je)

**Ověření:**
- JWT token obsahuje `role = 'therapist'`

### Test 5: Admin z ADMIN_EMAILS

**Kroky:**
1. Nastav `ADMIN_EMAILS=admin@example.com` v `.env.local`
2. Vytvoř účet s `admin@example.com` (role bude `'patient'` v DB)
3. Přihlas se
4. **Očekávaný výsledek:**
   - Session obsahuje `user.role = 'admin'` (přepíše DB hodnotu)
   - Může přistupovat na `/admin/*`

**Ověření:**
- JWT token obsahuje `role = 'admin'` (i když DB má `'patient'`)
- Může přistupovat na `/admin/consultations`

### Test 6: Google OAuth

**Kroky:**
1. Přihlas se přes Google s novým emailem
2. **Očekávaný výsledek:**
   - Nový uživatel vytvořen s `role = 'patient'`
   - Pokud email je v `ADMIN_EMAILS` → `role = 'admin'`

**Ověření v DB:**
```sql
SELECT email, role FROM users WHERE email = 'oauth@example.com';
-- Očekávaný výsledek: role = 'patient' (nebo 'admin' pokud je v ADMIN_EMAILS)
```

---

## Shrnutí

✅ **DB migrace:**
- Default role změněn z `'user'` na `'patient'`
- Existující `'user'` → `'patient'`
- CHECK constraint pro `'patient' | 'therapist' | 'admin'`

✅ **NextAuth callbacks:**
- Admin z `ADMIN_EMAILS` má vždy `role='admin'` (přepíše DB)
- Jinak role čtena z DB (`users.role`)
- Fallback `'patient'`

✅ **Registrace:**
- Výběr role patient/therapist
- Role ukládána do DB

✅ **Kompatibilita:**
- Admin role stále funguje přes `ADMIN_EMAILS`
- Existující uživatelé automaticky `'patient'`
- OAuth uživatelé dostanou `'patient'` default

⚠️ **Poznámka:**
- Role-based redirect po loginu zatím není plně implementován (používá se `?next=` nebo `/dashboard`)
- Pro plnou implementaci by bylo potřeba upravit NextAuth redirect logiku nebo použít middleware

