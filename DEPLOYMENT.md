# Vercel deployment checklist

- [ ] Create a MongoDB Atlas database user and copy its connection URI.
- [ ] In Atlas **Network Access**, allow `0.0.0.0/0` for Vercel serverless access.
- [ ] Add these Vercel Production environment variables: `MONGODB_URI`, `MONGODB_DB` (`aiacademy`), `JWT_SECRET`, and `JWT_REFRESH_SECRET`. Set each secret to a unique value; add email, OAuth, and Blob variables only when those integrations are configured.
- [ ] Redeploy the Vercel project so the new environment values take effect.
- [ ] For the initial content seed, create a local `.env.production.local` file (gitignored) containing `MONGODB_URI`, `MONGODB_DB`, and `ADMIN_PASSWORD`; then run `pnpm db:seed:atlas` once from a trusted machine. This performs idempotent upserts and never deletes database records or changes an existing admin password.
- [ ] Verify `https://aiacademy-pied.vercel.app/api/health` returns `ok: true`, `db.connected: true`, and the expected non-zero content counts.

Do not commit `.env.production.local` or paste its values into logs, issues, or source control.
