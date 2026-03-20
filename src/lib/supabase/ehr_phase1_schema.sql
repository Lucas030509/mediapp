-- FASE 1: Esquema de Base de Datos para EHR (Expediente Clínico Electrónico)
-- Basado en los requerimientos del sistema ARMED adaptado a la tabla "patients" existente.

-- Habilitar pg_trgm para búsqueda inteligente de pacientes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Modificar tabla de Pacientes existente (patients) integrando requerimientos ARMED
-- Tu tabla "patients" actual tiene: first_name, last_name, second_last_name, rfc, email, phone, date_of_birth, blood_type, main_condition, status.
ALTER TABLE public.patients 
    ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F', 'O')),
    ADD COLUMN IF NOT EXISTS alias_treatment TEXT; -- ej. "Ingeniero Telcel", "Trato Doctor San"

-- Crear un índice TRIGRÁMICO para busqueda difusa rápida (CONTIENE / ILIKE '%algo%') en la tabla existente.
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm 
ON public.patients USING GIN 
( (first_name || ' ' || last_name || ' ' || COALESCE(second_last_name, '')) gin_trgm_ops );

-- 2. Tabla Datos Fiscales (patient_billing) separada 1-a-1
-- Recomendación: Aunque "rfc" vive en patients, mover la facturación a su tabla propia escala mejor con "business_name" y domicilios.
CREATE TABLE IF NOT EXISTS public.patient_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    tax_id TEXT, -- RFC, si el facturador es distinto al paciente
    business_name TEXT, -- Razón social a la que se va a facturar (Ej. Marido, Empresa)
    postal_code TEXT,
    tax_regime TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- 3. Tabla Alergias y Alertas Clínicas
CREATE TABLE IF NOT EXISTS public.patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    allergen_name TEXT NOT NULL, -- Ej. Penicilina, Ciprofloxacino
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Motor de Plantillas Médicas (ehr_templates)
CREATE TABLE IF NOT EXISTS public.ehr_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID, -- Opcional: Puede referenciar a auth.users o doctors
    template_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('NOTA_EVOLUCION', 'RECETA', 'PLAN_QUIRURGICO', 'NOTA_QUIRURGICA', 'OTRO')),
    html_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Notas Clínicas y de Evolución (Episodios Clínicos)
CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID,
    consultation_date TIMESTAMPTZ NOT NULL, -- Editable por si se ingresa la nota días después
    subjective_text TEXT,
    objective_text TEXT,
    analysis_text TEXT,
    plan_text TEXT,
    diagnoses TEXT[], -- Array de CIE-10 (ej. ['I10', 'E11'])
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Inmutable por auditoría
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
