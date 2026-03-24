-- ==============================================================================
-- FASE 15: CONTROL DE ACCESO BASADO EN ROLES (RBAC) Y PERMISOS DE MÓDULOS
-- ==============================================================================

-- 1. Tabla de Roles Dinámicos (Permite al ADMIN crear perfiles como "Médico de Guardia", "Cajero", etc)
CREATE TABLE IF NOT EXISTS clinic_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,                        -- Ej. "Enfermera Jefe", "Recepcionista Noche"
    description TEXT,                                 -- Breve descripción del rol
    active_modules TEXT[] DEFAULT '{}',               -- Array de paths o llaves: ['CRM_PACIENTES', 'AGENDA', 'FACTURACION', 'ENFERMERIA']
    is_system_admin BOOLEAN DEFAULT FALSE,            -- Si es true, tiene acceso a todo irrestricto (Superadmin)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles por defecto para que la clínica no inicie vacía
INSERT INTO clinic_roles (name, description, active_modules, is_system_admin)
VALUES 
    ('Administrador General', 'Acceso total y configuración del ERP', '{}', TRUE),
    ('Médico Tratante', 'Acceso a Agenda, Expedientes, y Recetas', '{"PACIENTES", "AGENDA"}', FALSE),
    ('Enfermería & Triage', 'Acceso a Somatometría, Consultorios y pre-consulta', '{"ENFERMERIA", "PACIENTES"}', FALSE),
    ('Cobranza y Caja', 'Acceso al módulo financiero, TPV y SAT CFDI', '{"FACTURACION", "PACIENTES"}', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 2. Vincular el perfil de usuario (auth.users) al Rol Dinámico
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rb_role_id UUID REFERENCES clinic_roles(id) ON DELETE SET NULL;


-- ==============================================================================
-- 3. SEGURIDAD DE FILA RLS (ROW LEVEL SECURITY) - Políticas Base
-- ==============================================================================
-- Esto asegura que, en el backend, un usuario solo vea pacientes si tiene un rol asignado.
-- NOTA: Por ahora es permisivo (authenticated) pero puedes restringirlo validando el rb_role_id.

-- Ejemplo de política estricta (Descomentar para producción si deseas blindaje a nivel Base de Datos):
--
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Pacientes viewable by medical staff" ON patients;
-- CREATE POLICY "Pacientes viewable by medical staff" 
-- ON patients FOR SELECT USING (
--     EXISTS (
--         SELECT 1 FROM profiles p 
--         JOIN clinic_roles r ON p.rb_role_id = r.id 
--         WHERE p.id = auth.uid() 
--         AND ('PACIENTES' = ANY(r.active_modules) OR r.is_system_admin = TRUE)
--     )
-- );
--
-- (Hacer lo mismo con Notas Clínicas, Facturas, etc).
