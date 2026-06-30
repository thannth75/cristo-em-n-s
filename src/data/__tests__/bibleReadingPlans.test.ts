import { describe, it, expect } from "vitest";
import {
  BIBLE_BOOKS,
  MOOD_VERSES,
  BIBLE_BOOK_SUMMARIES,
} from "../bibleReadingPlans";

describe("BIBLE_BOOKS (reading plans)", () => {
  it("contains exactly 66 books", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
  });

  it("has books from both testaments", () => {
    const old = BIBLE_BOOKS.filter((b) => b.testament === "old");
    const nt = BIBLE_BOOKS.filter((b) => b.testament === "new");
    expect(old).toHaveLength(39);
    expect(nt).toHaveLength(27);
  });

  it("all books have positive chapter counts", () => {
    BIBLE_BOOKS.forEach((book) => {
      expect(book.chapters).toBeGreaterThan(0);
    });
  });

  it("all books have non-empty name and category", () => {
    BIBLE_BOOKS.forEach((book) => {
      expect(book.name.length).toBeGreaterThan(0);
      expect(book.category.length).toBeGreaterThan(0);
    });
  });

  it("has unique book names", () => {
    const names = BIBLE_BOOKS.map((b) => b.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("MOOD_VERSES", () => {
  const EXPECTED_MOODS = [
    "triste",
    "ansioso",
    "grato",
    "alegre",
    "preocupado",
    "medo",
    "esperancoso",
    "desanimado",
    "confuso",
  ];

  it("contains verses for all expected moods", () => {
    const moods = new Set(MOOD_VERSES.map((v) => v.mood));
    EXPECTED_MOODS.forEach((mood) => {
      expect(moods.has(mood)).toBe(true);
    });
  });

  it("has at least 3 verses per mood", () => {
    EXPECTED_MOODS.forEach((mood) => {
      const count = MOOD_VERSES.filter((v) => v.mood === mood).length;
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  it("all verses have required fields", () => {
    MOOD_VERSES.forEach((v) => {
      expect(v.verse.length).toBeGreaterThan(0);
      expect(v.reference.length).toBeGreaterThan(0);
      expect(v.encouragement.length).toBeGreaterThan(0);
      expect(v.prayerSuggestion.length).toBeGreaterThan(0);
    });
  });
});

describe("BIBLE_BOOK_SUMMARIES", () => {
  it("has summaries for key books", () => {
    const expectedBooks = ["Gênesis", "Êxodo", "Salmos", "Mateus", "João", "Romanos", "Apocalipse"];
    expectedBooks.forEach((name) => {
      expect(BIBLE_BOOK_SUMMARIES[name]).toBeDefined();
    });
  });

  it("all summaries have required fields", () => {
    Object.entries(BIBLE_BOOK_SUMMARIES).forEach(([name, info]) => {
      expect(info.summary.length).toBeGreaterThan(0);
      expect(info.keyThemes.length).toBeGreaterThan(0);
      expect(info.keyVerses.length).toBeGreaterThan(0);
      expect(info.application.length).toBeGreaterThan(0);
    });
  });

  it("all summary book names exist in BIBLE_BOOKS", () => {
    const bookNames = new Set(BIBLE_BOOKS.map((b) => b.name));
    Object.keys(BIBLE_BOOK_SUMMARIES).forEach((name) => {
      expect(bookNames.has(name)).toBe(true);
    });
  });
});
