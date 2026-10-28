KLINIKA CONSULTA — PRIVATE SETUP (LOCAL MACHINE ONLY)

1. Import klinika_consulta_MERGED.sql into a NEW EMPTY TEST database. Back up existing databases.
2. Copy backend/config.example.php to backend/config.php and set private SMTP credentials.
3. Copy backend/sms_gateway_private.example.php to backend/sms_gateway_private.php and set a NEW IPROG token.
4. Never share or commit the filled-in private files. Rotate any previously exposed credentials.
5. Guest bookings: SMS OTP. Registration/password recovery: email verification. Logged-in booking: no extra OTP. Guest email: optional.
6. IPROG acceptance is not proof of SMS delivery; check its delivery status.
7. Review README.md for installation, SQL merge notes, role features, and troubleshooting.
8. Test end-to-end in XAMPP before group submission or presentation.
