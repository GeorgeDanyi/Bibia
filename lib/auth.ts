import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { findUserByEmail, createUser, findAccountByProvider, linkAccount } from "@/lib/database/auth"

const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email a heslo",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email ? String(credentials.email).toLowerCase() : ""
        const password = credentials?.password ? String(credentials.password) : ""

        if (!email || !password) {
          return null
        }

        const user = await findUserByEmail(email)
        if (!user || !user.passwordHash) {
          return null
        }

        // Dynamically import bcryptjs to avoid loading it in Edge runtime
        const { compare } = await import("bcryptjs")
        const isValid = await compare(password, user.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) {
        return false
      }

      if (account.provider === "google" || account.provider === "apple") {
        const existingUser = await findUserByEmail(user.email)

        if (existingUser) {
          const existingAccount = await findAccountByProvider(
            account.provider,
            account.providerAccountId
          )

          if (!existingAccount) {
            await linkAccount({
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token || null,
              refreshToken: account.refresh_token || null,
              expiresAt: account.expires_at || null,
              tokenType: account.token_type || null,
              scope: account.scope || null,
              idToken: account.id_token || null,
            })
          }

          user.id = existingUser.id
        } else {
          const newUser = await createUser({
            email: user.email,
            name: user.name || null,
            image: user.image || null,
            emailVerifiedAt: new Date(),
            role: 'patient', // Default role for OAuth users
          })

          await linkAccount({
            userId: newUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token || null,
            refreshToken: account.refresh_token || null,
            expiresAt: account.expires_at || null,
            tokenType: account.token_type || null,
            scope: account.scope || null,
            idToken: account.id_token || null,
          })

          user.id = newUser.id
        }
      }

      return true
    },
    async session({ session, token }) {
      // Always set user.id from token.sub if available
      if (session.user && token.sub) {
        ;(session.user as any).id = token.sub
      }
      // Always set user.role from token.role (fallback to 'patient')
      ;(session.user as any).role = (token.role as string) || 'patient'
      return session
    },
    async jwt({ token, user }) {
      // Get email from user (on login) or from token (on subsequent calls)
      const email = user?.email || (token.email as string) || ''
      const emailLower = email.toLowerCase()
      
      // Load admin emails from env (split, trim, lowercase, filter empty)
      const adminEmails = process.env.ADMIN_EMAILS
        ? process.env.ADMIN_EMAILS.split(',')
            .map(e => e.trim().toLowerCase())
            .filter(e => e.length > 0)
        : []
      
      // Admin from ADMIN_EMAILS always has role='admin' (overrides DB)
      if (adminEmails.includes(emailLower)) {
        ;(token as any).role = 'admin'
        return token
      }
      
      // Otherwise, read role from DB
      if (email) {
        try {
          const { findUserByEmail } = await import('@/lib/database/auth')
          const dbUser = await findUserByEmail(email)
          if (dbUser) {
            ;(token as any).role = dbUser.role || 'patient'
            return token
          }
        } catch (error) {
          console.error('Error fetching user role from DB:', error)
        }
      }
      
      // Fallback to 'patient' if user not found or error
      ;(token as any).role = 'patient'
      
      return token
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
} satisfies NextAuthConfig

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authConfig)


