-- ==============================================================================
-- FASE 7: MÓDULOS FALTANTES DEL CORE ARMED (DIRECTORIOS Y CAMPOS CLAVE)
-- ==============================================================================

-- 1. Actualización de la Tabla Pacientes
ALTER TABLE patients ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinical_summary TEXT;

-- 2. Directorio de Enfermeras (Personal Quirúrgico y Asistencia)
CREATE TABLE IF NOT EXISTS nurses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    license_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Directorio de Hospitales / Quirófanos
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    contact_person TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Directorio de Aseguradoras
CREATE TABLE IF NOT EXISTS insurance_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_phone TEXT,
    portal_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Directorio de Farmacias y Laboratorios Aliados
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    type TEXT DEFAULT 'Farmacia', -- Puede ser 'Laboratorio'
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refrescar la caché interna de Supabase
NOTIFY pgrst, 'reload schema';
