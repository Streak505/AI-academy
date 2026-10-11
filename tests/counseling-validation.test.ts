import { describe, expect, it } from "vitest";
import { COUNSELING_SLOTS, isValidCounselingDate, isValidCounselingSlot } from "../src/lib/counseling-validation";

describe("counseling slots", () => {
  it("permits Monday through Saturday only", () => {
    expect(isValidCounselingDate("2026-10-12")).toBe(true);
    expect(isValidCounselingDate("2026-10-17")).toBe(true);
    expect(isValidCounselingDate("2026-10-18")).toBe(false);
  });

  it("permits half-hour slots from 17:00 up to 19:30, but not 20:00", () => {
    expect(COUNSELING_SLOTS).toEqual(["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"]);
    expect(isValidCounselingSlot("2026-10-12", "17:00")).toBe(true);
    expect(isValidCounselingSlot("2026-10-12", "19:30")).toBe(true);
    expect(isValidCounselingSlot("2026-10-12", "20:00")).toBe(false);
    expect(isValidCounselingSlot("2026-10-18", "17:00")).toBe(false);
  });
});
