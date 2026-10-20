q# KLINIKA CONSULTA — START HERE

## Install a clean DEMO database

1. Export and back up the current `klinika_consulta_db` database and project folder first. The clean demo SQL intentionally contains no old appointments.
2. Stop any open browser sessions and make a fresh empty `klinika_consulta_db` database in phpMyAdmin. **Do not import into a populated database**; use a separate demo database if preserving current data.
3. Import **only** `klinika_consulta_db_fresh.sql` from this ZIP. Do **not** also import the migration file.
4. Extract the folder to `C:\xampp\htdocs\klinika_consulta`. Confirm the URL `http://localhost/klinika_consulta/`.
5. Keep your own private `backend/config.php` (with working SMTP login/key). The distributed copy is only a placeholder. Never share SMTP keys or patient information.
6. Start Apache and MySQL, then refresh your browser (Ctrl+F5).
7. Test patient, doctor, coordinator logins and the booking workflow **before** the presentation.

## Registration / Email OTP

- Email is optional at registration. If an email is entered, click **Verify Email** and complete OTP verification before Create Account.
- Forgot Password works only for patient accounts with a verified email.
- Email OTP delivery requires configured SMTP and internet access. SMS OTP is **not** enabled.

## Feature boundaries

- The 26 specialties include **fictional demo doctors**; do not claim they are real doctors. Each specialty has an additional doctor for coordinator reassignment, with a linked `dr_first_last` demo account and initial password `123456`; change demo credentials before deployment.
- 911 emergency banner is a safety notice, not emergency dispatch.
- Complaint suggestions guide specialty choice; they do not diagnose patients.
- The hourly reminder/escalation job produces **in-app** notifications and requires `setup_reminders.bat` to be configured; it does not send SMS.
- Coordinator walk-in linking needs staff identity checks. Patients with a previously verified email may use the guest claim email-OTP flow where eligible.
- A clean SQL import and a ZIP syntax check are not proof that SMTP, XAMPP, or every UI flow works. Use `DEFENSE_CHECKLIST.md` for manual acceptance tests.

## Presentation rehearsal

1. Show homepage, emergency banner, specialty guidance.
2. Register a new patient with a verified email, then log in.
3. Book a future available slot and save the reference code.
4. Log in as the assigned doctor and accept the request (Booked).
5. Log in as coordinator and check the patient in.
6. Complete consultation, add follow-up advice, show patient history.
7. Separately demonstrate doctor decline and coordinator reassignment.
8. Separately demonstrate Forgot Password and walk-in linking using demo-only patient data.

## If something fails

- SMTP: verify your private `backend/config.php`, sender settings and spam folder.
- Database: verify `klinika_consulta_db` selected and fresh SQL imported once.
- Slot unavailable: use a different future date/doctor and verify schedules, leaves and blockouts.
- Reassignment: select an eligible same-specialty doctor and recheck availability.
- MySQL down: do not repeatedly delete data folders; preserve a backup and inspect MariaDB logs.
