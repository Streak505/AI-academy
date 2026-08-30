"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type QuizQuestion = {
  _id?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

type QuizRecord = {
  _id: string;
  title: string;
  description: string;
  passingScore: number;
  isPublished: boolean;
  questions: QuizQuestion[];
};

export default function InstructorQuizManagerPage() {
  const params = useParams();
  const courseId = String(params.courseId || "");
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const emptyForm = {
    title: "",
    description: "",
    passingScore: 70,
    isPublished: true,
    questions: [
      { text: "", options: ["", ""], correctAnswer: 0, explanation: "" },
    ],
  };

  const [draft, setDraft] = useState(emptyForm);

  async function loadQuizzes() {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/quizzes?courseId=${courseId}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load quizzes.");
      }
      setQuizzes(data.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load quizzes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  function updateQuestion(index: number, field: keyof QuizQuestion, value: string | number | string[]) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => {
        if (questionIndex !== index) return question;
        if (field === "options") return { ...question, options: value as string[] };
        return { ...question, [field]: value };
      }),
    }));
  }

  function updateQuestionOption(questionIndex: number, optionIndex: number, value: string) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;
        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;
        return { ...question, options: nextOptions };
      }),
    }));
  }

  function addQuestion() {
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, { text: "", options: ["", ""], correctAnswer: 0, explanation: "" }],
    }));
  }

  function removeQuestion(index: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((_, questionIndex) => questionIndex !== index),
    }));
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const payload = {
        courseId,
        title: draft.title,
        description: draft.description,
        passingScore: Number(draft.passingScore),
        isPublished: draft.isPublished,
        questions: draft.questions.map((question) => ({
          text: question.text,
          options: question.options.map((option) => option.trim()),
          correctAnswer: Number(question.correctAnswer),
          explanation: question.explanation || "",
        })),
      };

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create quiz.");
      }

      setDraft(emptyForm);
      await loadQuizzes();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create quiz.");
    }
  }

  async function handleDelete(quizId: string) {
    if (!confirm("Delete this quiz?")) return;
    setError("");

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete quiz.");
      }
      await loadQuizzes();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete quiz.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-30">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Instructor tools</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Quiz management</h1>
          </div>
          <Link href="/instructor/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-slate-500">Back to dashboard</Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Existing quizzes</h2>
            {isLoading ? <p className="mt-4 text-slate-600">Loading quizzes...</p> : quizzes.length === 0 ? <p className="mt-4 text-slate-600">No quizzes created for this course yet.</p> : <div className="mt-5 space-y-4">{quizzes.map((quiz) => <article key={String(quiz._id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-900">{quiz.title}</h3><p className="mt-1 text-sm text-slate-600">{quiz.description}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${quiz.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>{quiz.isPublished ? "Published" : "Draft"}</span></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600"><span className="rounded-full bg-white px-2.5 py-1">{quiz.questions.length} questions</span><span className="rounded-full bg-white px-2.5 py-1">Passing score: {quiz.passingScore}%</span></div><button type="button" onClick={() => handleDelete(String(quiz._id))} className="mt-4 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">Delete</button></article>)}</div>}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Create a quiz</h2>
            <form onSubmit={handleCreate} className="mt-5 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">Quiz title</label>
                <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Passing score (%)</label>
                <input type="number" min={0} max={100} value={draft.passingScore} onChange={(event) => setDraft((current) => ({ ...current, passingScore: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} />
                Publish immediately
              </label>

              <div className="space-y-4">
                {draft.questions.map((question, questionIndex) => (
                  <div key={`question-${questionIndex}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">Question {questionIndex + 1}</p>
                      {draft.questions.length > 1 ? <button type="button" onClick={() => removeQuestion(questionIndex)} className="text-sm font-semibold text-rose-600">Remove</button> : null}
                    </div>

                    <div className="mt-3">
                      <label className="text-sm font-medium text-slate-700">Question text</label>
                      <textarea value={question.text} onChange={(event) => updateQuestion(questionIndex, "text", event.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" required />
                    </div>

                    <div className="mt-4 space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={`option-${questionIndex}-${optionIndex}`} className="flex items-center gap-2">
                          <input value={option} onChange={(event) => updateQuestionOption(questionIndex, optionIndex, event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" placeholder={`Option ${optionIndex + 1}`} required />
                          {question.options.length < 6 ? (
                            <button type="button" onClick={() => updateQuestion(questionIndex, "options", [...question.options, ""])} className="text-sm font-semibold text-violet-700">Add</button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-700">Correct answer index</label>
                      <select value={question.correctAnswer} onChange={(event) => updateQuestion(questionIndex, "correctAnswer", Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                        {question.options.map((_, optionIndex) => <option key={`${questionIndex}-choice-${optionIndex}`} value={optionIndex}>{optionIndex + 1}</option>)}
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-700">Explanation (optional)</label>
                      <textarea value={question.explanation || ""} onChange={(event) => updateQuestion(questionIndex, "explanation", event.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={addQuestion} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Add question</button>
                <button type="submit" className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Create quiz</button>
              </div>
            </form>

            {error ? <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}
