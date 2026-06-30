import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty arguments", () => {
    expect(cn()).toBe("");
  });

  it("merges Tailwind conflicting classes (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("merges Tailwind conflicting color classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("keeps non-conflicting Tailwind classes", () => {
    const result = cn("p-4", "m-2", "text-sm");
    expect(result).toContain("p-4");
    expect(result).toContain("m-2");
    expect(result).toContain("text-sm");
  });

  it("handles array input via clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles object input via clsx", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
  });
});
