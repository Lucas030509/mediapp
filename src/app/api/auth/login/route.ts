import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const email = String(formData.get('email'))
        const password = String(formData.get('password'))

        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                        } catch (error) {
                            // Next.js runtime maneja este error pero en Server Actions o Route Handlers lo devoramos si está seteando tarde.
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error("Login attempt failed:", error)
            return NextResponse.redirect(new URL('/login?error=true', request.url), 303)
        }

        // Éxito: envia al Core de la Aplicación
        return NextResponse.redirect(new URL('/dashboard', request.url), 303)
    } catch (err: any) {
        return NextResponse.redirect(new URL('/login?error=unknown', request.url), 303)
    }
}
