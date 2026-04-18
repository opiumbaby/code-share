import { normalizeExtension } from "../../src/lib/snippet-utils";

describe("normalizeExtension", () => {
  it("returns empty string for empty values", () => {
    expect(normalizeExtension("")).toBe("");
    expect(normalizeExtension("   ")).toBe("");
  });

  it("normalizes extension format", () => {
    expect(normalizeExtension("ts")).toBe(".ts");
    expect(normalizeExtension(".TS")).toBe(".ts");
    expect(normalizeExtension("  Jsx  ")).toBe(".jsx");
  });
});
