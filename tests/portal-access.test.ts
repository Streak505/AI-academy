import test from "node:test";
import assert from "node:assert/strict";
import { resolvePortalStudentId } from "../src/lib/portal-access";

test("student can resolve only their own portal record", () => {
  assert.deepEqual(resolvePortalStudentId("STUDENT", "own-student-id", ["own-student-id"]), { id: "own-student-id", status: 200 });
  assert.deepEqual(resolvePortalStudentId("STUDENT", "other-student-id", ["own-student-id"]), { id: null, status: 403 });
});

test("parent can switch between linked children but cannot request an unrelated child", () => {
  assert.deepEqual(resolvePortalStudentId("PARENT", "second-child", ["first-child", "second-child"]), { id: "second-child", status: 200 });
  assert.deepEqual(resolvePortalStudentId("PARENT", "unlinked-child", ["first-child", "second-child"]), { id: null, status: 404 });
  assert.deepEqual(resolvePortalStudentId("PARENT", null, ["first-child", "second-child"]), { id: "first-child", status: 200 });
});
