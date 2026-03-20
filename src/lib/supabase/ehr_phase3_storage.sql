-- FASE 3: Motor de Archivos e Imagenología Visual (Storage)
-- Basado en los requerimientos del sistema clínico ARMED (Radiografías, Fotos Clínicas, Docs)

-- 1. Insertar el nuevo cubo de almacenamiento (Bucket) llamado 'clinical_documents'
-- Usamos "DO NOTHING" por si ya lo habías creado previamente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'clinical_documents', 
  'clinical_documents', 
  true, -- En ARMED el acceso puede ser restringido, pero configuramos true para facilidad de lectura en web, con RLS de subida.
  10485760, -- Límite de 10MB por archivo aprox
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear tabla auxiliar para registrar metadatos de los estudios
-- Esta tabla nos permite tener el concepto de "Pre/Post" o Favorito (Destacado)
CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL, -- La ruta dentro del bucket clinical_documents
    file_name TEXT NOT NULL, -- El nombre original (ej. "Radiografia_rodilla.jpg")
    file_type TEXT,          -- El mimeType (ej. "image/jpeg", "application/pdf")
    is_favorite BOOLEAN DEFAULT false, -- La funcionalidad de ARMED para destacar "Top 1" 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en la tabla de documentos
-- ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Doctores ven documentos" ON public.patient_documents FOR ALL USING (true); -- Ajusta (true) según tu auth

-- 3. Crear políticas de seguridad (RLS) para el Storage Bucket
-- NOTA: Supabase a veces requiere que estas políticas se creen directamente desde la UI
-- o como Supabase superuser. Si en dev falla, puedes hacer el bucket "public".
CREATE POLICY "Permitir subida de estudios" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK ( bucket_id = 'clinical_documents' );

CREATE POLICY "Permitir lectura de estudios" 
ON storage.objects FOR SELECT 
TO public
USING ( bucket_id = 'clinical_documents' );

CREATE POLICY "Permitir borrar estudios"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'clinical_documents' );
