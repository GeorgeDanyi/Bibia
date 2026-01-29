"use client"

import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-seafoam-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-seafoam-100 p-8 space-y-4">
        <h1 className="text-2xl font-bold text-seafoam-900">
          Zapomenuté heslo
        </h1>
        <p className="text-sm text-seafoam-700">
          Obnova hesla bude brzy k dispozici. Zatím nás prosím kontaktujte,
          pokud potřebujete přístup k účtu.
        </p>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-seafoam-600 hover:text-seafoam-800 underline-offset-4 hover:underline"
        >
          Zpět na hlavní stránku
        </Link>
      </div>
    </div>
  )
}


