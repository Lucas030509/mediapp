-- Add photo_url column to patients table for storing webcam snapshots
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
