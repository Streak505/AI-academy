import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Enrollment } from "@/models/Enrollment";
import { Lesson } from "@/models/Lesson";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import { isValidObjectId } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ success: false, message: "Please sign in to submit your quiz." }, { status: 401 });
    if (user.role !== "STUDENT") return Response.json({ success: false, message: "Only students can submit quiz attempts." }, { status: 403 });

    const body = await request.json();
    const quizId = String(body?.quizId || "");
    const answers = body?.answers;

    if (!quizId || !isValidObjectId(quizId)) return Response.json({ success: false, message: "A valid quiz is required." }, { status: 400 });
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) return Response.json({ success: false, message: "Your quiz answers are required." }, { status: 400 });

    await connectToDatabase();
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return Response.json({ success: false, message: "Quiz not found." }, { status: 404 });

    const enrollment = await Enrollment.findOne({ student: user.id, course: quiz.course, status: { $ne: "Cancelled" } }).lean();
    if (!enrollment) return Response.json({ success: false, message: "You must be enrolled in this course to take the quiz." }, { status: 403 });

    const totalQuestions = quiz.questions.length;
    let correctAnswers = 0;
    const review = quiz.questions.map((question: any, questionIndex: number) => {
      const rawAnswer = answers[questionIndex] ?? answers[String(question._id)] ?? answers[String(questionIndex)] ?? -1;
      const selectedOption = Number(rawAnswer);
      const isCorrect = Number.isInteger(selectedOption) && selectedOption === question.correctAnswer;
      if (isCorrect) correctAnswers += 1;
      return {
        questionId: String(question._id),
        text: question.text,
        selectedOption,
        correctAnswer: question.correctAnswer,
        isCorrect,
        options: question.options,
      };
    });

    type QuizReviewItem = {
      questionId: string;
      selectedOption: number;
      correctAnswer: number;
      isCorrect: boolean;
    };

    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = percentage >= Number(quiz.passingScore ?? 70);

    const attempt = await QuizAttempt.create({
      student: user.id,
      course: quiz.course,
      quiz: quizId,
      score: correctAnswers,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      percentage,
      passed,
      passingScore: Number(quiz.passingScore ?? 70),
      answers: review.map((item: QuizReviewItem) => ({
        questionId: item.questionId,
        selectedOption: item.selectedOption,
        correctAnswer: item.correctAnswer,
        isCorrect: item.isCorrect,
      })),
    });

    const lessonCount = await Lesson.countDocuments({ course: quiz.course, isPublished: true });
    const completedLessonCount = Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.length : 0;
    const nextProgress = Math.min(100, Math.round((completedLessonCount / Math.max(1, lessonCount)) * 100));

    if (passed) {
      const finalProgress = Math.max(nextProgress, 100);
      const certificateCode = `AI-${String(quiz.course).slice(-6).toUpperCase()}-${new Date().getFullYear()}`;

      await Enrollment.findByIdAndUpdate(enrollment._id, {
        progress: finalProgress,
        status: "Completed",
        completionDate: new Date(),
        certificateIssued: true,
        certificateCode,
      });
    }

    return Response.json({
      success: true,
      data: {
        attemptId: String(attempt._id),
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        percentage,
        passed,
        passingScore: Number(quiz.passingScore ?? 70),
        review,
      },
    });
  } catch (error) {
    console.error("POST /api/quizzes/submit failed:", error);
    return Response.json({ success: false, message: "Could not submit quiz." }, { status: 500 });
  }
}
