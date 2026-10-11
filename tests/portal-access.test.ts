import { describe, expect, it } from "vitest";
import { resolvePortalStudentId } from "../src/lib/portal-access";

describe("portal role isolation", () => {
  it("allows a student to resolve only their own portal record", () => {
    expect(resolvePortalStudentId("STUDENT", "own-student-id", ["own-student-id"])).toEqual({ id: "own-student-id", status: 200 });
    expect(resolvePortalStudentId("STUDENT", "other-student-id", ["own-student-id"])).toEqual({ id: null, status: 403 });
  });

  it("allows a parent to switch between linked children only", () => {
    expect(resolvePortalStudentId("PARENT", "second-child", ["first-child", "second-child"])).toEqual({ id: "second-child", status: 200 });
    expect(resolvePortalStudentId("PARENT", "unlinked-child", ["first-child", "second-child"])).toEqual({ id: null, status: 404 });
    expect(resolvePortalStudentId("PARENT", null, ["first-child", "second-child"])).toEqual({ id: "first-child", status: 200 });
  });
});
