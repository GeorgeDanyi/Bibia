# AUDIT REPO - Zmapování bez refactoringu

## 1. STACK & STRUKTURA

### ✅ Next.js App Router
- **Root layout**: `app/layout.tsx`
  - Exportuje `RootLayout` komponentu
  - Obsahuje `SessionProvider` z `@/components/providers/SessionProvider`
  - Importuje `globals.css`
  
- **Providers**: `components/providers/SessionProvider.tsx`
  - Wrapper kolem `next-auth/react` SessionProvider
  - Používá se v root layoutu

- **Middleware**: `middleware.ts` (root)
  - Pouze legacy redirects (`/questioonaire/result` → `/results`)
  - **NEOBSAHUJE auth check** - auth se kontroluje v page komponentách
  - Matcher: `/questioonaire/result`, `/dashboard/:path*`, `/admin/:path*`

### ✅ Hlavní technologie z package.json
- **Framework**: Next.js 14.2.32
- **Auth**: next-auth 5.0.0-beta.30
- **DB**: **ŽÁDNÁ** (pouze mock placeholdery)
- **UI**: 
  - Radix UI komponenty (@radix-ui/react-*)
  - Tailwind CSS
  - Framer Motion
  - Lucide React ikony
- **Email**: **ŽÁDNÝ** (pouze console.log placeholdery)
- **Form handling**: react-hook-form + zod
- **Hashing**: bcryptjs

### ✅ Server Actions
- **Lokace**: `app/actions/newsletter.ts`
- **Funkce**: `subscribeToNewsletter` (mock implementace, pouze simulace)
- **Použití**: Newsletter subscription form

---

## 2. AUTENTIZACE (NextAuth v5)

### ✅ NextAuth konfigurace
- **Hlavní soubor**: `lib/auth.ts`
  - Exportuje: `auth`, `signIn`, `signOut`, `handlers: { GET, POST }`
  - Konfigurace: `authConfig` (satisfies NextAuthConfig)
  
- **API Route**: `app/api/auth/[...nextauth]/route.ts`
  - Re-exportuje GET, POST z `@/lib/auth`

### ✅ Providers
1. **Google Provider**
   - Client ID: `process.env.GOOGLE_CLIENT_ID`
   - Client Secret: `process.env.GOOGLE_CLIENT_SECRET`
   - Konfigurován v `lib/auth.ts:11-14`

2. **Credentials Provider** (Email + Password)
   - ID: `"credentials"`
   - Name: `"Email a heslo"`
   - Autorizace: `lib/auth.ts:22-45`
   - Validuje email + password, porovnává hash pomocí bcryptjs

3. **Email/Magic link**: **NENÍ** (byl odstraněn, viz komentář v `lib/database/auth.ts:253`)

### ✅ Session storage
- **Strategy**: JWT (`session.strategy: "jwt"`)
- **MaxAge**: 30 dní (`30 * 24 * 60 * 60`)
- **Token obsahuje**:
  - `sub`: user.id (z `jwt` callbacku)
  - Session callback přidává `session.user.id = token.sub`
- **Ukládání**: JWT v cookies (NextAuth default)

### ✅ Redirect po loginu
- **Custom signIn page**: `/login` (`pages.signIn: "/login"`)
- **Po úspěšném loginu**: 
  - `components/site/LoginForm.tsx:83` → `router.push(result?.url || redirectUrl)`
  - `app/login/page.tsx:58` → `router.push(redirectUrl)` (z `handleAuthSuccess`)
  - Default redirect: `/dashboard` (pokud není `redirectUrl`)

### ✅ Account linking (stejný email)
- **Lokace**: `lib/auth.ts:49-102` (callback `signIn`)
- **Jak funguje**:
  1. Při Google OAuth login se kontroluje, jestli už existuje user se stejným emailem
  2. Pokud ano → linkuje se Google account k existujícímu userovi (`linkAccount`)
  3. Pokud ne → vytvoří se nový user a linkuje se Google account
  4. Používá `findUserByEmail` a `linkAccount` z `lib/database/auth.ts`

---

## 3. DATABÁZE

### ❌ DB připojení / klient
- **Status**: **NENÍ IMPLEMENTOVÁNO**
- **Mock placeholder**: `lib/database/auth-init.ts`
  - Funkce `initializeAuthDatabase()` vytváří mock DB client, který **vyhodí chybu**
  - Chybová hláška: "Database client not configured"
- **TODO**: Vytvořit `lib/database/pool.ts` s PostgreSQL Pool
- **Auto-initialize**: `lib/database/auth-init.ts` se importuje v `lib/auth.ts:7`

### ✅ DB layer soubory
1. **Auth DB**: `lib/database/auth.ts`
   - Funkce: `findUserByEmail`, `findUserById`, `createUser`, `verifyUserEmail`, `findAccountByProvider`, `linkAccount`
   - **Všechny funkce používají placeholder DB client** (vyhodí chybu)

2. **Bookings DB**: `lib/database/bookings.ts`
   - **In-memory storage** (`let bookingsStore: Booking[] = []`)
   - Funkce: `createBooking`, `getBookingById`, `updateBookingStatus`
   - TODO komentář: "In production, replace this with actual database queries"

3. **Consultation Requests DB**: `lib/database/consultation-requests.ts`
   - **In-memory storage** (`let consultationRequestsStore: ConsultationRequest[] = []`)
   - Funkce: `createConsultationRequest`, `getConsultationRequestById`, `updateConsultationRequestStatus`
   - TODO komentář: "In production, replace this with actual database queries"

4. **Therapist Queries**: `lib/database/therapist-queries.ts`
   - (soubor existuje, obsah nezkoumán)

5. **Migrations**: `lib/database/migrations/`
   - `001_create_consultation_requests.sql`
   - `002_create_bookings.sql`
   - `003_create_auth_tables.sql` (users, accounts tabulky)

### ✅ TODO/Placeholder seřazeno podle dopadu

**KRITICKÉ (auth/register/login):**
1. `lib/database/auth-init.ts:9` - "TODO: Replace with actual PostgreSQL client"
2. `lib/database/auth.ts:10-11` - "TODO: Replace with your actual database client"
3. `lib/database/auth-init.ts:17` - "TODO: Replace with actual database client"
4. `lib/database/auth-init.ts:25` - "TODO: Replace with actual database client"

**VYSOKÉ (bookings/consultations):**
5. `lib/database/bookings.ts:14-15` - "For MVP, we'll use in-memory storage. In production, replace this with actual database queries"
6. `lib/database/consultation-requests.ts:14-15` - "For MVP, we'll use in-memory storage. In production, replace this with actual database queries"

**STŘEDNÍ (email/notifications):**
7. `lib/notifications/email.ts:41` - "TODO: In production, send actual email:"
8. `lib/notifications/email.ts:84` - "TODO: In production, send actual email:"

**NÍZKÉ (analytics/monitoring):**
9. `lib/utils/telemetry.ts:291` - "Analytics logging (placeholder for real analytics service)"
10. `lib/services/geocoding-logger.ts:146` - "Send log to analytics service (placeholder for production implementation)"

---

## 4. ROUTY & OCHRANA STRÁNEK

### ✅ Všechny routy v /app

#### **PUBLIC ROUTES** (žádná ochrana):
1. `/` (`app/page.tsx`) - **PUBLIC**
2. `/login` (`app/login/page.tsx`) - **PUBLIC** (client-side redirect handling)
3. `/questionnaire` (`app/questionnaire/page.tsx`) - **PUBLIC**
4. `/questionnaire/results` (`app/questionnaire/results/page.tsx`) - **PUBLIC**
5. `/results` (`app/results/page.tsx`) - **PUBLIC**
6. `/therapists/[id]` (`app/therapists/[id]/page.tsx`) - **PUBLIC**
7. `/pro-terapeuty` (`app/pro-terapeuty/page.tsx`) - **PUBLIC**
8. `/forgot-password` (`app/forgot-password/page.tsx`) - **PUBLIC** (placeholder, "brzy k dispozici")
9. `/status` (`app/status/page.tsx`) - **PUBLIC** (pravděpodobně)
10. `/questionnaire-v1` (`app/questionnaire-v1/page.tsx`) - **PUBLIC** (legacy)

#### **PROTECTED ROUTES** (vyžadují auth):
1. `/dashboard` (`app/dashboard/page.tsx`) - **PROTECTED**
   - Ochrana: `await auth()` + `redirect('/login?redirect=/dashboard')` pokud není session
   - Typ: Server-side check v page komponentě

2. `/admin/consultations` (`app/admin/consultations/page.tsx`) - **PROTECTED?**
   - **POZOR**: Neobsahuje explicitní auth check v kódu!
   - Pouze client-side fetch na `/api/consultation-requests/list`
   - **RIZIKO**: Stránka může být přístupná bez autentizace

### ✅ API Routes

#### **PUBLIC API**:
1. `/api/auth/[...nextauth]` (`app/api/auth/[...nextauth]/route.ts`) - **PUBLIC** (NextAuth handler)
2. `/api/auth/register` (`app/api/auth/register/route.ts`) - **PUBLIC** (registrace)
3. `/api/searchTherapists` (`app/api/searchTherapists/route.ts`) - **PUBLIC**
4. `/api/searchSimple` (`app/api/searchSimple/route.ts`) - **PUBLIC**
5. `/api/searchTherapistsNew` (`app/api/searchTherapistsNew/route.ts`) - **PUBLIC**
6. `/api/therapists` (`app/api/therapists/route.ts`) - **PUBLIC**
7. `/api/therapists/[id]` (`app/api/therapists/[id]/route.ts`) - **PUBLIC**
8. `/api/therapists/[id]/slots` (`app/api/therapists/[id]/slots/route.ts`) - **PUBLIC**
9. `/api/geocode` (`app/api/geocode/route.ts`) - **PUBLIC**
10. `/api/health` (`app/api/health/route.ts`) - **PUBLIC**
11. `/api/searchTherapists/health` (`app/api/searchTherapists/health/route.ts`) - **PUBLIC**
12. `/api/testMatching` (`app/api/testMatching/route.ts`) - **PUBLIC** (debug)
13. `/api/debug/geo` (`app/api/debug/geo/route.ts`) - **PUBLIC** (debug)
14. `/api/debug/countNearby` (`app/api/debug/countNearby/route.ts`) - **PUBLIC** (debug)

#### **PROTECTED API** (pravděpodobně, ale neověřeno):
1. `/api/bookings` (`app/api/bookings/route.ts`) - **PRAVDĚPODOBNĚ PROTECTED** (neověřeno)
2. `/api/consultation-requests` (`app/api/consultation-requests/route.ts`) - **PRAVDĚPODOBNĚ PROTECTED** (neověřeno)
3. `/api/consultation-requests/[id]` (`app/api/consultation-requests/[id]/route.ts`) - **PRAVDĚPODOBNĚ PROTECTED** (neověřeno)
4. `/api/consultation-requests/list` (`app/api/consultation-requests/list/route.ts`) - **PRAVDĚPODOBNĚ PROTECTED** (neověřeno)
5. `/api/admin/geo-tuning` (`app/api/admin/geo-tuning/route.ts`) - **PRAVDĚPODOBNĚ PROTECTED** (admin, neověřeno)

### ✅ Ochrana stránek - detail

- **Middleware**: **NEPOUŽÍVÁ SE** pro auth (pouze legacy redirects)
- **Server-side auth()**: Pouze `/dashboard` používá `await auth()` + `redirect()`
- **Client-side guards**: Žádné explicitní guards v klientských komponentách
- **Admin stránka**: **CHYBÍ AUTH CHECK** v `app/admin/consultations/page.tsx`

---

## 5. CHYBĚJÍCÍ SOUBORY / 404 DLUHY

### ❌ Chybějící route.ts v /app/api/auth/
1. **`/app/api/auth/send-code/`** - složka existuje, ale **NENÍ route.ts**
   - Složka je prázdná
   - Odkazuje na ni dokumentace (AUTH_IMPLEMENTATION_GUIDE.md)

2. **`/app/api/auth/verify-code/`** - složka existuje, ale **NENÍ route.ts**
   - Složka je prázdná
   - Odkazuje na ni dokumentace (AUTH_IMPLEMENTATION_GUIDE.md)

### ❌ Neexistující stránky (404) - odkazy v UI

#### **Z footeru** (`components/site/footer.tsx`):
1. `/about` - "O nás" (řádek 15)
2. `/how-it-works` - "Jak to funguje" (řádek 18)
3. `/team` - "Náš tým" (řádek 21)
4. `/careers` - "Kariéra" (řádek 24)
5. `/faq` - "Často kladené otázky" (řádek 33)
6. `/insurance` - "Pojištění" (řádek 36)
7. `/pricing` - "Ceník" (řádek 39)
8. `/blog` - "Blog" (řádek 42)
9. `/therapist-registration` - "Registrace" (řádek 51)
10. `/therapist-dashboard` - "Přihlášení" (řádek 54)
11. `/therapist-benefits` - "Výhody spolupráce" (řádek 57)
12. `/therapist-support` - "Podpora" (řádek 60)
13. `/contact` - "Kontaktní formulář" (řádek 69)
14. `/support` - "Technická podpora" (řádek 78)

#### **Z login stránky** (`app/login/page.tsx`):
15. `/terms` - "Podmínky" (řádek 127)
16. `/pricing` - "Ceník" (řádek 131)
17. `/contact` - "Kontakt" (řádek 135)

#### **Z AuthCard/RegisterForm** (`components/site/RegisterForm.tsx`):
18. `/terms` - "Podmínky" (řádek 323)
19. `/privacy` - "Zásady soukromí" (řádek 327)

#### **Z questionnaire** (`app/questionnaire/QuestionnaireClient.tsx`):
20. `/privacy` - "Zásady soukromí" (řádek 1075)

#### **Z AuthPage** (`components/site/AuthPage.tsx`):
21. `/terms` - "Podmínky" (řádek 104)
22. `/pricing` - "Ceník" (řádek 108)
23. `/contact` - "Kontakt" (řádek 112)

#### **Chybějící reset-password**:
24. `/reset-password` - **NENÍ** (pouze `/forgot-password` existuje jako placeholder)

---

## TOP 5 NEJVĚTŠÍCH RIZIK PRO PRODUKCI

### 🔴 1. DATABÁZE NENÍ IMPLEMENTOVÁNA
**Dopad**: KRITICKÝ - aplikace nefunguje
- Auth DB: Všechny funkce vyhodí chybu "Database client not configured"
- Bookings/Consultations: Pouze in-memory storage (data se ztratí při restartu)
- **Cesta**: `lib/database/auth-init.ts`, `lib/database/auth.ts`, `lib/database/bookings.ts`, `lib/database/consultation-requests.ts`
- **Řešení**: Implementovat PostgreSQL Pool a připojit k reálné DB

### 🔴 2. ADMIN STRÁNKA NENÍ CHRÁNĚNA
**Dopad**: VYSOKÝ - bezpečnostní riziko
- `/admin/consultations` nemá auth check
- Kdokoliv může přistupovat k administračnímu rozhraní
- **Cesta**: `app/admin/consultations/page.tsx`
- **Řešení**: Přidat `await auth()` check a redirect pokud není admin role

### 🟠 3. CHYBĚJÍCÍ API ROUTES PRO AUTH
**Dopad**: STŘEDNÍ - funkcionalita není dokončena
- `/api/auth/send-code` - složka existuje, ale chybí `route.ts`
- `/api/auth/verify-code` - složka existuje, ale chybí `route.ts`
- **Cesta**: `app/api/auth/send-code/`, `app/api/auth/verify-code/`
- **Řešení**: Implementovat magic link / email verification flow

### 🟠 4. EMAIL NENÍ IMPLEMENTOVÁN
**Dopad**: STŘEDNÍ - uživatelé nedostanou emaily
- Newsletter subscription: Pouze console.log
- Email verification: Není implementováno
- Password reset: Není implementováno
- **Cesta**: `lib/notifications/email.ts`
- **Řešení**: Integrovat Resend/SMTP pro odesílání emailů

### 🟡 5. MNOŽSTVÍ 404 ODKAZŮ V UI
**Dopad**: NÍZKÝ - špatný UX, ale neblokuje funkčnost
- 24+ neexistujících stránek odkázaných z footeru, login stránky, atd.
- Uživatelé klikají na odkazy a dostávají 404
- **Cesta**: Viz sekce 5 výše
- **Řešení**: Vytvořit chybějící stránky nebo odstranit/komentovat odkazy

---

## DODATEČNÉ POZNÁMKY

- **NextAuth v5 Beta**: Používá se beta verze (5.0.0-beta.30), může obsahovat nestabilní API
- **Middleware auth**: Auth se nekontroluje v middleware, pouze v page komponentách (záměrně kvůli Next.js 14 limitacím)
- **Mock data**: Aplikace používá mock data pro terapeuty (MOCK_THERAPISTS) a availability
- **In-memory storage**: Bookings a consultation requests jsou pouze v paměti, data se ztratí při restartu

