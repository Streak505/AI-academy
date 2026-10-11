# Vercel deployment checklist

- [ ] Create a MongoDB Atlas database user and copy its connection URI.
- [ ] In Atlas **Network Access**, allow `0.0.0.0/0` for Vercel serverless access.
- [ ] Add these Vercel Production environment variables: `MONGODB_URI`, `MONGODB_DB` (`shahzaibroyalacademy`), `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `NEXT_PUBLIC_SITE_URL`. Set each secret to a unique value; add email, OAuth, and Blob variables only when those integrations are configured.
- [ ] Set `BLOB_PRIVATE_READ_WRITE_TOKEN` for private payment proof screenshots and `CRON_SECRET` to a long random secret for the scheduled fee-overdue job.
- [ ] Replace the `TODO_REPLACE` account title, EasyPaisa/JazzCash numbers, bank name, and IBAN in `src/config/academy.ts`; also set the approved fee due day and flat/per-day late-fee rule there.
- [ ] Configure one fee structure per program and effective date in Admin → Fees. Confirm program-linked student records and their concession percentages before generating challans.
- [ ] The scheduled `/api/cron/fees` route runs daily at 23:00 Pakistan time. Vercel sends `Authorization: Bearer $CRON_SECRET` to cron jobs when that environment variable is configured.
- [ ] Redeploy the Vercel project so the new environment values take effect.
- [ ] For the initial content seed, create a local `.env.production.local` file (gitignored) containing `MONGODB_URI`, `MONGODB_DB`, and `ADMIN_PASSWORD`; then run `pnpm db:seed:atlas` once from a trusted machine. This performs idempotent upserts and never deletes database records or changes an existing admin password.
- [ ] Verify your deployment's `/api/health` returns `ok: true`, `db.connected: true`, and the expected program, CSR, and student counts.

Do not commit `.env.production.local` or paste its values into logs, issues, or source control.
