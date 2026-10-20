# Klinika Consulta — Monday presentation checklist

## Installation (DO NOT overwrite live patient records)
1. Back up `C:\xampp\htdocs\klinika_consulta` and export `klinika_consulta_db` in phpMyAdmin.
2. Extract this ZIP so the folder is `C:\xampp\htdocs\klinika_consulta`.
3. Preserve your own PRIVATE `backend/config.php` (working SMTP credentials). This ZIP includes only placeholders.
4. If the 26-specialty migration has **not** been imported, select `klinika_consulta_db` in phpMyAdmin and import `klinika_consulta_migration.sql` once. The migration adds specialties, demo doctors, and account-recovery tables. Do not import the older full database dump over real data.
5. Start Apache and MySQL. Open `http://localhost/klinika_consulta/`.
6. For hourly 12h reminders and 24h escalations, run `setup_reminders.bat` as the local Windows user, then verify the task in Windows Task Scheduler. The scheduler needs XAMPP MySQL running.

## Live defense sequence (use test data)
1. Public homepage: show visible 911 notice and offline images.
2. Guest: choose complaint, confirm suggested specialty, book with verified email, save reference code, track status.
3. Doctor: log in as doctor for that specialty, accept the forwarded appointment. Status becomes Booked.
4. Coordinator: check in patient, show queue, handle declined appointment using earliest matching doctor/slot recommendations, complete visit.
5. Doctor: record follow-up advice; patient checks history.
6. Patient: register with email OTP; log in; use verified Link Guest Appointment to claim eligible earlier guest booking.
7. Forgot Password: demonstrate with a test patient who has verified recovery email.
8. Walk-in: coordinator creates appointment, verifies identity in person and uses the linking action. For verified email bookings, demonstrate email OTP claim.
9. Doctor directory: show 26 specialties (only after migration) and demo doctors/schedules.
10. Notifications and coordinator/doctor/patient dashboards.

## Important limitations — disclose honestly
- No real SMS OTP: email OTP uses configured SMTP; SMS provider and paid credits are not supplied.
- No automated clinical diagnosis: complaint-to-specialty mapping is guidance, not medical advice.
- The 12h/24h scheduler creates in-app notifications; it is NOT automatic SMS or email delivery.
- Fictional demo doctors are for presentation only and must not be represented as real medical professionals.
- We cannot run or verify your local XAMPP SMTP, database, or Task Scheduler from the ZIP. Test the complete sequence on your laptop.
- Password recovery requires an already verified email. No unsafe phone-only password reset.

## Troubleshooting
- Missing specialty/doctor? Check migration in phpMyAdmin and refresh.
- Email OTP fails? Check SMTP settings and Brevo sender verification in PRIVATE `backend/config.php`, and check Apache PHP error log.
- Missing image? Check `assets/clinic-care.svg` and `assets/clinic-consult.svg`.
- No reminders? Check Windows Task Scheduler history, PHP CLI path and MySQL service.
- Reassignment suggestions missing? The UI falls back to manual same-specialty selection. Check endpoint `backend/api/reassignment_suggestions.php` while logged in as coordinator.
