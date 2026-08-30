export type LessonLike = {
  _id?: string | { toString?: () => string };
};

export function computeCourseProgress(completedLessonIds: Array<string | { _id?: string } | null | undefined>, lessons: LessonLike[]) {
  const completedSet = new Set(
    completedLessonIds
      .filter(Boolean)
      .map((item) => (typeof item === "string" ? item : item?._id ? String(item._id) : ""))
      .filter(Boolean)
  );

  const totalLessons = lessons.length;
  const completedCount = lessons.filter((lesson) => completedSet.has(String(lesson._id))).length;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return {
    completedSet,
    completedCount,
    totalLessons,
    progress,
    isComplete: totalLessons > 0 && completedCount >= totalLessons,
  };
}
