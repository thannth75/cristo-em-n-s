import { describe, it, expect } from "vitest";
import {
  KIDS_STORIES,
  KIDS_WEEKLY_MISSIONS,
  KIDS_QUIZ_QUESTIONS,
  KIDS_TRACKS,
  KIDS_MEMORY_VERSES,
} from "../kidsTeenContent";
import type { KidsAgeGroup } from "../kidsTeenContent";

describe("KIDS_STORIES", () => {
  it("has at least 5 stories", () => {
    expect(KIDS_STORIES.length).toBeGreaterThanOrEqual(5);
  });

  it("all stories have unique IDs", () => {
    const ids = KIDS_STORIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all stories have required fields", () => {
    KIDS_STORIES.forEach((story) => {
      expect(story.id.length).toBeGreaterThan(0);
      expect(story.title.length).toBeGreaterThan(0);
      expect(story.summary.length).toBeGreaterThan(0);
      expect(story.reference.length).toBeGreaterThan(0);
      expect(story.coverEmoji.length).toBeGreaterThan(0);
    });
  });

  it("all stories have valid age groups", () => {
    const validGroups: KidsAgeGroup[] = ["5-8", "9-12", "13-17"];
    KIDS_STORIES.forEach((story) => {
      expect(validGroups).toContain(story.ageGroup);
    });
  });

  it("all stories have at least one chapter", () => {
    KIDS_STORIES.forEach((story) => {
      expect(story.chapters.length).toBeGreaterThan(0);
    });
  });

  it("all chapter IDs are unique across all stories", () => {
    const chapterIds = KIDS_STORIES.flatMap((s) => s.chapters.map((c) => c.id));
    expect(new Set(chapterIds).size).toBe(chapterIds.length);
  });

  it("all chapters have required fields", () => {
    KIDS_STORIES.forEach((story) => {
      story.chapters.forEach((ch) => {
        expect(ch.id.length).toBeGreaterThan(0);
        expect(ch.title.length).toBeGreaterThan(0);
        expect(ch.text.length).toBeGreaterThan(0);
        expect(ch.reflection.length).toBeGreaterThan(0);
        expect(ch.illustration.length).toBeGreaterThan(0);
      });
    });
  });

  it("has stories for each age group", () => {
    const groups = new Set(KIDS_STORIES.map((s) => s.ageGroup));
    expect(groups.has("5-8")).toBe(true);
    expect(groups.has("9-12")).toBe(true);
    expect(groups.has("13-17")).toBe(true);
  });
});

describe("KIDS_WEEKLY_MISSIONS", () => {
  it("has 5 missions", () => {
    expect(KIDS_WEEKLY_MISSIONS).toHaveLength(5);
  });

  it("all missions have unique IDs", () => {
    const ids = KIDS_WEEKLY_MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all missions award 50 XP", () => {
    KIDS_WEEKLY_MISSIONS.forEach((m) => {
      expect(m.xp).toBe(50);
    });
  });

  it("all missions have title and emoji", () => {
    KIDS_WEEKLY_MISSIONS.forEach((m) => {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.emoji.length).toBeGreaterThan(0);
    });
  });
});

describe("KIDS_QUIZ_QUESTIONS", () => {
  it("has at least 5 questions", () => {
    expect(KIDS_QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("all questions have 4 options", () => {
    KIDS_QUIZ_QUESTIONS.forEach((q) => {
      expect(q.options).toHaveLength(4);
    });
  });

  it("all correct indices are valid", () => {
    KIDS_QUIZ_QUESTIONS.forEach((q) => {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
    });
  });

  it("all questions have non-empty question text", () => {
    KIDS_QUIZ_QUESTIONS.forEach((q) => {
      expect(q.question.length).toBeGreaterThan(0);
    });
  });
});

describe("KIDS_TRACKS", () => {
  it("has 3 tracks", () => {
    expect(KIDS_TRACKS).toHaveLength(3);
  });

  it("covers all age groups", () => {
    const groups = KIDS_TRACKS.map((t) => t.ageGroup);
    expect(groups).toContain("5-8");
    expect(groups).toContain("9-12");
    expect(groups).toContain("13-17");
  });

  it("all tracks have title and description", () => {
    KIDS_TRACKS.forEach((t) => {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.focus.length).toBeGreaterThan(0);
    });
  });
});

describe("KIDS_MEMORY_VERSES", () => {
  it("has at least 3 verses", () => {
    expect(KIDS_MEMORY_VERSES.length).toBeGreaterThanOrEqual(3);
  });

  it("all verses have unique IDs", () => {
    const ids = KIDS_MEMORY_VERSES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all verses have reference and text", () => {
    KIDS_MEMORY_VERSES.forEach((v) => {
      expect(v.reference.length).toBeGreaterThan(0);
      expect(v.text.length).toBeGreaterThan(0);
    });
  });
});
