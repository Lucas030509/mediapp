import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const email = String(formData.get('email'))
        const password = String(formData.get('password'))

        // Extra metadata para construir el Tenant / Perfil desde la Base de Datos
        const firstName = String(formData.get('firstName'))
        const lastName = String(formData.get('lastName'))
        const orgName = String(formData.get('orgName'))

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
                        } catch (error) { }
                    },
                },
            }
        )

        // 1. Registra al usuario en Auth de Supabase y empaqueta la metadata
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    organization_name: orgName,
                }
            }
        })

        if (error) {
            console.error("Error en registro:", error)
            return NextResponse.redirect(new URL('/registro?error=creation_failed', request.url))
        }

        // Nota: Por diseño, en una Arq. Supabase Multi-Tenant, debes crear un Trigger SQL 
        // en `auth.users` que intercepte 'organization_name' del raw_user_meta_data 
        // y cree la fila en la tabla `organizations` y `profiles` como db_super_admin 
        // para evitar problemas de RLS.

        return NextResponse.redirect(new URL('/dashboard?success=registro_complets', request.url))
    } catch (err: any) {
        return NextResponse.redirect(new URL('/registro?error=unknown', request.url))
    }
}
