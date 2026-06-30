import { describe, it, expect } from "vitest";
import {
  prayerRequestSchema,
  communityPostSchema,
  chatMessageSchema,
  privateMessageSchema,
  journalEntrySchema,
  eventSchema,
  songSchema,
  bibleStudySchema,
  notificationSchema,
  validateInput,
} from "../validation";

describe("validateInput", () => {
  it("returns success with parsed data for valid input", () => {
    const result = validateInput(communityPostSchema, { content: "Hello" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ content: "Hello" });
    expect(result.error).toBeNull();
  });

  it("returns error with field name for invalid input", () => {
    const result = validateInput(communityPostSchema, { content: "" });
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toContain("content");
  });

  it("returns error without field name when path is empty", () => {
    const result = validateInput(communityPostSchema, "not-an-object");
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(typeof result.error).toBe("string");
  });

  it("trims whitespace from string fields", () => {
    const result = validateInput(communityPostSchema, { content: "  trimmed  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("trimmed");
    }
  });
});

describe("prayerRequestSchema", () => {
  const validData = { title: "My prayer", content: "Please pray", is_private: false };

  it("accepts valid prayer request", () => {
    const result = prayerRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = prayerRequestSchema.safeParse({ ...validData, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = prayerRequestSchema.safeParse({ ...validData, content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 chars", () => {
    const result = prayerRequestSchema.safeParse({ ...validData, title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding 5000 chars", () => {
    const result = prayerRequestSchema.safeParse({ ...validData, content: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });

  it("requires is_private to be boolean", () => {
    const result = prayerRequestSchema.safeParse({ ...validData, is_private: "yes" });
    expect(result.success).toBe(false);
  });
});

describe("communityPostSchema", () => {
  it("accepts valid content", () => {
    const result = communityPostSchema.safeParse({ content: "Hello community" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = communityPostSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding 5000 chars", () => {
    const result = communityPostSchema.safeParse({ content: "x".repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe("chatMessageSchema", () => {
  it("accepts valid message", () => {
    const result = chatMessageSchema.safeParse({ content: "Hi" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = chatMessageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message exceeding 1000 chars", () => {
    const result = chatMessageSchema.safeParse({ content: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe("privateMessageSchema", () => {
  it("accepts valid message", () => {
    const result = privateMessageSchema.safeParse({ content: "Hi" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = privateMessageSchema.safeParse({ content: "  " });
    expect(result.success).toBe(false);
  });
});

describe("journalEntrySchema", () => {
  const validEntry = { title: "Day 1", content: "Today was good", mood: "happy", bible_verse: "John 3:16" };

  it("accepts valid journal entry", () => {
    const result = journalEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("allows empty title (not required)", () => {
    const result = journalEntrySchema.safeParse({ ...validEntry, title: "" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = journalEntrySchema.safeParse({ ...validEntry, content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 chars", () => {
    const result = journalEntrySchema.safeParse({ ...validEntry, title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects mood exceeding 100 chars", () => {
    const result = journalEntrySchema.safeParse({ ...validEntry, mood: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects bible_verse exceeding 100 chars", () => {
    const result = journalEntrySchema.safeParse({ ...validEntry, bible_verse: "x".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("eventSchema", () => {
  const validEvent = {
    title: "Worship Night",
    description: "Join us",
    event_type: "worship",
    event_date: "2025-01-15",
    start_time: "19:00",
    end_time: "21:00",
    location: "Church",
  };

  it("accepts valid event", () => {
    const result = eventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = eventSchema.safeParse({ ...validEvent, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty event_type", () => {
    const result = eventSchema.safeParse({ ...validEvent, event_type: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty event_date", () => {
    const result = eventSchema.safeParse({ ...validEvent, event_date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty start_time", () => {
    const result = eventSchema.safeParse({ ...validEvent, start_time: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional latitude/longitude", () => {
    const result = eventSchema.safeParse({ ...validEvent, latitude: -23.5, longitude: -46.6 });
    expect(result.success).toBe(true);
  });

  it("rejects latitude out of range", () => {
    const result = eventSchema.safeParse({ ...validEvent, latitude: -91 });
    expect(result.success).toBe(false);
  });

  it("rejects longitude out of range", () => {
    const result = eventSchema.safeParse({ ...validEvent, longitude: 181 });
    expect(result.success).toBe(false);
  });

  it("accepts null latitude/longitude", () => {
    const result = eventSchema.safeParse({ ...validEvent, latitude: null, longitude: null });
    expect(result.success).toBe(true);
  });
});

describe("songSchema", () => {
  const validSong = { title: "Amazing Grace", artist: "John Newton", key: "G", youtube_url: "" };

  it("accepts valid song", () => {
    const result = songSchema.safeParse(validSong);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = songSchema.safeParse({ ...validSong, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects key exceeding 10 chars", () => {
    const result = songSchema.safeParse({ ...validSong, key: "a".repeat(11) });
    expect(result.success).toBe(false);
  });

  it("rejects artist exceeding 100 chars", () => {
    const result = songSchema.safeParse({ ...validSong, artist: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("bibleStudySchema", () => {
  const validStudy = {
    title: "Romans study",
    description: "Deep dive into Romans",
    book: "Romanos",
    chapters: "1-4",
    end_date: "2025-03-01",
  };

  it("accepts valid study", () => {
    const result = bibleStudySchema.safeParse(validStudy);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = bibleStudySchema.safeParse({ ...validStudy, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty book", () => {
    const result = bibleStudySchema.safeParse({ ...validStudy, book: "" });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 2000 chars", () => {
    const result = bibleStudySchema.safeParse({ ...validStudy, description: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe("notificationSchema", () => {
  const validNotification = { title: "New event", message: "Join us Sunday" };

  it("accepts valid notification", () => {
    const result = notificationSchema.safeParse(validNotification);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = notificationSchema.safeParse({ ...validNotification, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = notificationSchema.safeParse({ ...validNotification, message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message exceeding 1000 chars", () => {
    const result = notificationSchema.safeParse({ ...validNotification, message: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("accepts optional type", () => {
    const result = notificationSchema.safeParse({ ...validNotification, type: "info" });
    expect(result.success).toBe(true);
  });
});
