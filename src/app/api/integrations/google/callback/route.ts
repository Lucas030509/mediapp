import { NextRequest, NextResponse } from 'next/server';
import { saveGoogleAuthTokens } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const doctorId = searchParams.get('state'); // Pasamos el doctorId a través del parámetro 'state'

    if (!code || !doctorId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (code o state)' }, { status: 400 });
    }

    // Intercambiar el código por tokens y guardar en base de datos
    await saveGoogleAuthTokens(code, doctorId);

    // Redirigir al usuario de vuelta al panel con un mensaje de éxito
    // Asumimos que podemos redirigirlo al perfil del doctor o a una página genérica de éxito
    const successUrl = new URL('/dashboard/doctores?google_connected=true', request.url);
    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error('Error en el callback de Google OAuth:', error);
    const errorUrl = new URL(`/dashboard/doctores?google_error=${encodeURIComponent(error.message)}`, request.url);
    return NextResponse.redirect(errorUrl);
  }
}
