import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId } = body

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const cookieStore = await cookies()

        // Usamos Service Role para poder borrar usuarios de Auth
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

        // Borrar el usuario de Auth. 
        // Nota: Debido al CASCADE configurado en la tabla profiles, 
        // borrarlo de Auth automáticamente borrará su fila en profiles.
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            console.error('Delete Auth Error:', error)
            return NextResponse.json({ error: `Error al eliminar de Auth: ${error.message}` }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Server Delete Error:', err)
        return NextResponse.json({ error: 'Ocurrió un error inesperado al eliminar' }, { status: 500 })
    }
}
