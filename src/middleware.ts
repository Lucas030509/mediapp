import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Return early if no environment variables, for simpler local dev without breaking
  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicRoutes = ['/', '/login', '/registro', '/test', '/api/auth/login', '/api/auth/logout']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith('/_next')
  const isAppRoute = !isPublicRoute

  // === 1. Verificación básica: Auth requerida ===
  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/login?reason=middleware_auth_missing', request.url))
  }


  // === 2. Verificación de Roles Granular (Feature Flag) ===
  if (isAppRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, position')
      .eq('id', user.id)
      .single()

    const moduleMatch = request.nextUrl.pathname.match(/^\/dashboard\/([a-zA-Z0-9_-]+)/)

    if (moduleMatch && profile) {
      const moduleName = moduleMatch[1]

      const { data: hasAccess } = await supabase
        .from('permissions')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('role_or_position', profile.position)
        .eq('module', moduleName)
        .eq('action', 'leer')
        .single()

      if (!hasAccess) {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized_feature', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
