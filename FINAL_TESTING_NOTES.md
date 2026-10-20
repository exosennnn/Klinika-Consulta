# Klinika Consulta — Final Testing Notes

## What changed in this build
- Coordinator can link an unclaimed **guest or walk-in** booking to a registered patient when self-service email verification cannot link it (for example, abbreviated guest name vs. full registered name).
- Coordinator must verify the patient in person, know the reference code, match the registered phone to the booking phone, and enter a verification note. The action is recorded in activity logs. No automatic fuzzy-name linking was introduced.
- Existing self-service guest claim still requires exact registered identity plus fresh email OTP; use the coordinator-assisted workflow for discrepancies.
- Shared-browser theme preference resets to dark on logout (retained from previous build).

## How to test guest claim
1. Register a patient with the same mobile number as the guest booking.
2. If the guest name and account name match exactly, use **Link a previous guest appointment** and verify the guest booking email OTP.
3. If names differ, log in as coordinator, find the guest booking, choose **Link Guest / Walk-in History**, enter the patient username, verify the patient identity in person, and enter a note.
4. Log in as the patient and check appointment/history visibility.
5. Confirm a second patient cannot claim the same booking.

## Before Monday
- Import `klinika_consulta_db_fresh.sql` only for a **new empty database**. Never reimport it over a database containing actual records.
- Restore your private backend/config.php locally. Do not share API keys or SMTP credentials.
- Verify all role logins, OTP email delivery, password reset, appointment booking, doctor acceptance, coordinator check-in, completion, follow-up, and reassignment on your XAMPP computer.
- For SMS OTP: **not connected** in this build. The working implementation uses email OTP. Do not tell the panel SMS OTP is active.
- Reminder automation requires running `setup_reminders.bat` with Windows Task Scheduler as documented.

## SMS API security
If you add SMS later, keep the SMS API key server-side in private config; never include it in JavaScript, public GitHub, a shared ZIP, or a group-chat screenshot. Provider balances/top-ups are visible to people with access to the provider account or to a balance API key, not automatically to ordinary users of Klinika Consulta. Do not expose a credit-balance endpoint to patient, doctor, or coordinator roles.
