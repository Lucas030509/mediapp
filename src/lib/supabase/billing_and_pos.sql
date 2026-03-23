-- ==============================================================================
-- FASE 13: MÓDULO DE CAJA, PAGOS Y CFDI (FACTURACIÓN ELECTRÓNICA MÉXICO)
-- ==============================================================================

-- 1. Tabla Principal de Facturas / Notas de Cargo
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT,                       -- Folio interno (ej. FAC-1001)
    patient_id UUID REFERENCES patients(id),   -- A quién se le cobra
    doctor_id UUID,                            -- Médico que generó el ingreso (opcional)
    subtotal DECIMAL(10,2) DEFAULT 0.00,       
    tax_amount DECIMAL(10,2) DEFAULT 0.00,     -- IVA (Generalmente exento en salud, pero útil)
    total DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'PENDING',             -- PENDING, PAID, CANCELLED, REFUNDED
    currency TEXT DEFAULT 'MXN',
    payment_method TEXT,                       -- EFECTIVO, TARJETA, TRANSFERENCIA, ASEGURADORA
    requires_cfdi BOOLEAN DEFAULT false,       -- ¿El paciente solicitó factura electrónica?
    cfdi_uuid TEXT,                            -- UUID Fiscal devuelto por el PAC
    cfdi_status TEXT,                          -- UNTIMBRED, TIMBRED, CANCELLED
    notes TEXT,                                -- Comentarios internos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Conceptos (Items de la Nota de Cargo)
CREATE TABLE IF NOT EXISTS billing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES billing_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,                 -- Concepto (Ej. Consulta de Valoración, Insumo Médico)
    sat_product_code TEXT,                     -- Clave de Producto SAT (Ej. 85121600 - Servicios Médicos)
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Pagos Parciales (Si Pagan en Abonos o Copagos)
CREATE TABLE IF NOT EXISTS billing_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES billing_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT NOT NULL,
    reference_number TEXT,                     -- Voucher de tarjeta o comprobante SPEI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opcional: Trigger para auto-generar folios
-- Se puede manejar del lado de la API/UI, pero dejar el campo listo.
