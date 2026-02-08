# Login Redirect Fix - ?next= Parameter

## Změněné soubory

### 1. `app/login/page.tsx`
**Změny:**
- Přidána podpora pro `next` parametr z searchParams
- Priorita: `next` > `callbackUrl` > `redirect`
- `redirectUrl` se předává do `AuthCard` komponenty

**Řádky:**
- Řádek 44-46: Čtení `next` parametru s prioritou

### 2. `components/site/LoginForm.tsx`
**Změny:**
- Přidáno Google sign-in tlačítko s `callbackUrl` podporou
- `signIn("credentials")` používá `redirect: true` a `callbackUrl: redirectUrl`
- Fallback na `/dashboard` pokud `redirectUrl` není poskytnut

**Řádky:**
- Řádek 70-75: `signIn("credentials")` s `callbackUrl`
- Řádek 198-220: Google sign-in tlačítko s `signIn("google", { callbackUrl: redirectUrl })`

### 3. `lib/utils/auth.ts`
**Změny:**
- Vylepšená validace `sanitizeRedirectUrl` - kontroluje `http` kdekoli v URL (ne jen na začátku)
- Přidána kontrola pro `data:`, `mailto:`, `tel:` schémata

**Řádky:**
- Řádek 15-17: Kontrola `http` kdekoli v URL
- Řádek 19-22: Kontrola dalších nebezpečných schémat

---

## Jak to funguje

### Flow pro nepřihlášeného uživatele:

1. **Uživatel jde na `/admin/consultations`**
   - Middleware detekuje, že není přihlášený
   - Redirect na `/login?next=/admin/consultations`

2. **Na `/login` stránce:**
   - `LoginContent` čte `next` z searchParams
   - Validuje pomocí `sanitizeRedirectUrl()` (musí začínat `/`, nesmí obsahovat `http`)
   - Předává `redirectUrl` do `AuthCard` → `LoginForm`

3. **Při přihlášení:**
   - **Credentials:** `signIn("credentials", { redirect: true, callbackUrl: redirectUrl })`
   - **Google:** `signIn("google", { callbackUrl: redirectUrl })`
   - NextAuth automaticky přesměruje na `callbackUrl` po úspěšném loginu

4. **Po přihlášení:**
   - **Admin user:** Přesměrován na `/admin/consultations` (middleware zkontroluje role)
   - **Non-admin user:** Přesměrován na `/dashboard?error=unauthorized` (middleware detekuje ne-admin)

---

## Jak otestovat

### Test 1: Nepřihlášený přístup na `/admin/consultations` → Admin user

**Kroky:**
1. Odhlas se (nebo použij anonymní režim)
2. Jdi na `http://localhost:3000/admin/consultations`
3. **Očekávaný výsledek:**
   - Redirect na `/login?next=/admin/consultations`
   - URL v prohlížeči: `/login?next=/admin/consultations`

4. Přihlas se s **admin emailem** (email v `ADMIN_EMAILS`)
5. **Očekávaný výsledek:**
   - Po úspěšném loginu redirect na `/admin/consultations`
   - Stránka se načte bez error hlášky

**Ověření:**
- Network tab: 307 redirect na `/login?next=/admin/consultations`
- Po loginu: 200 OK na `/admin/consultations`
- Console: žádné error hlášky

---

### Test 2: Nepřihlášený přístup na `/admin/consultations` → Non-admin user

**Kroky:**
1. Odhlas se (nebo použij anonymní režim)
2. Jdi na `http://localhost:3000/admin/consultations`
3. **Očekávaný výsledek:**
   - Redirect na `/login?next=/admin/consultations`

4. Přihlas se s **ne-admin emailem** (email NENÍ v `ADMIN_EMAILS`)
5. **Očekávaný výsledek:**
   - Po úspěšném loginu redirect na `/dashboard?error=unauthorized`
   - Na dashboardu se zobrazí červený alert: "Nemáte oprávnění"

**Ověření:**
- Network tab: 307 redirect na `/login?next=/admin/consultations`
- Po loginu: 307 redirect na `/dashboard?error=unauthorized`
- Dashboard zobrazuje error hlášku

---

### Test 3: Google Sign-In s `?next=` parametrem

**Kroky:**
1. Odhlas se
2. Jdi na `http://localhost:3000/login?next=/dashboard`
3. Klikni na "Pokračovat s Google"
4. Přihlas se Google účtem
5. **Očekávaný výsledek:**
   - Po úspěšném Google OAuth redirect na `/dashboard`
   - URL v prohlížeči: `/dashboard` (bez `?next=`)

**Ověření:**
- Google OAuth flow proběhne
- Redirect na správnou URL z `callbackUrl`

---

### Test 4: Credentials Login s `?next=` parametrem

**Kroky:**
1. Odhlas se
2. Jdi na `http://localhost:3000/login?next=/dashboard`
3. Vyplň email + heslo
4. Klikni "Přihlásit se"
5. **Očekávaný výsledek:**
   - Po úspěšném loginu redirect na `/dashboard`
   - URL v prohlížeči: `/dashboard` (bez `?next=`)

**Ověření:**
- Login proběhne úspěšně
- Redirect na správnou URL z `callbackUrl`

---

### Test 5: Neplatný `?next=` parametr (bezpečnostní test)

**Kroky:**
1. Jdi na `http://localhost:3000/login?next=http://evil.com`
2. Přihlas se
3. **Očekávaný výsledek:**
   - `sanitizeRedirectUrl()` detekuje `http` v URL
   - Fallback na `/dashboard`
   - Redirect na `/dashboard` (ne na evil.com)

**Ověření:**
- Network tab: redirect na `/dashboard` (ne na externí URL)
- Console: žádné error hlášky

---

## Shrnutí změn

✅ **Upravené soubory:**
1. `app/login/page.tsx` - podpora pro `next` parametr
2. `components/site/LoginForm.tsx` - Google sign-in tlačítko + `callbackUrl` v credentials
3. `lib/utils/auth.ts` - vylepšená validace `sanitizeRedirectUrl`

✅ **Funkčnost:**
- `?next=` parametr je podporován
- Validace interní cesty (prevence open redirect)
- Google sign-in podporuje `callbackUrl`
- Credentials login podporuje `callbackUrl`
- Fallback na `/dashboard` pokud `next` není nebo je neplatný

✅ **Bezpečnost:**
- Validace, že URL začíná `/`
- Kontrola, že URL neobsahuje `http` (kdekoli)
- Kontrola dalších nebezpečných schémat
- Limit délky URL (2048 znaků)

