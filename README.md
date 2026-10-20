# READ THIS FIRST — MONDAY DEFENSE BUILD (2026-10-10)

**Current source of truth:** `START_HERE.md` and `DEFENSE_CHECKLIST.md`. Sections farther below are retained as historical development notes and can describe superseded states (e.g., older statements that OTP is disabled or walk-in linking is not implemented). **Do not use those old statements as current feature status.**

**Current behavior:** Email OTP requires private SMTP credentials; SMS OTP is not active. Patient registration can omit email, but providing an email requires OTP verification. Forgot Password requires a previously verified email. Walk-in linking is coordinator-assisted and requires in-person identity confirmation plus exact name/phone matching. Complaint matching is advisory, not diagnosis. Scheduler needs Windows Task Scheduler setup.

---

# Klinika Consulta

Clinic appointment and patient-flow management system built with PHP, MySQL, JavaScript/Vue, and CSS. Supports guest appointment requests and role-based portals for patients, doctors, and coordinators.

## Quick setup (XAMPP)

1. Extract the `klinika_consulta` folder into `C:\xampp\htdocs\` (avoid mixing files from older versions).
2. Start Apache and MySQL. PHP 8.0+ is recommended.
3. Import the separately supplied `klinika_consulta_db.sql` using phpMyAdmin if setting up a fresh database. **Back up existing data before importing or replacing a database.**
4. Open `http://localhost/klinika_consulta/`.
5. Check database credentials in `backend/db.php` if your MySQL setup differs. The application also has database migration/initialization logic; review it before using a database containing real records.
6. Do not expose `backend/migrate.php` on public hosting; remove it after any necessary local migration.

Local demonstration accounts listed in the original project: `patient1`, `coordinator1`, `doctor1`; password `123456`. Change demo credentials before deployment. Confirm they exist in the imported database.

## Complete user flows

### A. Public visitor / guest appointment request

1. Open Home → **Request an Appointment**; no account is required.
2. Enter patient details and a required Philippine mobile number; email is optional.
3. Select specialty, doctor, preferred date and available time, and provide the visit reason as requested by the form.
4. Review and submit. The backend checks required fields, schedule eligibility, slot conflicts, and guest duplicate-request restrictions.
5. Receive a **Tracking Code**. A submitted request is **Pending** until reviewed by the doctor; it is not automatically a confirmed visit.
6. Use the header **Track Appointment** button (a working UI button/widget, **not an image**) to look up the request with Tracking Code plus the phone number supplied during booking.
7. The patient sees the current status. After the doctor accepts, the appointment becomes **Booked** without a mandatory coordinator relay.
8. Guests can choose to create a patient account later for repeat visits; an account is not a prerequisite to guest booking.

**Current verification mode:** Email/SMS OTP code remains in the backend, but sending and verification are temporarily disabled because sender/provider accounts have not been configured. Do not present unverified phone ownership as verified. Actual email delivery requires PHPMailer installed through Composer and valid SMTP credentials; SMS delivery requires a provider such as Semaphore and usually paid credits.

### B. Registered patient / returning patient

1. Sign up or log in from the patient login entry point.
2. Review dashboard, profile, upcoming appointment, status timeline, notifications, and appointment history.
3. Book using the doctor schedule and available time slots; the system enforces an active-appointment restriction for account bookings.
4. Check appointment status; after acceptance it displays **Booked**.
5. Where permitted, request cancellation or rescheduling; the clinic/doctor are notified and the appointment record is updated.
6. After consultation, view doctor follow-up advice immediately. The recommended return timeframe is **not** a delay in delivering advice.
7. Review follow-up proposals and confirm or decline/request another time where those actions are offered.
8. Use messaging with the assigned doctor/clinic, print an appointment slip, and manage profile/settings where available.

### C. Doctor review and consultation

1. Log in → dashboard / My Appointments.
2. View assigned **Pending** requests and the requested time.
3. **Accept** → status becomes **Booked** immediately; the coordinator is notified for awareness. No separate relay is needed for this acceptance.
4. **Decline** → status becomes **Needs Reassignment**; the coordinator can handle replacement scheduling.
5. Review the day's schedule, leave/blockouts, and patient queue.
6. Once coordinator checks the patient in, status becomes **Checked In** and the doctor is notified.
7. After the visit, select **Consultation Done** → **Completed**.
8. Add follow-up advice/timeframe when needed; the patient and coordinator can see the advice without a one-day delivery delay.
9. Submit planned leave for coordinator review or report emergency leave through the supported doctor workflow.

### D. Coordinator / nurse appointment management

1. Log in → dashboard to review pending requests, patient queue, appointments, and notifications.
2. Monitor new requests and doctor decisions. Accepted appointments are already **Booked**; a coordinator relay is not required.
3. For **Needs Reassignment**, manually select an eligible doctor in the same specialty and a valid available slot; the new doctor reviews the reassigned request.
4. Check patients in when they arrive; manage walk-in appointments and the day's queue.
5. Handle cancellation/rescheduling and follow-up slot proposals. Follow-up proposals may still require a patient-facing relay/confirmation step; this is separate from initial doctor acceptance.
6. Manage doctor workdays, session hours, blockouts, and planned-leave approvals.
7. Use reports, activity records, and notifications to review clinic operations where available.

### E. Doctor schedules and slot conflict protection

1. Coordinator configures doctor workdays and morning/afternoon session hours in **Doctor Schedules**.
2. Available booking slots use 30-minute increments within configured clinic hours, excluding leave/blockouts and already reserved times.
3. Guest, registered patient, walk-in, follow-up, and reassignment bookings must respect doctor availability.
4. Server-side validation rejects invalid dates/times. Database uniqueness protection prevents two active appointments occupying the same doctor/date/time slot when its unique index is successfully installed.
5. When a doctor declines, the request moves to **Needs Reassignment**; the declined slot is released under the current implementation. The patient does not automatically retain that exact slot.

### F. Follow-up flow

1. Doctor completes consultation and enters follow-up advice with a recommended return period/date.
2. Advice appears for the patient immediately and the coordinator is notified.
3. Coordinator chooses an eligible follow-up slot and sends a proposed schedule to the patient.
4. Patient confirms (follow-up becomes **Booked**) or declines/requests another schedule for coordinator handling.
5. Follow-up scheduling is distinct from initial doctor acceptance; do not confuse its patient confirmation step with the removed initial acceptance relay.

### G. Walk-in flow

1. Coordinator records a walk-in and selects an available doctor/time.
2. The appointment can be created as **Booked** without a patient account (`patient_id` may be NULL).
3. Coordinator checks the patient in, doctor completes the consultation, and follow-up advice may be recorded.
4. **Limitation:** Automatic linking of an account-less walk-in to future patient-account history is not implemented/verified. Never merge people solely by name or shared phone number.

### H. Security and account handling

- Login uses password hashes, CSRF protection on protected POST requests, and failed-login throttling.
- Public tracking requires Tracking Code **and** the mobile number supplied at booking. This is a basic lookup safeguard, **not equivalent to OTP identity verification**.
- Guest requests include rate/duplicate checks. The current restriction is based on matching normalized patient name and phone across active requests, rather than a universal verified-person identifier. Shared household phones can legitimately belong to multiple people.
- Account bookings and guest bookings do **not yet** have a fully unified, verified identity-based one-active-appointment rule.
- Names/addresses alone are not reliable identity keys; do not auto-merge records based on them.
- Use HTTPS and a dedicated MySQL user before live deployment. Keep provider API keys out of Git and browser-side JavaScript.

## OTP configuration (currently disabled)

The source includes `backend/api/guest_send_otp.php`, `backend/api/guest_verify_otp.php`, and `backend/otp_provider.php`. Provider settings are in `backend/config.example.php` / `backend/config.php`.

- **Email:** Create a Brevo account, verify a sender address/domain, generate an API key, and configure the corresponding `KLINIKA_BREVO_API_KEY` and `KLINIKA_EMAIL_FROM` values in a private server-side configuration.
- **SMS:** Configure the Semaphore API key and purchase credits if activating actual SMS OTP delivery.
- Before enabling OTP, test delivery, expiration, attempt limits, resend cooldown, and recovery behavior. Do not enable the UI unless real delivery works.

## Public pages and UI

Home, About, Doctors, How It Works, and Contact are public-facing sections. The Doctors directory groups doctors by specialty and exposes public availability without exposing patient details. Public sections and signed-in dashboard pages use a subtle slide-up entrance animation; the dashboard motion respects the operating system's reduced-motion preference. Public pages, sign-in/sign-up forms, dashboards, notifications, and appointment views adapt to tablet and mobile widths. Dense appointment tables remain horizontally scrollable on small screens, and the workspace sidebar can be opened or collapsed on mobile. The **Track Appointment** control is a floating interactive control; on smaller screens it collapses to a compact button/icon to avoid obscuring content. It is not a decorative image.

## Status and implementation notes

| Area | Current behavior |
|---|---|
| Doctor accepts appointment | Immediately **Booked**; coordinator notified |
| Doctor declines | **Needs Reassignment**; coordinator manually reassigns |
| Guest booking | No login required; mobile required, email optional |
| Guest tracking | Tracking Code + booking mobile number |
| Patient account | Optional for guest booking; available for returning patients |
| OTP | Code retained; delivery/verification temporarily disabled |
| Doctor response deadline | In-app reminder after 12 hours and reassignment escalation after 24 hours; requires the scheduled job |
| Appointment reminders | In-app reminder within 24 hours for confirmed appointments linked to a patient account; requires the scheduled job |
| Suggested replacement slots | Coordinator can view ranked same-specialty openings; availability is rechecked when saving |
| Walk-in history linkage | **Not yet implemented/verified** |
| Unified guest/account identity policy | **Not yet fully implemented** |

## Project structure

- `index.html` — application entry point
- `js/template.js` — public pages and portal templates
- `js/app.js` — frontend state and actions
- `js/api.js` — API request wrapper
- `css/clinic-polish.css` — public-facing and responsive styles
- `backend/api/` — role-based PHP API endpoints
- `backend/db.php` — database connection and initialization
- `backend/otp_provider.php` — email/SMS delivery integration
- `tests/run_tests.php` and `tests/check_frontend.js` — included backend/frontend checks

## Testing and release checklist

1. Test guest request, tracking, duplicate prevention, doctor acceptance/decline, coordinator reassignment, and check-in.
2. Test patient login, booking, cancellation/rescheduling, messages, follow-up advice, and follow-up confirmation.
3. Test doctor leave/blockouts and concurrent attempts to book the same slot.
4. Verify that disabled OTP cannot be mistaken for completed contact verification.
5. Run `php tests/run_tests.php` with the test database and XAMPP running; run `node tests/check_frontend.js` if Node.js is available.
6. Review PHP logs, database migrations, and all demo credentials before deploying publicly.

## Documentation maintenance rule

**Whenever a feature is added or changed, update this README in the same change:** document the user role, trigger, step-by-step flow, resulting appointment status, notifications, security checks, and whether the feature is implemented, disabled, or planned. Update the SQL/migration instructions if the database changes. Do not claim planned features are working.

## Tracker layout update

The Track Appointment control is now in the top navigation instead of floating above the page. It opens the same working tracking interface and no longer covers footer links.


### PHPMailer SMTP setup (prepared, not yet activated)

1. In the extracted `klinika_consulta` folder run `composer install` (requires Composer and internet access). This installs PHPMailer into `vendor/`.
2. Set `KLINIKA_SMTP_HOST`, `KLINIKA_SMTP_PORT`, `KLINIKA_SMTP_USERNAME`, `KLINIKA_SMTP_PASSWORD`, and `KLINIKA_EMAIL_FROM` in `backend/config.php`. For Gmail use `smtp.gmail.com`, port `587`, your Gmail address and an eligible Google App Password (not the account password).
3. Keep `backend/config.php` and SMTP secrets out of public Git repositories.
4. **OTP is still disabled in the guest booking UI.** Once SMTP delivery is tested, enable the verification step and enforce it server-side before considering it active. Mobile is required and email remains optional; provide a clear fallback when SMS is not configured.
5. The SMS integration remains available separately through Semaphore.

**Deployment note:** The ZIP contains `composer.json`, not PHPMailer vendor source. Run `composer install` before testing email. Hosting must support outbound SMTP. No email is sent until credentials and the OTP workflow are activated.


## Email OTP — PHPMailer (current flow)

- Mobile number is required; email is optional. SMS OTP is not active.
- If a guest enters an email, the form sends a six-digit code via PHPMailer/SMTP.
- The code expires after five minutes and allows five incorrect attempts.
- The backend validates the verified token against the guest name, phone and email before booking, then consumes it.
- If email is blank, booking remains available without OTP; the contact is **unverified**. Staff should confirm identity before sensitive changes.
- Run `composer install` in the project root. Copy `backend/config.example.php` to `backend/config.php` and enter valid SMTP credentials.
- Gmail SMTP: `smtp.gmail.com`, port `587`, with an eligible Gmail App Password. Do not use your normal Gmail password.
- Without SMTP credentials, email sending will fail. Guests can omit email until the service is configured.
- SMS integration remains available in backend code but is not shown as an active verification option.
- Never commit `backend/config.php` or share SMTP credentials.


### Clinic email preconfiguration
For Brevo SMTP, use the Brevo SMTP Login and a new private Brevo SMTP key in `backend/config.php` (not a Gmail App Password). Do not commit this file. Install dependencies with `composer install` and ensure Gmail App Passwords are enabled before testing email OTP. SMS remains unconfigured.


## Brevo SMTP setup (PHPMailer email OTP)
1. Verify `klinikaconsulta@gmail.com` as an approved sender in Brevo and make sure transactional SMTP is enabled.
2. In Brevo's **SMTP & API → SMTP**, copy the **SMTP Login** and create a **new SMTP Key**. Revoke any key previously shared in chat.
3. Open `backend/config.php`. Replace only `PASTE_BREVO_SMTP_LOGIN_HERE` and `PASTE_NEW_BREVO_SMTP_KEY_HERE` with your private credentials. Do not change the sender unless Brevo authorizes another sender.
4. Run `composer install` in the project root to install PHPMailer, then start Apache/MySQL in XAMPP.
5. Test guest booking with an email address and verify the six-digit code. If no email is entered, booking remains possible without OTP while SMS is disabled.
6. Do not upload `backend/config.php` to GitHub. The file is ignored by `.gitignore`. Never share SMTP keys or passwords.
7. This package contains placeholders, **not active credentials**. Sending will work only after SMTP setup and sender approval. If SMTP delivery fails, check Apache/PHP logs and Brevo account restrictions.

## Guest tracking and account linking (October 2026 fix)

**Guest appointment tracking:** Open **Track Appointment** on the public page. Enter the exact tracking reference (e.g., `REF-XXXXXXXX`) and the phone number used at booking. The tracker accepts common Philippine mobile formats (`09...`, `639...`, `+639...`) and displays only non-sensitive appointment status information. It does not expose personal contact details or visit notes. Guests can cancel their own `Pending` or `Booked` appointment from the tracker after confirming; the doctor and coordinator are notified, and the appointment slot is released. Other statuses cannot be cancelled through the guest tracker. If a code still cannot be found, check the `appointments` table in the *same* `klinika_consulta_db` that the running app uses; compare the stored reference and phone number.

**Guest to patient account:** Creating a patient account does not automatically prove ownership of an earlier guest booking. After registering and logging in, the patient opens **Dashboard → Link Guest Appointment**, enters the original tracking code, full name, phone and verified email, and receives a fresh 6-digit email OTP. The system verifies that the guest appointment is still unlinked, its email was verified when booked, and its name and phone match the account. Once verified, the existing appointment's `patient_id` is updated, so it appears in patient appointments/history. No duplicate appointment is created. If the guest used no email or their registered details differ, a coordinator must resolve the identity discrepancy; the system deliberately does not auto-merge patients with shared family numbers.

**Doctor dashboard patient names:** The appointment's `patient_name` is the source of truth for guest bookings, not a lookup by phone number. When the same phone is used by different people, their appointments remain separate. The coordinator should review any shared-contact warning.

**Email setup:** PHPMailer requires `composer install`, an approved sender, and SMTP credentials in private `backend/config.php` (excluded from the ZIP and Git). Copy `backend/config.example.php` and fill it locally. Do not publish SMTP keys.

**Existing database:** These changes use the existing tables (`appointments`, `users`, `guest_otp_verifications`); no schema migration is needed. Keep a backup of your current SQL export before deploying. Do not re-import a demo SQL dump over real records.


## 2026-10-09 account-history UI clarification
The patient My Appointments empty state and Appointment History page offer the secure **Link Guest Appointment** action. A guest appointment is not linked by matching name/phone alone. Completed appointments appear under **Appointment History**, not My Active Appointments. Hourly in-app reminders and escalations require the separate Windows Task Scheduler setup below; ranked reassignment suggestions are available to coordinators, while walk-in identity linking remains subject to the checks described here.

## October 2026 integration additions
- Complaint-to-Specialty Picker for guest and registered patient flows: maps concerns to existing specialty names, prefills editable reason, resets patient selection on specialty changes, and warns for possible emergencies. Guidance is not a diagnosis.
- Descriptions for all 14 seeded specialties.
- `backend/api/reassignment_suggestions.php?appointment_id=ID`: coordinator-only JSON of up to 12 ranked available same-specialty doctor slots (30-day horizon). Suggestions must be rechecked at commit time.
- `backend/jobs/appointment_watch.php`: CLI-only hourly job that sends in-app reminders for confirmed, account-linked patient visits within 24 hours; reminds doctors about pending decisions after 12 hours; and escalates unreviewed requests after 24 hours. **Set up Windows Task Scheduler** with `C:\xampp\php\php.exe` and argument `C:\xampp\htdocs\klinika_consulta\backend\jobs\appointment_watch.php`. Run once per hour. The script is not scheduled automatically by extraction.
- Guest appointments with an email verified through email OTP also receive one privacy-minimal reminder email while their appointment is `Booked` and within 24 hours. Before enabling the job, run `http://localhost/klinika_consulta/backend/migrate.php` once to add `appointments.reminder_email_sent_at`. A failed send is logged and retried by a later job run.
- When a doctor accepts a guest appointment with a verified email, the system sends a privacy-minimal confirmation after the booking transaction commits. `appointments.booked_email_sent_at` records successful delivery; the hourly job retries eligible `Booked` guest confirmations after a failed send. Run the local migration once to add this column before deploying.
- When a doctor saves follow-up advice for an email-verified guest, the system sends a notice after the save commits. The email contains no advice details; the tracking endpoint exposes only `followup_timeframe`, never `followup_notes`. `appointments.followup_email_sent_at` prevents duplicate notices, including after advice edits, and the hourly job retries failed sends. Run the local migration once to add the column before deploying.
- Existing secure guest claim requires exact matching name, phone, and freshly verified email. Guest appointments are not automatically attached just because a phone number matches; this protects shared family numbers.

### Install safely
1. Back up your project and database before replacing files.
2. Keep your **existing working private `backend/config.php`** with Brevo SMTP login and key. The ZIP includes a **placeholder** config only; overwrite the placeholder with your backed-up private file. Never publish this file or share credentials.
3. Do **not** import the old SQL dump into an existing populated database. No new SQL schema is needed for these changes.
4. Configure the scheduled job and test booking, OTP, reassignment, and history in local XAMPP.
5. For defense backup, export a **sanitized** SQL dump and take screenshots of all role dashboards.

### Remaining integration limitations
Registered-patient appointment reminders are in-app only. Guest appointment email reminders require a verified booking email, SMTP configuration, and the scheduled job; OTP email and reminder email are separate messages. SMS delivery is not included. Walk-in records can be linked only when they meet the existing guest email verification requirements; walk-in appointments without a verified email need a separate coordinator-approved identity verification process. The homepage currently uses remote images and needs local replacement. These features and the end-to-end XAMPP flows are **not** claimed fully tested.

## Guest appointment reminder email
- Keep private SMTP settings in `backend/config.php` only. Required constants are `KLINIKA_SMTP_HOST`, `KLINIKA_SMTP_PORT`, `KLINIKA_SMTP_USERNAME`, `KLINIKA_SMTP_PASSWORD`, `KLINIKA_EMAIL_FROM`, and optionally `KLINIKA_EMAIL_FROM_NAME`. Use the credentials from your email provider and a sender address verified with that provider. Never commit or share `config.php`.
- The reminder contains only the clinic name, booking reference, appointment date/time, and instructions to use Track Appointment. It is sent only to guest appointments whose email verification was completed by OTP, whose status is `Booked`, and whose visit is within 24 hours.
- If reminders land in spam, first verify the sender address/domain with your SMTP provider. Publish the provider-recommended SPF and DKIM DNS records and configure DMARC for the sender domain; align the From domain with the authenticated sending domain where possible. Check the provider's delivery/bounce logs and recipient spam/quarantine settings. Avoid sending to unverified addresses.

## Operations, backups, and restore
- Before an update or migration, export the live database and preserve the project files plus the private `backend/config.php` in access-controlled storage. Never put real patient data or credentials in a public repository or demo backup.
- For local XAMPP, export `klinika_consulta_db` using phpMyAdmin **Export → Quick → SQL** or `C:\xampp\mysql\bin\mysqldump.exe -u root klinika_consulta_db > C:\secure-backups\klinika_consulta.sql` (adjust the account, password handling, and paths to match your local setup).
- Verify a backup by restoring it to a separate test database and checking login, appointment history, schedules, and notifications before relying on it. Do not test restoration over the live clinic database.
- Store encrypted backups outside the web root, restrict access, retain them only as long as clinic policy requires, and schedule routine exports through the hosting environment. This repository does not install a backup schedule or cloud storage integration.
- Activity logs record selected coordinator/appointment actions; they are not a complete immutable audit trail. Follow the clinic's retention and access policies, and arrange production backups, monitoring, and recovery with the system administrator.


## 2026 expanded specialties and account recovery
1. Back up the live database. Import `klinika_consulta_migration.sql` into the existing `klinika_consulta_db` **once**; do NOT re-import a full dump over your live data.
2. Copy the project to `C:\xampp\htdocs\klinika_consulta` and preserve your **private** working `backend/config.php`.
3. The migration adds 12 **fictional demonstration** specialties/doctors and demo doctor accounts (password `DemoClinic2026!`; CHANGE before public deployment). Demo doctors are not real providers.
4. Patients may register with a verified email via Email OTP. Email is optional, but Forgot Password works **only** for accounts with a verified email; older accounts need an administrator-assisted verified enrollment process, not a phone-only reset.
5. Coordinators can link walk-in history via the appointment action after in-person identity checks; name and mobile must match the registered patient account. For walk-ins with a previously verified booking email, patients can use the existing Email OTP guest-claim workflow.
6. The system has not been end-to-end tested against your running XAMPP instance. Configure hourly reminder scheduler separately and test before defense.

## Presentation readiness update (2026-10-10)
- Permanent visible **911 emergency guidance** on public pages and signed-in pages; appointment booking is explicitly non-emergency.
- **Coordinator smart reassignment** now surfaces ranked same-specialty open-slot recommendations in the reassignment dialog; manual same-specialty choice remains available. Backend rechecks availability before saving.
- Homepage/about now use **bundled local SVG clinic illustrations** (offline-compatible), replacing remote Unsplash URLs. These are illustrations, not photographic images.
- `setup_reminders.bat` helps create an hourly Windows scheduled task; the job produces in-app reminders and escalation, not SMS.
- See `DEFENSE_CHECKLIST.md` for safe installation, demo flow, and known limitations.
- Do not promise fully tested production readiness until XAMPP, SMTP and DB end-to-end checks have passed on the presenting laptop.
