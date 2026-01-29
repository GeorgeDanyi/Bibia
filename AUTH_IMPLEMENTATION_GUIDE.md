# Implementace Autentizace - Next.js SaaS BIBIA

## 1. Cookie Session vs JWT - Doporučení

**Doporučení: Cookie Session (NextAuth.js / Auth.js)**

**Proč:**
- ✅ **Bezpečnost**: HttpOnly cookies nelze přečíst z JavaScriptu (XSS protection)
- ✅ **Next.js integrace**: Perfektní podpora v App Router
- ✅ **CSRF protection**: Built-in ochrana
- ✅ **Automatické refresh**: NextAuth řeší refresh tokeny
- ✅ **UX**: Uživatel zůstane přihlášený i po refreshi stránky
- ✅ **SSR friendly**: Session dostupná v Server Components

**JWT bych použil jen pokud:**
- Potřebuješ stateless API pro mobilní app
- Máš mikroservisní architekturu

**Pro SaaS na fyzioterapeuty → Cookie Session je jasná volba.**

---

## 2. Auth Flow pro 3 metody

### A) Google OAuth
```
1. User klikne "Pokračovat s Google"
2. Redirect na /api/auth/signin/google
3. Google OAuth consent screen
4. Google callback → /api/auth/callback/google
5. NextAuth vytvoří session → cookie
6. Redirect na /dashboard nebo redirectUrl
```

### B) Apple OAuth
```
1. User klikne "Pokračovat s Apple"
2. Redirect na /api/auth/signin/apple
3. Apple Sign In screen
4. Apple callback → /api/auth/callback/apple
5. NextAuth vytvoří session → cookie
6. Redirect na /dashboard nebo redirectUrl
```

### C) Email + Heslo
```
1. User vyplní email + heslo
2. POST /api/auth/callback/credentials
3. Hash hesla (bcrypt) → porovnání s DB
4. Pokud OK → NextAuth vytvoří session
5. Pokud NE → error message
```

### D) Email + Magic Link (volitelné)
```
1. User zadá email
2. POST /api/auth/send-magic-link
3. Generuj token (6 číslic, expirace 10 min)
4. Ulož do DB (magic_tokens table)
5. Pošli email s linkem /auth/verify?token=123456
6. GET /api/auth/verify-magic-link?token=123456
7. Validuj token → vytvoř session
```

---

## 3. Account Linking (Email → Google)

**Scénář:** User má účet s email+heslo, pak použije Google se stejným emailem.

**Řešení:**

```typescript
// V NextAuth callbacks
callbacks: {
  async signIn({ user, account, profile }) {
    if (account.provider === 'google') {
      // 1. Zkontroluj, jestli email už existuje v DB
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [user.email]
      )
      
      if (existingUser.rows.length > 0) {
        const existing = existingUser.rows[0]
        
        // 2. Zkontroluj, jestli už má Google account linked
        const hasGoogle = await db.query(
          'SELECT * FROM accounts WHERE user_id = $1 AND provider = $2',
          [existing.id, 'google']
        )
        
        if (hasGoogle.rows.length === 0) {
          // 3. Link Google account k existujícímu účtu
          await db.query(
            'INSERT INTO accounts (user_id, provider, provider_account_id) VALUES ($1, $2, $3)',
            [existing.id, 'google', account.providerAccountId]
          )
        }
        
        // 4. Použij existující user ID
        user.id = existing.id
      }
    }
    
    return true
  }
}
```

**UX Flow:**
- Pokud email existuje → automaticky link (bez otázky)
- Pokud chceš být opatrnější → zobraz dialog: "Účet s tímto emailem už existuje. Chcete propojit Google účet?"

---

## 4. Routy a Endpointy pro MVP

### Frontend Routes
```
/login              → AuthCard s login tab
/register           → AuthCard s register tab (nebo redirect na /login?tab=register)
/auth/verify        → Verifikace magic linku
/dashboard          → Protected route (vyžaduje session)
```

### API Routes (NextAuth.js)
```
/api/auth/signin                    → Sign in page (NextAuth default)
/api/auth/signout                   → Sign out
/api/auth/callback/google           → Google OAuth callback
/api/auth/callback/apple            → Apple OAuth callback
/api/auth/callback/credentials      → Email+password login
/api/auth/session                   → Get current session (GET)
```

### Custom API Routes
```
POST /api/auth/send-magic-link      → Odeslat magic link email
GET  /api/auth/verify-magic-link     → Ověřit magic link token
POST /api/auth/register              → Registrace email+heslo
POST /api/auth/forgot-password       → Reset hesla
POST /api/auth/reset-password        → Nastavit nové heslo
```

---

## 5. TODO - Implementace krok za krokem

### Krok 1: Instalace závislostí
```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

**Nebo pokud nemáš Prisma:**
```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

### Krok 2: Database Schema

Vytvoř migraci `003_create_auth_tables.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  name VARCHAR(255),
  image TEXT,
  password_hash TEXT, -- NULL pro OAuth users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (pro OAuth linking)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'apple', 'credentials'
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Sessions table (NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Magic tokens (pro magic link)
CREATE TABLE IF NOT EXISTS magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(10) NOT NULL, -- 6 číslic
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_magic_tokens_email ON magic_tokens(email);
CREATE INDEX idx_magic_tokens_token ON magic_tokens(token) WHERE used = FALSE;
```

### Krok 3: NextAuth konfigurace

Vytvoř `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/database" // tvůj DB client

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Najdi user v DB
        const user = await db.query(
          'SELECT * FROM users WHERE email = $1',
          [credentials.email]
        )

        if (user.rows.length === 0) {
          return null
        }

        const dbUser = user.rows[0]

        // Ověř heslo
        const isValid = await compare(credentials.password, dbUser.password_hash)
        if (!isValid) {
          return null
        }

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Account linking logika (viz sekce 3)
      if (account?.provider === 'google' || account?.provider === 'apple') {
        const existingUser = await db.query(
          'SELECT * FROM users WHERE email = $1',
          [user.email]
        )

        if (existingUser.rows.length > 0) {
          // Link account
          await db.query(
            'INSERT INTO accounts (user_id, provider, provider_account_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [existingUser.rows[0].id, account.provider, account.providerAccountId]
          )
          user.id = existingUser.rows[0].id
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt', // nebo 'database' pokud chceš použít sessions table
  },
})

export { handler as GET, handler as POST }
```

### Krok 4: Environment Variables

Přidej do `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generuj-nahodny-secret-key-min-32-znaku

GOOGLE_CLIENT_ID=tvoje-google-client-id
GOOGLE_CLIENT_SECRET=tvoje-google-client-secret

APPLE_CLIENT_ID=tvoje-apple-client-id
APPLE_CLIENT_SECRET=tvoje-apple-client-secret
```

**Generování NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Krok 5: Session Provider (Root Layout)

Uprav `app/layout.tsx`:

```typescript
import { SessionProvider } from "next-auth/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Krok 6: Middleware pro Protected Routes

Vytvoř `middleware.ts` v root:

```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'] // protected routes
}
```

### Krok 7: Aktualizace LoginForm

Uprav `components/site/LoginForm.tsx`:

```typescript
import { signIn } from "next-auth/react"

const handleSocialLogin = async (provider: "google" | "apple") => {
  await signIn(provider, { callbackUrl: redirectUrl || '/dashboard' })
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // ... validace ...
  
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })
  
  if (result?.error) {
    setErrors({ general: "Neplatné přihlašovací údaje" })
  } else {
    onSuccess?.()
    router.push(redirectUrl || '/dashboard')
  }
}
```

### Krok 8: Registrace Endpoint

Vytvoř `app/api/auth/register/route.ts`:

```typescript
import { hash } from "bcryptjs"
import { db } from "@/lib/database"
import { registerSchema } from "@/lib/validation/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const validated = registerSchema.parse(body)
  
  // Zkontroluj, jestli email už existuje
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [validated.email]
  )
  
  if (existing.rows.length > 0) {
    return Response.json(
      { error: "Email už je registrován" },
      { status: 400 }
    )
  }
  
  // Hash hesla
  const passwordHash = await hash(validated.password, 12)
  
  // Vytvoř user
  const result = await db.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email',
    [validated.email, passwordHash, validated.name || null]
  )
  
  return Response.json({ 
    user: result.rows[0],
    message: "Účet vytvořen" 
  })
}
```

### Krok 9: Magic Link (volitelné)

Vytvoř `app/api/auth/send-magic-link/route.ts`:

```typescript
import { db } from "@/lib/database"
import { sendEmail } from "@/lib/email" // implementuj email service

export async function POST(request: Request) {
  const { email } = await request.json()
  
  // Generuj 6-místný token
  const token = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minut
  
  // Ulož do DB
  await db.query(
    'INSERT INTO magic_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
    [email, token, expiresAt]
  )
  
  // Pošli email
  await sendEmail({
    to: email,
    subject: 'Přihlášení do BIBIA',
    html: `
      <p>Váš přihlašovací kód: <strong>${token}</strong></p>
      <p>Kód platí 10 minut.</p>
      <p>Nebo klikněte: <a href="${process.env.NEXTAUTH_URL}/auth/verify?token=${token}">Přihlásit se</a></p>
    `
  })
  
  return Response.json({ message: "Email odeslán" })
}
```

### Krok 10: OAuth Setup (Google & Apple)

**Google:**
1. Jdi na https://console.cloud.google.com
2. Vytvoř projekt → APIs & Services → Credentials
3. OAuth 2.0 Client ID
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**Apple:**
1. Jdi na https://developer.apple.com
2. Certificates, Identifiers & Profiles
3. Services ID → Configure Sign in with Apple
4. Return URL: `http://localhost:3000/api/auth/callback/apple`

---

## 6. Testování

```bash
# 1. Spusť dev server
npm run dev

# 2. Otestuj registraci
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.cz","password":"Test123!"}'

# 3. Otestuj login
# Otevři /login v prohlížeči a zkus přihlásit
```

---

## 7. Produkční Checklist

- [ ] Změň NEXTAUTH_URL na produkční URL
- [ ] Nastav HTTPS (NextAuth vyžaduje HTTPS v produkci)
- [ ] Přidej rate limiting na /api/auth/register
- [ ] Nastav email service (Resend, SendGrid, atd.)
- [ ] Přidej logging pro failed login attempts
- [ ] Nastav CORS pokud máš frontend na jiné doméně
- [ ] Ověř, že session expirace je rozumná (default 30 dní)

---

## Shrnutí

**Stack:**
- NextAuth.js (Auth.js) pro OAuth + session management
- PostgreSQL pro users/accounts/sessions
- bcryptjs pro hashování hesel
- Cookie-based sessions (HttpOnly, Secure)

**Flow:**
1. User klikne na auth metodu
2. NextAuth zpracuje OAuth nebo credentials
3. Session se uloží do cookie
4. Middleware chrání protected routes
5. Account linking řeší duplicitní emaily

**Časová náročnost:** 4-6 hodin pro základní implementaci

