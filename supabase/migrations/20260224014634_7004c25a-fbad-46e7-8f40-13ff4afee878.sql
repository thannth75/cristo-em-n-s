
-- Add image_url and media support to private_messages
ALTER TABLE public.private_messages 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';

-- Add comment to clarify message_type values: 'text', 'image', 'gif', 'sticker'
COMMENT ON COLUMN public.private_messages.message_type IS 'Type of message: text, image, gif, sticker';
