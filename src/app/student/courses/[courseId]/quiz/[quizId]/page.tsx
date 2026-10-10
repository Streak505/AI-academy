import { notFound, redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Quiz } from "@/models/Quiz";

// DEPRECATED: not part of Shahzaib Royal Academy scope
import { QuizAttempt } from "@/models/QuizAttempt";
import { QuizClient } from "./QuizClient";

async function getQuizData(courseId: string, quizId: string, studentId: string) {
  await connectToDatabase();
  const course = await Course.findById(courseId).lean();
  if (!course) return null;

  const quiz = await Quiz.findOne({ _id: quizId, course: courseId, isPublished: true }).lean();
  if (!quiz) return null;

  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId, status: { $ne: "Cancelled" } }).lean();
  if (!enrollment) return null;

  const attempt = await QuizAttempt.findOne({ student: studentId, quiz: quizId }).sort({ submittedAt: -1 }).lean();
  return { course, quiz, attempt };
}

export default async function QuizPage({ params }: { params: Promise<{ courseId: string; quizId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "STUDENT") redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/instructor/dashboard");

  const { courseId, quizId } = await params;
  const data = await getQuizData(courseId, quizId, user.id);
  if (!data) notFound();

  const { course, quiz, attempt } = data;

  return <QuizClient course={course} quiz={quiz} attempt={attempt} courseId={courseId} />;
}
