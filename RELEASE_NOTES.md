# Klinika Consulta — pre-SMS testing release

This release packages the latest guest-linking/coordinator-verification changes, logout theme reset, 26 demo specialties, forgot-password email OTP, appointment workflows, and the clean demo database. **SMS OTP is not integrated**; no SMS provider credentials or credits are required.

## Safe install
1. Back up the current `C:\xampp\htdocs\klinika_consulta` directory and export `klinika_consulta_db` before replacing anything.
2. Extract the project to `C:\xampp\htdocs\klinika_consulta`.
3. For a completely fresh demonstration, create an **empty** `klinika_consulta_db` database in phpMyAdmin and import `klinika_consulta_db_fresh.sql`. This removes prior appointments if you replace your original database. Never import the fresh dump over populated tables.
4. Configure private `backend/config.php` with your own Brevo SMTP credentials (never commit or share them). Verify PHP extensions and email delivery locally.
5. Visit `http://localhost/klinika_consulta/` and follow `DEFENSE_CHECKLIST.md`.
6. Configure `setup_reminders.bat` separately for scheduled in-app reminders; without a scheduler, reminders do not run automatically.

## Limitations and validation
- The PHP/JavaScript source can pass syntax checks without guaranteeing that XAMPP, SMTP, SQL import, and browser workflows will work. Test each flow on the presentation laptop.
- Self-service guest linking requires a matching registered name, phone, booking email, verified guest booking and fresh email OTP. If names differ, use coordinator-assisted verified linking rather than bypassing identity checks.
- The new doctors are **fictional demo data**.
- SMS OTP, SMS notifications, and IPROG SMS balance integration are **not included**. Keep any future SMS API key server-side and private.
