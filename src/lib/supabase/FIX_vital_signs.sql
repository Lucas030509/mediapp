-- FIX: Asegurar que la tabla vital_signs tenga todas las columnas y funciones necesarias
-- Ejecuta esto en el SQL Editor de Supabase si el Triage no guarda los datos.

-- 1. Habilitar extensión de UUIDs (obligatorio para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Asegurar que la tabla exista con la estructura correcta
CREATE TABLE IF NOT EXISTS public.vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    nurse_id UUID,
    blood_pressure TEXT,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,1),
    glucose TEXT,
    nurse_notes TEXT,
    triage_color TEXT DEFAULT 'GREEN',
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Si la tabla ya existía, añadir columnas faltantes por si acaso
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS glucose TEXT;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS nurse_notes TEXT;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS triage_color TEXT DEFAULT 'GREEN';
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS bmi DECIMAL(4,1);
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER;

-- 4. Asegurar permisos (si tienes RLS habilitado, esto permite insertar a usuarios autenticados)
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir inserción a personal autenticado" ON public.vital_signs;
CREATE POLICY "Permitir inserción a personal autenticado" ON public.vital_signs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir lectura a personal autenticado" ON public.vital_signs;
CREATE POLICY "Permitir lectura a personal autenticado" ON public.vital_signs FOR SELECT USING (true);
