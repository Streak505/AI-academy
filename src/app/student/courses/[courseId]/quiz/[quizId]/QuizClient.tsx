"use client";

import Link from "next/link";
import { useState } from "react";

type QuizQuestion = {
  _id?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

type AttemptResult = {
  passed: boolean;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  passingScore: number;
  review: Array<{
    questionId: string;
    text: string;
    selectedOption: number;
    correctAnswer: number;
    isCorrect: boolean;
    options: string[];
  }>;
};

export function QuizClient({
  course,
  quiz,
  attempt,
  courseId,
}: {
  course: { _id: string; title: string };
  quiz: { _id: string; title: string; description: string; questions: QuizQuestion[]; passingScore: number };
  attempt?: { percentage: number; passed: boolean; correctAnswers: number; totalQuestions: number } | null;
  courseId: string;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);

  function updateAnswer(index: number, value: number) {
    setAnswers((current) => ({ ...current, [index]: value }));
  }

  async function handleSubmit() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz._id, answers }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Quiz submission failed.");
      }

      setResult(data.data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit quiz.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasAnsweredAll = quiz.questions.every((_, index) => typeof answers[index] === "number");

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-30">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Quiz</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{quiz.title}</h1>
          </div>
          <Link href={`/student/courses/${courseId}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-slate-500">Back to course</Link>
        </div>

        <p className="mt-4 text-slate-700">{quiz.description}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{quiz.questions.length} questions</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Passing score: {quiz.passingScore}%</span>
        </div>

        {!result && attempt ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Previous attempt</p>
            <h2 className="mt-3 text-2xl font-bold text-emerald-900">{attempt.percentage}%</h2>
            <p className="mt-2 text-sm text-emerald-800">{attempt.passed ? "PASSED" : "Needs improvement"} · {attempt.correctAnswers}/{attempt.totalQuestions} correct</p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Results</p>
                <h2 className="mt-2 text-3xl font-bold text-amber-900">{result.percentage}%</h2>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${result.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                {result.passed ? "PASSED" : "FAILED"}
              </span>
            </div>
            <p className="mt-3 text-sm text-amber-900">{result.correctAnswers} / {result.totalQuestions} correct · {result.incorrectAnswers} incorrect</p>
          </div>
        ) : null}

        {!result ? (
          <div className="mt-8 space-y-5">
            {quiz.questions.map((question, index) => (
              <div key={String(question._id || index)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-base font-semibold text-slate-900">{index + 1}. {question.text}</p>
                <div className="mt-4 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={`${String(question._id || index)}-${optionIndex}`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:border-violet-300">
                      <input
                        type="radio"
                        name={`question-${String(question._id || index)}`}
                        value={optionIndex}
                        checked={answers[index] === optionIndex}
                        onChange={() => updateAnswer(index, optionIndex)}
                        className="h-4 w-4 accent-violet-600"
                        aria-label={`Answer option ${optionIndex + 1} for question ${index + 1}`}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {result.review.map((item, index) => (
              <div key={item.questionId || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{index + 1}. {item.text}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {item.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {item.options.map((option, optionIndex) => {
                    const isSelected = optionIndex === item.selectedOption;
                    const isCorrectOption = optionIndex === item.correctAnswer;
                    return (
                      <li key={`${item.questionId}-${optionIndex}`} className={`rounded-lg px-2.5 py-2 ${isCorrectOption ? "bg-emerald-100 text-emerald-900" : isSelected ? "bg-rose-100 text-rose-900" : "bg-white"}`}>
                        {option}
                        {isSelected ? " • Your answer" : ""}
                        {isCorrectOption ? " • Correct answer" : ""}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {error ? <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {!result ? (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-600">{course.title}</p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasAnsweredAll}
              className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
