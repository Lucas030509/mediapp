import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase con Service Role Key para poder leer/escribir tokens de doctores sin restricción RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getOAuth2Client = () => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const REDIRECT_URI = `${SITE_URL}/api/integrations/google/callback`;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Client ID o Secret no están configurados en las variables de entorno (.env).');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
};

export const generateGoogleAuthUrl = (doctorId: string) => {
  const oauth2Client = getOAuth2Client();
  
  // Scope para leer y escribir en Google Calendar
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Para recibir el refresh token
    prompt: 'consent', // Forzar consentimiento para asegurar refresh token
    scope: scopes,
    state: doctorId // Pasamos el ID del doctor para saber a quién asignarle el token
  });

  return url;
};

export const saveGoogleAuthTokens = async (code: string, doctorId: string) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  // Guardar tokens en Supabase
  const { error } = await supabaseAdmin
    .from('doctors')
    .update({ 
      google_auth_json: tokens,
      is_google_connected: true
    })
    .eq('id', doctorId);

  if (error) throw error;
  
  return tokens;
};

export const createCalendarEvent = async (doctorId: string, eventDetails: { summary: string, description?: string, start: Date, end: Date }) => {
  // 1. Recuperar los tokens del doctor
  const { data: doctor, error: docError } = await supabaseAdmin
    .from('doctors')
    .select('google_auth_json, is_google_connected')
    .eq('id', doctorId)
    .single();

  if (docError || !doctor || !doctor.is_google_connected || !doctor.google_auth_json) {
    throw new Error('El médico no ha conectado su cuenta de Google Calendar.');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(doctor.google_auth_json);

  // Interceptar la renovación del token para guardarla en Supabase
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
       // Guardar el nuevo refresh_token junto al anterior
       const newAuthJson = { ...doctor.google_auth_json, ...tokens };
       await supabaseAdmin.from('doctors').update({ google_auth_json: newAuthJson }).eq('id', doctorId);
    }
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // 2. Crear el evento
  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.start.toISOString(),
      timeZone: 'UTC', 
    },
    end: {
      dateTime: eventDetails.end.toISOString(),
      timeZone: 'UTC',
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creando evento en Google Calendar:', error.message);
    throw error;
  }
};
