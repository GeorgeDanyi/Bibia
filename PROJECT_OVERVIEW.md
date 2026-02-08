# 📋 Přehled projektu BIBIA

## 1. Framework & Stack

### ✅ Framework
- **Next.js 14.2.32** (App Router)
- **Router**: App Router (`app/` directory) - **NENÍ Pages Router**
- **Konfigurace**: [`next.config.js`](next.config.js)
- **TypeScript**: ✅ Ano

### ✅ UI Framework
- **Tailwind CSS 3.3.0** - [`tailwind.config.js`](tailwind.config.js)
- **shadcn/ui** - [`components.json`](components.json)
  - Style: "new-york"
  - Base color: "neutral"
  - Icon library: lucide-react
  - Komponenty: Radix UI (accordion, dialog, navigation-menu, tabs, slot)
- **Framer Motion** - animace
- **CSS Variables** pro theming

### ✅ Backend
- **Next.js API Routes** (`app/api/`)
- **Server Actions** - [`app/actions/newsletter.ts`](app/actions/newsletter.ts)
- **Middleware** - [`middleware.ts`](middleware.ts) (legacy redirects)

### ⚠️ Database
- **Typ**: Raw SQL (PostgreSQL pravděpodobně)
- **ORM**: ❌ NENÍ Prisma
- **Setup**: Mock DB client v [`lib/database/auth-init.ts`](lib/database/auth-init.ts)
- **Status**: ⚠️ **DB client není nakonfigurován** - je tam placeholder
- **Migrace**: [`lib/database/migrations/003_create_auth_tables.sql`](lib/database/migrations/003_create_auth_tables.sql)
- **Helper funkce**: [`lib/database/auth.ts`](lib/database/auth.ts)

---

## 2. Autentizace

### ✅ NextAuth v5 (beta)
- **Soubor konfigurace**: [`lib/auth.ts`](lib/auth.ts)
- **API Route**: [`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts)
- **Session Provider**: [`components/providers/SessionProvider.tsx`](components/providers/SessionProvider.tsx)

### ✅ Auth Providers
1. **Google OAuth** ✅
   - Client ID: `GOOGLE_CLIENT_ID`
   - Client Secret: `GOOGLE_CLIENT_SECRET`
   - Flow: OAuth redirect → callback → session

2. **Credentials (Email + Heslo)** ✅
   - Provider ID: "credentials"
   - Validace: bcrypt hash comparison
   - Flow: POST → authorize → session

3. **Magic Link** ⚠️ **Připraveno, ale neimplementováno**
   - API routes existují: `/api/auth/send-code`, `/api/auth/verify-code`
   - Ale soubory chybí (404 při čtení)
   - DB tabulka: `magic_tokens` existuje v migraci

### ✅ Auth Flow

#### Google OAuth Flow:
```
1. User klikne "Pokračovat s Google"
2. Redirect → /api/auth/signin/google
3. Google OAuth consent
4. Callback → /api/auth/callback/google
5. NextAuth vytvoří session (JWT)
6. Account linking (pokud email existuje)
7. Redirect na /dashboard nebo redirectUrl
```

#### Email + Heslo Flow:
```
1. User vyplní email + heslo na /login
2. POST /api/auth/callback/credentials
3. authorize() → findUserByEmail() → compare(password)
4. Pokud OK → NextAuth vytvoří JWT session
5. Redirect na /dashboard
```

#### Account Linking:
- Automatické propojení pokud email existuje
- Implementováno v `signIn` callbacku v [`lib/auth.ts`](lib/auth.ts:49-102)

### ✅ Session Configuration
- **Strategy**: JWT (ne database sessions)
- **Max Age**: 30 dní
- **Custom signIn page**: `/login`
- **Session helper**: `auth()` z NextAuth

### ✅ Database Schema (Auth)
- **Tabulky**: `users`, `accounts`, `sessions`, `magic_tokens`
- **Migrace**: [`lib/database/migrations/003_create_auth_tables.sql`](lib/database/migrations/003_create_auth_tables.sql)
- **Helper funkce**: [`lib/database/auth.ts`](lib/database/auth.ts)
  - `findUserByEmail()`, `createUser()`, `verifyUserEmail()`
  - `findAccountByProvider()`, `linkAccount()`
  - `createMagicToken()`, `verifyMagicToken()`, `consumeMagicToken()`

### ⚠️ Dokumentace
- [`AUTH_IMPLEMENTATION_SUMMARY.md`](AUTH_IMPLEMENTATION_SUMMARY.md)
- [`AUTH_IMPLEMENTATION_GUIDE.md`](AUTH_IMPLEMENTATION_GUIDE.md)
- [`AUTH_SETUP.md`](AUTH_SETUP.md)

---

## 3. Routy (Login/Register/Profile/Dashboard/Questionnaire)

### ✅ Login
- **Route**: `/login`
- **Soubor**: [`app/login/page.tsx`](app/login/page.tsx)
- **Komponenta**: `AuthCard` (dynamicky importovaná)
- **Features**:
  - Google OAuth tlačítko
  - Email input + "Poslat kód" (magic link - neimplementováno)
  - Redirect handling (`callbackUrl`, `redirect`)
  - Back button s history check

### ✅ Register
- **API Route**: `POST /api/auth/register`
- **Soubor**: [`app/api/auth/register/route.ts`](app/api/auth/register/route.ts)
- **Frontend komponenta**: [`components/site/RegisterForm.tsx`](components/site/RegisterForm.tsx)
- **Validace**:
  - Email format
  - Password min 8 znaků
  - Email uniqueness check
- **Flow**: POST → createUser() → hash password → return user

### ❌ Profile
- **Route**: ❌ **NEEXISTUJE**
- Žádná `/profile` nebo `/settings` stránka

### ✅ Dashboard
- **Route**: `/dashboard`
- **Soubor**: [`app/dashboard/page.tsx`](app/dashboard/page.tsx)
- **Protection**: ✅ Server-side auth check
- **Flow**: `auth()` → redirect na `/login` pokud není session
- **Content**: Základní welcome page s email uživatele

### ✅ Questionnaire
- **Route**: `/questionnaire`
- **Soubor**: [`app/questionnaire/page.tsx`](app/questionnaire/page.tsx)
- **Client komponenta**: [`app/questionnaire/QuestionnaireCanonicalClient.tsx`](app/questionnaire/QuestionnaireCanonicalClient.tsx)
- **Context**: [`app/questionnaire/QuestionnaireCanonicalContext.tsx`](app/questionnaire/QuestionnaireCanonicalContext.tsx)
- **Legacy**: 
  - `/questionnaire-v1` - [`app/questionnaire-v1/page.tsx`](app/questionnaire-v1/page.tsx)
  - `/questionnaire-v2` - prázdná složka
- **Results subroute**: `/questionnaire/results` → redirect na `/results`

### ✅ Results
- **Route**: `/results`
- **Soubor**: [`app/results/page.tsx`](app/results/page.tsx)
- **Implementace**: `ResultsPageSplit` (split layout)
- **Alternativy**:
  - [`app/results/ResultsPageEnhanced.tsx`](app/results/ResultsPageEnhanced.tsx)
  - [`app/results/ResultsPageSimple.tsx`](app/results/ResultsPageSimple.tsx)
  - [`app/results/ResultsPageSplit.tsx`](app/results/ResultsPageSplit.tsx)

### ✅ Forgot Password
- **Route**: `/forgot-password`
- **Soubor**: [`app/forgot-password/page.tsx`](app/forgot-password/page.tsx)
- **Status**: ⚠️ Placeholder - "bude brzy k dispozici"

### ✅ Admin
- **Route**: `/admin/consultations`
- **Soubor**: [`app/admin/consultations/page.tsx`](app/admin/consultations/page.tsx)
- **Protection**: Middleware matcher zahrnuje `/admin/:path*`

### ✅ Other Auth Routes
- **API**: `/api/auth/[...nextauth]` - NextAuth handler
- **API**: `/api/auth/register` - Registrace endpoint
- **API**: `/api/auth/send-code` - ⚠️ Složka existuje, ale soubor chybí
- **API**: `/api/auth/verify-code` - ⚠️ Složka existuje, ale soubor chybí
- **Frontend**: `/auth/verify` - ⚠️ Složka existuje, ale `page.tsx` chybí

---

## 4. Protected Routes

### ✅ Middleware Protection
- **Soubor**: [`middleware.ts`](middleware.ts)
- **Matcher**: `/dashboard/:path*`, `/admin/:path*`
- **Status**: ⚠️ Middleware **NEOVĚŘUJE auth** - pouze legacy redirects
- **Poznámka**: Auth check je v page komponentách (`auth()` helper)

### ✅ Page-level Protection
- **Dashboard**: [`app/dashboard/page.tsx`](app/dashboard/page.tsx) - `auth()` check
- **Admin**: Pravděpodobně podobně (neověřeno)

---

## 5. Redirects

### ✅ Next.js Redirects (`next.config.js`)
- `/questionnaire/results` → `/results` (308)
- `/questionnare` → `/questionnaire` (308)
- `/questioonaire/result` → `/results` (308)

### ✅ Middleware Redirects
- `/questioonaire/result` → `/results` (308)

---

## 6. Shrnutí

### ✅ Co funguje:
- Next.js 14 App Router
- Tailwind + shadcn/ui
- NextAuth v5 (Google OAuth + Credentials)
- Login page (`/login`)
- Register API (`/api/auth/register`)
- Dashboard (`/dashboard`) s auth protection
- Questionnaire (`/questionnaire`)
- Results (`/results`)

### ⚠️ Co chybí/nefunguje:
- **Database client není nakonfigurován** (mock placeholder)
- Magic link auth (soubory chybí)
- Profile page (`/profile`)
- Forgot password implementace (jen placeholder)
- `/auth/verify` page (složka existuje, ale `page.tsx` chybí)

### 📝 Poznámky:
- Projekt používá **App Router**, ne Pages Router
- DB je připravená (migrace existují), ale **není připojená**
- Auth je implementovaná, ale **vyžaduje DB setup**
- Magic link flow je připraven v DB, ale **API routes chybí**

