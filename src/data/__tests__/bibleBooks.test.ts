import { describe, it, expect } from "vitest";
import {
  BIBLE_BOOKS,
  TESTAMENT_LABELS,
  AT_CATEGORIES,
  NT_CATEGORIES,
  getBookByAbbrev,
  getBooksByTestament,
  getBooksByCategory,
} from "../bibleBooks";

describe("BIBLE_BOOKS data integrity", () => {
  it("contains exactly 66 books", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
  });

  it("has 39 Old Testament books", () => {
    const at = BIBLE_BOOKS.filter((b) => b.testament === "AT");
    expect(at).toHaveLength(39);
  });

  it("has 27 New Testament books", () => {
    const nt = BIBLE_BOOKS.filter((b) => b.testament === "NT");
    expect(nt).toHaveLength(27);
  });

  it("has unique abbreviations", () => {
    const abbrevs = BIBLE_BOOKS.map((b) => b.abbrev);
    expect(new Set(abbrevs).size).toBe(abbrevs.length);
  });

  it("has unique order numbers", () => {
    const orders = BIBLE_BOOKS.map((b) => b.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("has consecutive order numbers from 1 to 66", () => {
    const sorted = [...BIBLE_BOOKS].sort((a, b) => a.order - b.order);
    sorted.forEach((book, idx) => {
      expect(book.order).toBe(idx + 1);
    });
  });

  it("has positive chapter counts for all books", () => {
    BIBLE_BOOKS.forEach((book) => {
      expect(book.chapters).toBeGreaterThan(0);
    });
  });

  it("starts with Genesis and ends with Revelation", () => {
    const first = BIBLE_BOOKS.find((b) => b.order === 1);
    const last = BIBLE_BOOKS.find((b) => b.order === 66);
    expect(first?.name).toBe("Gênesis");
    expect(last?.name).toBe("Apocalipse");
  });

  it("all books have non-empty name and abbrev", () => {
    BIBLE_BOOKS.forEach((book) => {
      expect(book.name.length).toBeGreaterThan(0);
      expect(book.abbrev.length).toBeGreaterThan(0);
    });
  });

  it("every book belongs to a known category", () => {
    const allCategories = new Set([...AT_CATEGORIES, ...NT_CATEGORIES]);
    BIBLE_BOOKS.forEach((book) => {
      expect(allCategories.has(book.category)).toBe(true);
    });
  });
});

describe("TESTAMENT_LABELS", () => {
  it("has labels for both testaments", () => {
    expect(TESTAMENT_LABELS.AT).toBe("Antigo Testamento");
    expect(TESTAMENT_LABELS.NT).toBe("Novo Testamento");
  });
});

describe("AT_CATEGORIES", () => {
  it("contains 5 Old Testament categories", () => {
    expect(AT_CATEGORIES).toHaveLength(5);
  });

  it("includes Pentateuco", () => {
    expect(AT_CATEGORIES).toContain("Pentateuco");
  });
});

describe("NT_CATEGORIES", () => {
  it("contains 5 New Testament categories", () => {
    expect(NT_CATEGORIES).toHaveLength(5);
  });

  it("includes Evangelhos", () => {
    expect(NT_CATEGORIES).toContain("Evangelhos");
  });
});

describe("getBookByAbbrev", () => {
  it("returns Genesis for 'gn'", () => {
    const book = getBookByAbbrev("gn");
    expect(book).toBeDefined();
    expect(book?.name).toBe("Gênesis");
    expect(book?.chapters).toBe(50);
  });

  it("returns Revelation for 'ap'", () => {
    const book = getBookByAbbrev("ap");
    expect(book).toBeDefined();
    expect(book?.name).toBe("Apocalipse");
  });

  it("returns Psalms for 'sl'", () => {
    const book = getBookByAbbrev("sl");
    expect(book?.name).toBe("Salmos");
    expect(book?.chapters).toBe(150);
  });

  it("returns undefined for unknown abbreviation", () => {
    expect(getBookByAbbrev("xyz")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getBookByAbbrev("")).toBeUndefined();
  });
});

describe("getBooksByTestament", () => {
  it("returns 39 books for Old Testament", () => {
    const books = getBooksByTestament("AT");
    expect(books).toHaveLength(39);
    books.forEach((b) => expect(b.testament).toBe("AT"));
  });

  it("returns 27 books for New Testament", () => {
    const books = getBooksByTestament("NT");
    expect(books).toHaveLength(27);
    books.forEach((b) => expect(b.testament).toBe("NT"));
  });
});

describe("getBooksByCategory", () => {
  it("returns 5 books for Pentateuco", () => {
    const books = getBooksByCategory("Pentateuco");
    expect(books).toHaveLength(5);
    books.forEach((b) => expect(b.category).toBe("Pentateuco"));
  });

  it("returns 4 books for Evangelhos", () => {
    const books = getBooksByCategory("Evangelhos");
    expect(books).toHaveLength(4);
    const names = books.map((b) => b.name);
    expect(names).toContain("Mateus");
    expect(names).toContain("Marcos");
    expect(names).toContain("Lucas");
    expect(names).toContain("João");
  });

  it("returns empty array for unknown category", () => {
    expect(getBooksByCategory("NonExistent")).toHaveLength(0);
  });

  it("returns 13 Cartas de Paulo", () => {
    const books = getBooksByCategory("Cartas de Paulo");
    expect(books).toHaveLength(13);
  });
});
