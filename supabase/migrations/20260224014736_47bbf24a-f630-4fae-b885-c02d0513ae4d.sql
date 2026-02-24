
-- Create storage bucket for chat media (images in messages)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view chat media (public bucket)
CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Users can delete their own chat media
CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
