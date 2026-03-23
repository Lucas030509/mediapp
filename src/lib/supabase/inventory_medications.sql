-- ==============================================================================
-- FASE 12: MÓDULO DE INVENTARIO Y FARMACIA (CONTROL DE MEDICAMENTOS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS inventory_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                   -- Nombre comercial (Ej. Aspirina Protect)
    generic_name TEXT,                    -- Nombre genérico (Ej. Ácido Acetilsalicílico)
    presentation TEXT,                    -- Presentación (Ej. Caja con 28 Tabletas de 100mg)
    category TEXT,                        -- Categoría (Ej. Analgésico, Antibiótico, Insumo Médico)
    stock_quantity INTEGER DEFAULT 0,     -- Cantidad actual en inventario físico
    minimum_stock INTEGER DEFAULT 5,      -- Nivel de reabastecimiento (Alerta)
    purchase_price DECIMAL(10,2),         -- Costo de compra
    sale_price DECIMAL(10,2),             -- Precio de venta al público (Opcional)
    batch_number TEXT,                    -- Número de Lote
    expiration_date DATE,                 -- Fecha de Caducidad
    location TEXT,                        -- Ubicación física (Ej. Estante A2, Vitrina 1)
    status TEXT DEFAULT 'ACTIVE',         -- ACTIVE, DISCONTINUED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Opcional pero recomendado para producción)
-- ALTER TABLE inventory_medications ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir todo temporalmente" ON inventory_medications FOR ALL USING (true);
