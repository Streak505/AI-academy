# Vercel Deployment

## MongoDB

Keep `MONGODB_URI=mongodb://127.0.0.1:27017/aiacademy` in the ignored `.env.local` file for local development. The application uses this local URI by default only outside production.

In Vercel, add `MONGODB_URI` under Project Settings > Environment Variables for Production (and Preview if those deployments need a database). Use the Atlas connection string with the database name included:

```text
mongodb+srv://<database-user>:<url-encoded-password>@aiacademy.blm6fyc.mongodb.net/aiacademy?retryWrites=true&w=majority&appName=AIAcademy
```

Create a dedicated Atlas database user with only the permissions the app needs. Allow Vercel to reach the cluster through Atlas Network Access; use a fixed Vercel egress IP where available, or the broad `0.0.0.0/0` rule only when necessary and with a strong, least-privilege database user. URL-encode special characters in the database password. Never use a `NEXT_PUBLIC_` prefix for database credentials.

## Other Environment Variables

Set production values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD`, `INSTRUCTOR_PASSWORD`, and `STUDENT_PASSWORD` in Vercel. Use unique, high-entropy secrets and passwords; do not reuse development values. Set `NEXT_PUBLIC_SITE_URL` to the deployed site's canonical HTTPS URL.

The values currently present in the provided `.env.local` excerpt have been exposed in this conversation. Rotate the JWT secrets and any account or session passwords before deployment, then update local and Vercel environment settings. Keep `.env.local` out of commits.

## Deployment Check

Deploy this repository as a Next.js project using `pnpm build`; do not enable static export. Production requires `MONGODB_URI` and will return a configuration error rather than silently trying localhost when it is missing. After deployment, verify an authenticated admin request to `/api/test-db` returns success and check Vercel function logs if Atlas rejects the connection.