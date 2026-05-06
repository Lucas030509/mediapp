-- Agregar columnas de redes sociales a la tabla de médicos
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;
