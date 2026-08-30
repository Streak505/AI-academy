import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Course } from "@/models/Course";
import { Quiz } from "@/models/Quiz";
import { User } from "@/models/User";
import { isValidObjectId, isValidString } from "@/lib/validations";

function normalizeQuestions(questions: unknown): Array<{ text: string; options: string[]; correctAnswer: number; explanation?: string }> {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("At least one quiz question is required.");
  }

  return questions.map((question, questionIndex) => {
    if (!question || typeof question !== "object") {
      throw new Error(`Question ${questionIndex + 1} is invalid.`);
    }

    const candidate = question as Record<string, unknown>;
    if (!isValidString(candidate.text, 5, 400)) {
      throw new Error(`Question ${questionIndex + 1} text is invalid.`);
    }
    if (!Array.isArray(candidate.options) || candidate.options.length < 2 || candidate.options.some((option) => typeof option !== "string" || !option.trim())) {
      throw new Error(`Question ${questionIndex + 1} needs at least two valid options.`);
    }
    const correctAnswer = Number(candidate.correctAnswer);
    if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= candidate.options.length) {
      throw new Error(`Question ${questionIndex + 1} must include a valid correct answer index.`);
    }

    return {
      text: String(candidate.text).trim(),
      options: candidate.options.map((option) => String(option).trim()),
      correctAnswer,
      explanation: typeof candidate.explanation === "string" ? candidate.explanation.trim() : "",
    };
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ success: false, message: "Please sign in first." }, { status: 401 });
    if (!["ADMIN", "INSTRUCTOR"].includes(user.role)) return Response.json({ success: false, message: "Only instructors and admins can update quizzes." }, { status: 403 });

    const { quizId } = await params;
    if (!quizId || !isValidObjectId(quizId)) return Response.json({ success: false, message: "A valid quiz id is required." }, { status: 400 });

    const body = await request.json();
    await connectToDatabase();
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return Response.json({ success: false, message: "Quiz not found." }, { status: 404 });

    const course = await Course.findById(quiz.course).lean();
    if (!course) return Response.json({ success: false, message: "Course not found." }, { status: 404 });

    if (user.role === "INSTRUCTOR") {
      const account = await User.findById(user.id).select("instructorProfile").lean();
      const instructorId = account?.instructorProfile ? String(account.instructorProfile) : "";
      if (String(course.instructor) !== instructorId) {
        return Response.json({ success: false, message: "You can only manage quizzes for your own courses." }, { status: 403 });
      }
    }

    const nextQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      {
        ...(typeof body.title === "string" && isValidString(body.title, 3, 120) ? { title: body.title.trim() } : {}),
        ...(typeof body.description === "string" && isValidString(body.description, 10, 1000) ? { description: body.description.trim() } : {}),
        ...(Array.isArray(body.questions) ? { questions: normalizeQuestions(body.questions) } : {}),
        ...(typeof body.passingScore !== "undefined" && Number.isFinite(Number(body.passingScore)) ? { passingScore: Number(body.passingScore) } : {}),
        ...(typeof body.isPublished === "boolean" ? { isPublished: body.isPublished } : {}),
      },
      { new: true }
    );

    return Response.json({ success: true, data: nextQuiz });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update quiz.";
    console.error("PUT /api/quizzes/[quizId] failed:", error);
    return Response.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ success: false, message: "Please sign in first." }, { status: 401 });
    if (!["ADMIN", "INSTRUCTOR"].includes(user.role)) return Response.json({ success: false, message: "Only instructors and admins can delete quizzes." }, { status: 403 });

    const { quizId } = await params;
    if (!quizId || !isValidObjectId(quizId)) return Response.json({ success: false, message: "A valid quiz id is required." }, { status: 400 });

    await connectToDatabase();
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return Response.json({ success: false, message: "Quiz not found." }, { status: 404 });

    const course = await Course.findById(quiz.course).lean();
    if (!course) return Response.json({ success: false, message: "Course not found." }, { status: 404 });

    if (user.role === "INSTRUCTOR") {
      const account = await User.findById(user.id).select("instructorProfile").lean();
      const instructorId = account?.instructorProfile ? String(account.instructorProfile) : "";
      if (String(course.instructor) !== instructorId) {
        return Response.json({ success: false, message: "You can only manage quizzes for your own courses." }, { status: 403 });
      }
    }

    await Quiz.findByIdAndDelete(quizId);
    await Course.findByIdAndUpdate(quiz.course, { $pull: { quizzes: quizId } });

    return Response.json({ success: true, message: "Quiz deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/quizzes/[quizId] failed:", error);
    return Response.json({ success: false, message: "Could not delete quiz." }, { status: 500 });
  }
}
