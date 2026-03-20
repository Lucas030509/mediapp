-- FASE 6: Historial Quirúrgico (EHR Core Módulo 6)
-- Con esta tabla podrás registrar, consultar y auditar los procedimientos pasados de un paciente.

CREATE TABLE IF NOT EXISTS patient_surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    procedure_name VARCHAR(255) NOT NULL,
    surgery_date DATE NOT NULL,
    surgeon_name VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Opcional, para producción)
ALTER TABLE patient_surgeries ENABLE ROW LEVEL SECURITY;

-- Políticas de prueba (Permitir todo temporalmente)
CREATE POLICY "Enable all for surgeries dev phase" ON patient_surgeries FOR ALL USING (true) WITH CHECK (true);

-- Informar éxito
SELECT 'Módulo de Historial Quirúrgico instalado correctamente. Ya puedes acceder desde la pestaña de Cirugías en el EHR.' as status;
