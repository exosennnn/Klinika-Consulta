# Klinika Consulta

Clinic appointment and patient-flow management system for **patients, doctors, coordinators, and guests**. Built with PHP, MariaDB/MySQL, Vue/JavaScript, and CSS; designed for local XAMPP use.

> **Project package:** This README describes the files in this ZIP, not a guarantee that every external service has been tested. The private SMTP and IPROG SMS credentials are intentionally excluded.

## Requirements

- XAMPP with Apache, MariaDB/MySQL, PHP 8.0+ and enabled PHP cURL extension
- Modern browser
- Working SMTP account for email OTP and appointment emails (configured in `backend/config.php`)
- IPROG SMS account, available credits and an active API token for guest SMS OTP
- PHP dependencies are included under `vendor/` (PHPMailer); Composer files are also present

## Fresh local installation (recommended)

1. Back up any existing `C:\xampp\htdocs\klinika_consulta` folder and existing database before replacing anything.
2. Extract this ZIP so the application path is `C:\xampp\htdocs\klinika_consulta\` (avoid nesting the folder twice).
3. Start **Apache** and **MySQL** in XAMPP.
4. In phpMyAdmin, create an **empty** database named `klinika_consulta_db` with `utf8mb4` collation. If that name already exists and contains data, use a different test database or back it up; **do not import the full dump on top of existing tables**.
5. Select the empty database, then **Import** `klinika_consulta_MERGED.sql` from this package. Confirm the import succeeds and the `appointments` table exists.
6. Check `backend/db.php` for your local database connection settings. If testing under another database name, update its connection configuration accordingly.
7. Copy `backend/config.example.php` to `backend/config.php` and enter private SMTP credentials. The sender email must be verified with your provider.
8. Copy `backend/sms_gateway_private.example.php` to `backend/sms_gateway_private.php` and enter a **new** IPROG API token. Never share the filled-in file.
9. Open `http://localhost/klinika_consulta/`.
10. Test guest booking, account login, registration, password recovery, doctor acceptance, and coordinator flows before presenting.

**Important:** The merged SQL uses the leader's data and ID relationships as the base. It adds compatible schema changes; it does **not** import conflicting doctor, account, appointment, or historical OTP records from the second database. Never assume that IDs from different SQL dumps refer to the same doctor or specialty. This is a **fresh-import SQL**, not a migration patch for an existing populated database.

## Verification rules

| Action | Expected verification |
| --- | --- |
| Guest appointment booking | SMS OTP to the Philippine mobile number via IPROG |
| Patient account registration | Required email OTP verification |
| Forgot password | Email OTP to the verified account email |
| Appointment booking while signed in | No additional booking OTP |
| Guest email field | Optional; no email OTP for guest booking |

The guest verification flow uses `backend/api/guest_send_otp.php`, `backend/api/guest_verify_otp.php`, `backend/otp_provider.php`, and `backend/sms_gateway_private.php`. OTPs are time-limited. **IPROG accepting a request does not prove SMS delivery**; check the provider dashboard for pending/delivered/failed status. Avoid repeated resend attempts while delivery is pending because they may consume credits. If delivery is delayed beyond the OTP validity window, a new code may be needed.

## Main functionality

- **Public/guest:** request appointment without an account, select specialty/doctor/date/time, verify mobile number with SMS OTP, receive a tracking reference, and track or cancel eligible appointments.
- **Patient:** registration/login, dashboard, appointment booking and history, notifications, follow-up information, profile/settings, and appointment slip where available.
- **Doctor:** appointment review/acceptance/decline, consultation status, schedules, leave requests, and follow-up advice.
- **Coordinator:** appointment oversight, patient queue/check-in, doctor availability, schedule/leave handling, and appointment management.
- **Supporting modules:** doctor schedule requests, appointment waitlist, reschedule history, notifications, activity logs, messaging, and appointment email reminder fields in the database.

Feature availability depends on the imported schema, account role, and configured external services. Test all presentation workflows on the actual machine.

## Database and project files

- `klinika_consulta_MERGED.sql` — fresh database import; leader-based merged schema/data.
- `backend/db.php` — database connection.
- `backend/config.example.php` — safe template for SMTP configuration.
- `backend/sms_gateway_private.example.php` — safe template for private IPROG SMS integration.
- `backend/otp_provider.php` — verification backend.
- `backend/api/` — API endpoints for the application.
- `index.html`, `js/`, `css/`, `assets/` — frontend.
- `vendor/` — bundled PHP runtime dependencies.
- `setup_reminders.bat` — optional local reminder task setup; review before running.

## Demo accounts

The SQL dump contains demonstration accounts. Examples from the leader's database include `patient1`, `coordinator1`, and `doctor1`. **Passwords are not printed in this README**; obtain the correct test credentials from your team or reset them locally. Do not use shared demo credentials in production.

## Security and sharing

- Never include real `backend/config.php` or `backend/sms_gateway_private.php` in shared ZIPs, Git repositories, screenshots, or submissions.
- `.gitignore` excludes those private files; check Git tracking before committing, because `.gitignore` does not untrack previously committed files.
- Rotate any API token or SMTP password that was previously exposed.
- SMS sender names (e.g. a custom clinic name) require provider/network support and possibly approval or fees; the sender name cannot be guaranteed by editing the PHP message alone.
- Do not publish local demo credentials, real patient data, OTP records, or database dumps containing personal information.
- Remove or restrict local-only migration/setup endpoints before deploying to public hosting.

## Troubleshooting

| Issue | What to check |
| --- | --- |
| `#1146 Table ... doesn't exist` | The database is incomplete or a schema patch was imported before the base tables. Start from a backed-up **empty test database** and import the full merged SQL. |
| `Table already exists` | Do not import a full dump into a populated database. Use an empty test database or prepare a separately reviewed migration. |
| `Access denied` / database connection error | XAMPP MySQL status, database name, credentials and `backend/db.php`. |
| Email OTP not received | `backend/config.php`, verified SMTP sender, SMTP connectivity, spam folder and provider logs. |
| SMS OTP not received | Private IPROG token, PHP cURL, SMS credits, phone number, and IPROG delivery status. Pending is not delivered. |
| OTP expired | Request a new code after confirming the old request status; avoid unnecessary repeated sends. |
| Missing private config | Create the two private files from their `.example.php` templates on the local machine. |

## Before group presentation

Confirm: (1) Apache/MySQL start, (2) database import succeeds, (3) each role can log in, (4) doctor IDs and schedules match the imported data, (5) guest SMS OTP arrives or its external-delivery limitation is explained, (6) required registration/recovery emails work, (7) booking and appointment status updates work, and (8) no private credentials are in the ZIP.

**Testing status:** ZIP packaging and file presence can be checked offline; real database execution, SMTP delivery, SMS delivery and end-to-end browser flows require testing in your XAMPP environment.

## Final verification rules (October 2026)

- Guest bookings **require SMS OTP** sent to the guest mobile number via IPROG; email is optional and does not trigger guest email OTP.
- Patient registration **requires a verified email address via email OTP**; it is needed for password recovery.
- Forgot password sends an **email OTP** to the verified registered email.
- Logged-in patient bookings require **no extra OTP**.
- SMS delivery is handled by the private IPROG adapter and may remain pending at the provider.
- Existing guest-claiming workflow may still use email verification; this is distinct from new guest booking.

## Changes in this improved package

- Private credentials (`backend/config.php`, `backend/sms_gateway_private.php`) were removed from the ZIP. Recreate them from the `.example.php` templates. Any credential that was previously shared (SMTP login/password, IPROG token) must be **rotated**.
- Added `backend/config.example.php` and `backend/sms_gateway_private.example.php`, as referenced by the setup steps above.
- The full schema check in `backend/db.php` now runs only when the file changes or the core tables are missing, instead of on every API request. Schema errors are written to the PHP error log instead of being silently ignored.
- `backend/.htaccess` blocks direct browser access to private files and `jobs/` scripts. `.gitignore` also excludes the local schema stamp.
- The working IPROG adapter in your private `sms_gateway_private.php` must be restored locally from your own copy; the template only contains a placeholder.
