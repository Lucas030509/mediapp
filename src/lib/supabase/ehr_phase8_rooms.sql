-- FASE 8: Consultorios (Rooms) y Especialidades

-- 1. Aseguramos la existencia de la tabla rooms
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialty TEXT, -- Especialidad del consultorio
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existe, le agregamos la columna specialty por si acaso
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS specialty TEXT;

-- 2. Almacenamos el consultorio base para cada doctor
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS default_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;

-- (Opcional) Activar RLS en rooms si no lo tiene
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms viewable by authenticated" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rooms modifiable by authenticated" ON public.rooms FOR ALL TO authenticated USING (true);
