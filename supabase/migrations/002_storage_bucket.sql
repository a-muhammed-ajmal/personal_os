-- Migration 002: Storage bucket for task attachments
-- Run this in the Supabase SQL editor

-- Create storage bucket for task file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to attachments bucket
CREATE POLICY "Auth users can upload attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

-- Allow public read access to attachments
CREATE POLICY "Public read attachments" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'attachments');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Auth users can delete attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments');
