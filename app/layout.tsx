// app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import NavbarBubble from "@/components/navbar"
import { Footer } from "@/components/footer"
import ConditionalNavbar from "@/components/ConditionalNavbar"
import ConditionalFooter from "@/components/ConditionalFooter"
import { SessionProvider } from "@/components/providers/SessionProvider"

export const metadata: Metadata = {
  title: "BIBIA",
  description: "Najdi si fyzioterapeuta za pár minut",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionProvider>
          <ConditionalNavbar />
          <main className="min-h-screen">
            {children}
          </main>
          <ConditionalFooter />
        </SessionProvider>
      </body>
    </html>
  )
}