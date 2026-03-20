import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, first_name, last_name, role, organization_name } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const cookieStore = await cookies()

        // Creamos cliente con Service Role para poder crear usuarios sin confirmación de email inmediata 
        // y para saltar políticas de registro público.
        // NOTA: Debes agregar SUPABASE_SERVICE_ROLE_KEY a tu .env.local
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

        // 1. Crear el usuario en Auth (Solo funciona si SUPABASE_SERVICE_ROLE_KEY está presente y es correcta)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                organization_name,
                role
            }
        })

        if (authError) {
            console.error('Auth Error:', authError)
            return NextResponse.json({ error: `Error en Auth: ${authError.message}` }, { status: 500 })
        }

        // El trigger SQL 'on_auth_user_created' se encargará de insertar en 'profiles'
        // pero por si acaso o si no se ha corrido el SQL, podríamos hacerlo aquí manualmente.
        
        return NextResponse.json({ success: true, user: authData.user })

    } catch (err: any) {
        console.error('Server Error:', err)
        return NextResponse.json({ error: 'Ocurrió un error inesperado en el servidor' }, { status: 500 })
    }
}
