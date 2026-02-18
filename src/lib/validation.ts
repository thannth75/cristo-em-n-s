import { z } from 'zod';

// Common validation limits
const LIMITS = {
  TITLE: 200,
  CONTENT: 5000,
  DESCRIPTION: 2000,
  SHORT_TEXT: 100,
  MESSAGE: 1000,
  LOCATION: 200,
  URL: 500,
} as const;

// Feature-specific schemas
export const prayerRequestSchema = z.object({
  title: z.string().trim().min(1, { message: "Título obrigatório" }).max(LIMITS.TITLE, { message: `Máximo ${LIMITS.TITLE} caracteres` }),
  content: z.string().trim().min(1, { message: "Conteúdo obrigatório" }).max(LIMITS.CONTENT, { message: `Máximo ${LIMITS.CONTENT} caracteres` }),
  is_private: z.boolean(),
});

export const communityPostSchema = z.object({
  content: z.string().trim().min(1, { message: "Conteúdo obrigatório" }).max(LIMITS.CONTENT, { message: `Máximo ${LIMITS.CONTENT} caracteres` }),
});

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, { message: "Mensagem obrigatória" }).max(LIMITS.MESSAGE, { message: `Máximo ${LIMITS.MESSAGE} caracteres` }),
});

export const privateMessageSchema = z.object({
  content: z.string().trim().min(1, { message: "Mensagem obrigatória" }).max(LIMITS.MESSAGE, { message: `Máximo ${LIMITS.MESSAGE} caracteres` }),
});

export const journalEntrySchema = z.object({
  title: z.string().trim().max(LIMITS.TITLE, { message: `Máximo ${LIMITS.TITLE} caracteres` }),
  content: z.string().trim().min(1, { message: "Conteúdo obrigatório" }).max(LIMITS.CONTENT, { message: `Máximo ${LIMITS.CONTENT} caracteres` }),
  mood: z.string().trim().max(LIMITS.SHORT_TEXT, { message: `Máximo ${LIMITS.SHORT_TEXT} caracteres` }),
  bible_verse: z.string().trim().max(LIMITS.SHORT_TEXT, { message: `Máximo ${LIMITS.SHORT_TEXT} caracteres` }),
});

export const eventSchema = z.object({
  title: z.string().trim().min(1, { message: "Título obrigatório" }).max(LIMITS.TITLE, { message: `Máximo ${LIMITS.TITLE} caracteres` }),
  description: z.string().trim().max(LIMITS.DESCRIPTION, { message: `Máximo ${LIMITS.DESCRIPTION} caracteres` }),
  event_type: z.string().min(1, { message: "Tipo obrigatório" }),
  event_date: z.string().min(1, { message: "Data obrigatória" }),
  start_time: z.string().min(1, { message: "Horário obrigatório" }),
  end_time: z.string(),
  location: z.string().trim().max(LIMITS.LOCATION, { message: `Máximo ${LIMITS.LOCATION} caracteres` }),
  address: z.string().trim().max(500, { message: "Máximo 500 caracteres" }).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  location_type: z.string().optional(),
});

export const songSchema = z.object({
  title: z.string().trim().min(1, { message: "Título obrigatório" }).max(LIMITS.TITLE, { message: `Máximo ${LIMITS.TITLE} caracteres` }),
  artist: z.string().trim().max(LIMITS.SHORT_TEXT, { message: `Máximo ${LIMITS.SHORT_TEXT} caracteres` }),
  key: z.string().max(10),
  youtube_url: z.string().trim().max(LIMITS.URL, { message: `Máximo ${LIMITS.URL} caracteres` }),
});

export const bibleStudySchema = z.object({
  title: z.string().trim().min(1, { message: "Título obrigatório" }).max(LIMITS.TITLE, { message: `Máximo ${LIMITS.TITLE} caracteres` }),
  description: z.string().trim().max(LIMITS.DESCRIPTION, { message: `Máximo ${LIMITS.DESCRIPTION} caracteres` }),
  book: z.string().trim().min(1, { message: "Livro obrigatório" }).max(LIMITS.SHORT_TEXT, { message: `Máximo ${LIMITS.SHORT_TEXT} caracteres` }),
  chapters: z.string().trim().max(LIMITS.SHORT_TEXT, { message: `Máximo ${LIMITS.SHORT_TEXT} caracteres` }),
  end_date: z.string(),
});

export const notificationSchema = z.object({
  title: z.string().trim().min(1, { message: "Título obrigatório" }).max(LIMITS.TITLE, { message: `Máximo ${LIMITS.TITLE} caracteres` }),
  message: z.string().trim().min(1, { message: "Mensagem obrigatória" }).max(LIMITS.MESSAGE, { message: `Máximo ${LIMITS.MESSAGE} caracteres` }),
  type: z.string().optional(),
});

// Type-safe validation result types
type ValidationSuccess<T> = { success: true; data: T; error: null };
type ValidationError = { success: false; data: null; error: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// Validation helper function with proper type narrowing
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data, error: null };
  }
  
  // Get the first error message
  const firstError = result.error.errors[0];
  const fieldName = firstError.path.join('.');
  const message = firstError.message;
  
  return { 
    success: false, 
    data: null,
    error: fieldName ? `${fieldName}: ${message}` : message 
  };
}

// Type exports for convenience
export type PrayerRequestInput = z.infer<typeof prayerRequestSchema>;
export type CommunityPostInput = z.infer<typeof communityPostSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type PrivateMessageInput = z.infer<typeof privateMessageSchema>;
export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type SongInput = z.infer<typeof songSchema>;
export type BibleStudyInput = z.infer<typeof bibleStudySchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
