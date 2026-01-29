import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { createUser, findUserByEmail } from "@/lib/database/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const name = typeof body?.name === "string" ? body.name.trim() || null : null

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail a heslo jsou povinné." },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Zadejte platnou e-mailovou adresu." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Heslo musí mít alespoň 8 znaků." },
        { status: 400 }
      )
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json(
        { error: "Uživatel s tímto e-mailem již existuje." },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 10)

    const user = await createUser({
      email,
      name,
      passwordHash,
      emailVerifiedAt: null,
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error in /api/auth/register:", error)
    return NextResponse.json(
      { error: "Došlo k chybě při registraci. Zkuste to prosím znovu." },
      { status: 500 }
    )
  }
}


