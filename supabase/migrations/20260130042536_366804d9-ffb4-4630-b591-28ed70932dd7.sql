-- Create storage bucket for profile covers if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public SELECT on covers bucket
CREATE POLICY "Cover images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- Allow authenticated users to upload their own cover
CREATE POLICY "Users can upload their own cover"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own cover
CREATE POLICY "Users can update their own cover"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own cover
CREATE POLICY "Users can delete their own cover"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);