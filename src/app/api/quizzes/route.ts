import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Course } from "@/models/Course";
import { Quiz } from "@/models/Quiz";

// DEPRECATED: not part of Shahzaib Royal Academy scope
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId || !isValidObjectId(courseId)) {
      return Response.json({ success: false, message: "A valid course id is required." }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) return Response.json({ success: false, message: "Please sign in first." }, { status: 401 });

    await connectToDatabase();
    const course = await Course.findById(courseId).lean();
    if (!course) return Response.json({ success: false, message: "Course not found." }, { status: 404 });

    if (user.role === "STUDENT") {
      const enrollment = await Enrollment.findOne({ student: user.id, course: courseId, status: { $in: ["Active", "Completed"] } }).lean();
      if (!enrollment) return Response.json({ success: false, message: "You must be enrolled in this course." }, { status: 403 });
    } else if (user.role === "INSTRUCTOR") {
      const account = await User.findById(user.id).select("instructorProfile").lean();
      if (!account?.instructorProfile || String(course.instructor) !== String(account.instructorProfile)) {
        return Response.json({ success: false, message: "You can only access quizzes for your own courses." }, { status: 403 });
      }
    } else if (user.role !== "ADMIN") {
      return Response.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    const quizzes = await Quiz.find({ course: courseId, isPublished: true }).sort({ createdAt: -1 }).lean();
    const data = user.role === "ADMIN" || user.role === "INSTRUCTOR"
      ? quizzes
      : quizzes.map((quiz) => ({
          ...quiz,
          questions: quiz.questions.map(({ correctAnswer: _correctAnswer, explanation: _explanation, ...question }: { correctAnswer?: number; explanation?: string; [key: string]: unknown }) => question),
        }));
    return Response.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/quizzes failed:", error);
    return Response.json({ success: false, message: "Unable to load quizzes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ success: false, message: "Please sign in first." }, { status: 401 });
    if (!["ADMIN", "INSTRUCTOR"].includes(user.role)) return Response.json({ success: false, message: "Only instructors and admins can create quizzes." }, { status: 403 });

    const body = await request.json();
    const courseId = String(body?.courseId || "");
    const title = String(body?.title || "");
    const description = String(body?.description || "");
    const passingScore = Number(body?.passingScore ?? 70);
    const questions = body?.questions;

    if (!courseId || !isValidObjectId(courseId)) return Response.json({ success: false, message: "A valid course is required." }, { status: 400 });
    if (!isValidString(title, 3, 120)) return Response.json({ success: false, message: "Quiz title must be between 3 and 120 characters." }, { status: 400 });
    if (!isValidString(description, 10, 1000)) return Response.json({ success: false, message: "Quiz description must be longer than 10 characters." }, { status: 400 });
    if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) return Response.json({ success: false, message: "Passing score must be between 0 and 100." }, { status: 400 });

    await connectToDatabase();
    const course = await Course.findById(courseId).lean();
    if (!course) return Response.json({ success: false, message: "Course not found." }, { status: 404 });

    if (user.role === "INSTRUCTOR") {
      const account = await User.findById(user.id).select("instructorProfile").lean();
      const instructorId = account?.instructorProfile ? String(account.instructorProfile) : "";
      if (String(course.instructor) !== instructorId) {
        return Response.json({ success: false, message: "You can only manage quizzes for your own courses." }, { status: 403 });
      }
    }

    const normalizedQuestions = normalizeQuestions(questions);
    const quiz = await Quiz.create({
      course: courseId,
      title: title.trim(),
      description: description.trim(),
      questions: normalizedQuestions,
      passingScore,
      isPublished: body?.isPublished ?? true,
      createdBy: user.id,
    });

    await Course.findByIdAndUpdate(courseId, { $addToSet: { quizzes: quiz._id } });

    return Response.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create quiz.";
    console.error("POST /api/quizzes failed:", error);
    return Response.json({ success: false, message }, { status: 500 });
  }
}
