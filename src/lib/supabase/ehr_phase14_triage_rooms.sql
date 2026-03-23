-- ==============================================================================
-- FASE 14: ÁREA PRE-CLÍNICA (TRIAGE), SIGNOS VITALES Y CONSULTORIOS
-- ==============================================================================

-- 1. Tabla de Consultorios Físicos (Clínica)
CREATE TABLE IF NOT EXISTS clinic_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                        -- Ej. "Consultorio 1" o "Quirófano A"
    room_type TEXT DEFAULT 'Consultorio',      -- Consultorio, Quirófano, Recuperación, Triage
    status TEXT DEFAULT 'AVAILABLE',           -- AVAILABLE, OCCUPIED, MAINTENANCE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asignación Temporal / Fija de Doctores a Consultorios
CREATE TABLE IF NOT EXISTS doctor_room_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    room_id UUID REFERENCES clinic_rooms(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_status TEXT DEFAULT 'ACTIVE',      -- ACTIVE, FINISHED
    notes TEXT                                 -- Turno Matutino, etc.
);

-- Hacer fácil la consulta directa en la UI añadiendo current_room a los doctores
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS current_room TEXT;

-- 3. Tabla de Signos Vitales extendida (si no existe) y Notas de Enfermería
-- Se asume vital_signs ya existe parcialmente. Añadiremos columnas de Notas Previas.
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    nurse_id UUID,                             -- Quien tomó los signos (opcional)
    blood_pressure TEXT,                       -- Ej: "120/80"
    heart_rate INTEGER,                        -- Lpm
    temperature DECIMAL(4,1),                  -- °C
    respiratory_rate INTEGER,                  -- Rpm
    oxygen_saturation INTEGER,                 -- % (SpO2)
    weight DECIMAL(5,2),                       -- kg
    height DECIMAL(5,2),                       -- cm
    bmi DECIMAL(4,1),                          -- Calculado
    glucose TEXT,                              -- mg/dL
    nurse_notes TEXT,                          -- Observación inicial o motivo de consulta percibido
    triage_color TEXT DEFAULT 'GREEN',         -- Categorización rápida (RED, YELLOW, GREEN)
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar si se require RLS (Opcional)
-- ALTER TABLE vital_signs ADD COLUMN triage_color TEXT DEFAULT 'GREEN';
-- ALTER TABLE vital_signs ADD COLUMN nurse_notes TEXT;
