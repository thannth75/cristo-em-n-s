-- Create storage bucket for community posts images
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for uploading post images
CREATE POLICY "Approved users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' 
  AND public.is_user_approved(auth.uid())
);

-- Create policy for viewing post images (public)
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Create policy for deleting own post images
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);