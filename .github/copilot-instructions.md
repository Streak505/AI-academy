# Project context for all tasks

Project: "Shahzaib Royal Academy" website — an evening coaching academy in Pakistan.
Timing: Monday–Saturday, 5:00 PM – 8:00 PM (Asia/Karachi). Currency: PKR. Primary language: English (keep UI copy simple; structure so Urdu can be added later).

Stack (do NOT change without asking): Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3, Mongoose 9 on MongoDB Atlas, JWT cookie auth in src/lib/auth.ts, deployed on Vercel (serverless). Package manager: pnpm.

Hard rules:
1. Vercel serverless: NEVER write to the local filesystem at runtime. Files (admission documents, payment proofs, gallery images) go to Vercel Blob (`@vercel/blob`) and only the URL + metadata are stored in MongoDB.
2. Never hard-code secrets. Read from process.env. Never use a NEXT_PUBLIC_ prefix for secrets. Update .env.example whenever you add a variable.
3. All DB access goes through `connectDB()` in src/lib/db.ts. Models live in src/models and use the `models.X || model(...)` pattern.
4. Every API route: validate input (use/extend src/lib/validations.ts), check auth with the helpers in src/lib/auth.ts / admin-auth.ts, return `{ success, data | message }`, wrap in try/catch, log server errors with console.error, never leak stack traces or internals to the client.
5. Role-based access: roles are ADMIN, INSTRUCTOR, STUDENT, PARENT (PARENT is added in Prompt 2). A student/parent may only read their own / their linked children's data — enforce on the server, not just in the UI.
6. Pages that show DB data must distinguish three states: loading, error (with retry), and genuinely empty. Never render an empty state when the request failed.
7. Mobile-first responsive UI, accessible (labels, focus states, alt text, color contrast). Reuse components in src/components/Common/DataState.tsx.
8. Keep changes minimal and focused on the task. Don't reformat unrelated files. Don't delete existing features unless the task says so — hide/deprecate instead.
9. After each task: run `pnpm exec tsc --noEmit` and `pnpm build`, fix all errors, and summarize what changed, which env vars/manual steps I must do, and anything you were unsure about.
10. Dates/times display in Asia/Karachi. Money stored as integer PKR (no floats).
````

---
