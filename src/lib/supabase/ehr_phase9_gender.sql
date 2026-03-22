-- FASE 9: Género de Paciente
-- Añade el campo de género al paciente

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT;
