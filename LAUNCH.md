# Launch checklist

Complete each item in the production environment before opening registration.

## Vercel environment variables

Set values in the Vercel project environment settings (never commit production values). Use separate secrets for production and preview where practical.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string for the academy database. |
| `MONGODB_DB` | No | Atlas database name; defaults to the application database name. |
| `JWT_SECRET` | Yes | Access-token signing key; generate a unique, high-entropy value. |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing key; use a different value from `JWT_SECRET`. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical production origin, including `https://` and the custom domain. |
| `APP_URL` | Recommended | Server-side origin used in verification and password-reset links. |
| `NEXT_PUBLIC_APP_URL` | Optional | Client-facing application origin for legacy links. |
| `ADMIN_EMAIL` | For admin bootstrap/notifications | Administrator email; otherwise notification recipient falls back to academy settings. |
| `ADMIN_PASSWORD` | One-time bootstrap only | Strong initial administrator password for the production seed; remove it from deployment settings after setup. |
| `BLOB_PRIVATE_STORE_ID` | Yes | Store ID belonging to the dedicated private Blob store. |
| `BLOB_PRIVATE_READ_WRITE_TOKEN` | Yes | Private Blob read-write token for admission documents and payment proofs. |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN` | Yes | Read-write token for a different public Blob store used by public media. |
| `EMAIL_PROVIDER` | Yes in production | Set to `smtp` to deliver mail. |
| `EMAIL_HOST` | Yes with SMTP | SMTP server host. |
| `EMAIL_PORT` | Yes with SMTP | SMTP server port (commonly 587 with STARTTLS or 465 with TLS). |
| `EMAIL_FROM` | Yes with SMTP | Verified sender address and optional display name. |
| `EMAIL_USER`, `EMAIL_PASS` | Provider-dependent | SMTP authentication credentials, when required by the provider. |
| `CRON_SECRET` | Yes if scheduled fee cron is enabled | Secret expected by the scheduled fee route. |

Set public academy contact details, address, map URL, social links, and opening text in the admin Academy Settings page. Configure the locality in `src/config/academy.ts` and confirm that the approved concession rates and payment account details are real before publishing; the repository currently includes `TODO_REPLACE` values for these items.

The sign-in UI contains Google/GitHub buttons, but this repository has no NextAuth route/provider configuration. OAuth is not launch-ready; configure and test the providers or hide those buttons before production.

## Atlas and application setup

- [ ] Enable automated Atlas backups and verify the retention/restore policy.
- [ ] Restrict Atlas network access to the required production egress addresses; do not leave broad public IP access enabled.
- [ ] Use a dedicated database user with only the permissions the application needs on the academy database.
- [ ] Add and verify the custom domain in Vercel, then set `NEXT_PUBLIC_SITE_URL` to its canonical HTTPS origin.
- [ ] Configure Vercel Blob with two separate stores: public media and private admission/payment documents. Check `/api/health` and confirm both resolved store IDs differ.
- [ ] Set production SMTP values and send a real delivery test. Confirm provider status, sender-domain authentication, and reply handling.
- [ ] Run `pnpm db:seed:atlas` once against the production Atlas cluster after checking its confirmation safeguards and configured admin credentials.
- [ ] Create the real administrator account, verify its access, and remove/disable any temporary seed accounts.
- [ ] Resolve the Google/GitHub sign-in configuration gap noted above before making those buttons available to users.
- [ ] Rotate all deploy, database, signing, SMTP, Blob, and cron secrets before launch; repeat after staff access changes.
- [ ] Verify `/api/health` reports database connectivity and expected public/private Blob stores without exposing tokens.
- [ ] Verify the Vercel cron schedule and authorization for the fee-related cron route.

## Production smoke test

- [ ] Submit an application using a dedicated test student and test parent.
- [ ] Confirm receipt email and verify uploaded admission documents are in the private Blob store.
- [ ] Review and approve the application; enroll the student and verify portal credentials/first-login password-change behavior.
- [ ] Generate a fee challan, verify its PDF and amount, then submit a test payment proof.
- [ ] Verify the payment in the admin panel and confirm the resulting email and student/parent portal balances.
- [ ] Check counseling booking, slot-capacity enforcement, confirmation/reschedule/cancel mail, and contact auto-reply.
- [ ] Edit a public gallery item and WhatsApp contact number in admin; confirm public pages update without a deployment.
- [ ] Check public metadata, sitemap, robots, OG image, structured data, and mobile layout on the production domain.
- [ ] Delete the test application/student/parent/payment and their uploaded documents from the application and Blob after testing. Keep only operational audit records where policy requires them.
- [ ] Confirm no temporary credentials, test accounts, or test data remain.
