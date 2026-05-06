import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleAuthUrl } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json({ error: 'Falta el doctorId' }, { status: 400 });
    }

    const authUrl = generateGoogleAuthUrl(doctorId);
    
    // Redirigir al usuario a Google para autorizar la app
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error generando URL de OAuth de Google:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
