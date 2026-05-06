-- Añadir columnas para almacenar los tokens de Google Calendar de los médicos
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS google_auth_json JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_google_connected BOOLEAN DEFAULT false;

-- Comentario informativo
COMMENT ON COLUMN public.doctors.google_auth_json IS 'Almacena de forma segura los tokens de acceso y refresco de Google OAuth2 para la integración del calendario';
