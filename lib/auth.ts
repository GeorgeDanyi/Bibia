import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { compare } from "bcryptjs"
import { findUserByEmail, createUser, findAccountByProvider, linkAccount } from "@/lib/database/auth"
import "@/lib/database/auth-init"

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
      if (session.user && token.sub) {
        ;(session.user as any).id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).sub = user.id
      }
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


