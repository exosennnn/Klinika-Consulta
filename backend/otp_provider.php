<?php
$localConfig = __DIR__ . '/config.php';
if (is_file($localConfig)) require_once $localConfig;

function dm_cfg(string $name): string {
    if (defined($name)) return trim((string)constant($name));
    $v = getenv($name);
    return $v === false ? '' : trim((string)$v);
}
function dm_http_post(string $url, array $headers, string $body): array {
    if (!function_exists('curl_init')) return [false, 'PHP cURL is not enabled.'];
    $ch = curl_init($url);
    curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>$headers,CURLOPT_POSTFIELDS=>$body,CURLOPT_TIMEOUT=>15]);
    $out=curl_exec($ch); $err=curl_error($ch); $code=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
    return [$out!==false && $code>=200 && $code<300, $err ?: (string)$out];
}
function dm_send_email_otp(string $to, string $code): array {
    $host = dm_cfg('KLINIKA_SMTP_HOST');
    $user = dm_cfg('KLINIKA_SMTP_USERNAME');
    $pass = dm_cfg('KLINIKA_SMTP_PASSWORD');
    $from = dm_cfg('KLINIKA_EMAIL_FROM');
    $port = (int)(dm_cfg('KLINIKA_SMTP_PORT') ?: '587');
    if (!$host || !$user || !$pass || !$from) {
        return [false, 'Email OTP is not configured. Set SMTP credentials in backend/config.php.'];
    }
    $autoload = __DIR__ . '/../vendor/autoload.php';
    if (!is_file($autoload)) {
        return [false, 'PHPMailer is not installed. Run composer install in the project folder.'];
    }
    require_once $autoload;
    if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
        return [false, 'PHPMailer dependency is missing. Run composer install.'];
    }
    if (!filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        return [false, 'Invalid sender or recipient email address.'];
    }
    $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mailer->isSMTP();
        $mailer->Host = $host;
        $mailer->SMTPAuth = true;
        $mailer->Username = $user;
        $mailer->Password = $pass;
        $mailer->Port = $port;
        $mailer->SMTPSecure = $port === 465
            ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom($from, dm_cfg('KLINIKA_EMAIL_FROM_NAME') ?: 'Klinika Consulta');
        $mailer->addAddress($to);
        $mailer->Subject = 'Your Klinika Consulta verification code';
        $mailer->isHTML(true);
        $safeCode = htmlspecialchars($code, ENT_QUOTES, 'UTF-8');
        $mailer->Body = '<h2>Klinika Consulta</h2><p>Your verification code is:</p>'
            . '<p style="font-size:28px;font-weight:bold;letter-spacing:4px">' . $safeCode . '</p>'
            . '<p>This code expires in 5 minutes. Do not share it.</p>';
        $mailer->AltBody = "Your Klinika Consulta verification code is $code. It expires in 5 minutes. Do not share it.";
        $mailer->send();
        return [true, 'Verification code sent by email.'];
    } catch (\PHPMailer\PHPMailer\Exception $e) {
        error_log('Klinika SMTP delivery failed: ' . $e->getMessage());
        return [false, 'Could not send verification email. Check SMTP settings and server logs.'];
    }
}
function dm_send_email_reminder(string $to, string $referenceCode, string $date, string $time): array {
    $host = dm_cfg('KLINIKA_SMTP_HOST');
    $user = dm_cfg('KLINIKA_SMTP_USERNAME');
    $pass = dm_cfg('KLINIKA_SMTP_PASSWORD');
    $from = dm_cfg('KLINIKA_EMAIL_FROM');
    $port = (int)(dm_cfg('KLINIKA_SMTP_PORT') ?: '587');
    if (!$host || !$user || !$pass || !$from || !filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        error_log('Klinika SMTP reminder delivery failed: SMTP configuration or recipient is invalid.');
        return [false, 'Could not send appointment reminder email. Check SMTP settings and server logs.'];
    }

    try {
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (!is_file($autoload)) {
            error_log('Klinika SMTP reminder delivery failed: PHPMailer autoloader is missing.');
            return [false, 'Could not send appointment reminder email. Check SMTP settings and server logs.'];
        }
        require_once $autoload;
        if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
            error_log('Klinika SMTP reminder delivery failed: PHPMailer dependency is missing.');
            return [false, 'Could not send appointment reminder email. Check SMTP settings and server logs.'];
        }

        $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = $host;
        $mailer->SMTPAuth = true;
        $mailer->Username = $user;
        $mailer->Password = $pass;
        $mailer->Port = $port;
        $mailer->SMTPSecure = $port === 465
            ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom($from, dm_cfg('KLINIKA_EMAIL_FROM_NAME') ?: 'Klinika Consulta');
        $mailer->addAddress($to);
        $mailer->Subject = 'Appointment reminder: ' . preg_replace('/[\r\n]+/', '', $referenceCode);
        $mailer->isHTML(false);
        $mailer->Body = "Klinika Consulta appointment reminder\n\n"
            . "Reference code: $referenceCode\n"
            . "Date: $date\n"
            . "Time: $time\n\n"
            . "To check this appointment, use Track Appointment on the Klinika Consulta website "
            . "with the reference code and the contact number you provided when booking.";
        $mailer->send();
        return [true, 'Appointment reminder email sent.'];
    } catch (\Throwable $e) {
        error_log('Klinika SMTP reminder delivery failed. See mail server logs for details.');
        return [false, 'Could not send appointment reminder email. Check SMTP settings and server logs.'];
    }
}
function dm_send_email_booked_confirmation(string $to, string $referenceCode, string $date, string $time): array {
    $host = dm_cfg('KLINIKA_SMTP_HOST');
    $user = dm_cfg('KLINIKA_SMTP_USERNAME');
    $pass = dm_cfg('KLINIKA_SMTP_PASSWORD');
    $from = dm_cfg('KLINIKA_EMAIL_FROM');
    $port = (int)(dm_cfg('KLINIKA_SMTP_PORT') ?: '587');
    if (!$host || !$user || !$pass || !$from || !filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        error_log('Klinika SMTP booked confirmation failed: SMTP configuration or recipient is invalid.');
        return [false, 'Could not send appointment confirmation email. Check SMTP settings and server logs.'];
    }

    try {
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (!is_file($autoload)) {
            error_log('Klinika SMTP booked confirmation failed: PHPMailer autoloader is missing.');
            return [false, 'Could not send appointment confirmation email. Check SMTP settings and server logs.'];
        }
        require_once $autoload;
        if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
            error_log('Klinika SMTP booked confirmation failed: PHPMailer dependency is missing.');
            return [false, 'Could not send appointment confirmation email. Check SMTP settings and server logs.'];
        }

        $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = $host;
        $mailer->SMTPAuth = true;
        $mailer->Username = $user;
        $mailer->Password = $pass;
        $mailer->Port = $port;
        $mailer->SMTPSecure = $port === 465
            ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom($from, dm_cfg('KLINIKA_EMAIL_FROM_NAME') ?: 'Klinika Consulta');
        $mailer->addAddress($to);
        $safeReferenceCode = preg_replace('/[\r\n]+/', '', $referenceCode);
        $mailer->Subject = 'Appointment confirmation: ' . $safeReferenceCode;
        $mailer->isHTML(false);
        $mailer->Body = "Your Klinika Consulta appointment is confirmed.\n\n"
            . "Date: $date\n"
            . "Time: $time\n\n"
            . "To check this appointment, use Track Appointment on the Klinika Consulta website "
            . "with the reference code and the contact number you provided when booking.";
        $mailer->send();
        return [true, 'Appointment confirmation email sent.'];
    } catch (\Throwable $e) {
        error_log('Klinika SMTP booked confirmation failed. See mail server logs for details.');
        return [false, 'Could not send appointment confirmation email. Check SMTP settings and server logs.'];
    }
}

function dm_send_guest_booked_confirmation(PDO $pdo, int $appointmentId): bool {
    try {
        $pdo->beginTransaction();
        $query = $pdo->prepare("SELECT id, reference_code, email_address, appointment_date, appointment_time
            FROM appointments
            WHERE id = ? AND patient_id IS NULL AND status = 'Booked'
              AND email_address IS NOT NULL AND TRIM(email_address) <> ''
              AND contact_verified = 1 AND verification_channel = 'email'
              AND booked_email_sent_at IS NULL
            FOR UPDATE");
        $query->execute([$appointmentId]);
        $appointment = $query->fetch(PDO::FETCH_ASSOC);
        if (!$appointment || trim((string)$appointment['reference_code']) === '') {
            $pdo->commit();
            return false;
        }

        [$sent] = dm_send_email_booked_confirmation(
            (string)$appointment['email_address'],
            (string)$appointment['reference_code'],
            (string)$appointment['appointment_date'],
            substr((string)$appointment['appointment_time'], 0, 5)
        );
        if (!$sent) {
            error_log('[Klinika Consulta] Booked confirmation email was not sent for appointment #' . $appointmentId . '.');
            $pdo->rollBack();
            return false;
        }

        $markSent = $pdo->prepare('UPDATE appointments SET booked_email_sent_at = NOW() WHERE id = ? AND booked_email_sent_at IS NULL');
        $markSent->execute([$appointmentId]);
        if ($markSent->rowCount() !== 1) {
            throw new RuntimeException('Booked confirmation email sent marker was not saved.');
        }
        $pdo->commit();
        return true;
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('[Klinika Consulta] Booked confirmation email failed for appointment #' . $appointmentId . '.');
        return false;
    }
}
function dm_send_email_followup_notice(string $to, string $referenceCode): array {
    $host = dm_cfg('KLINIKA_SMTP_HOST');
    $user = dm_cfg('KLINIKA_SMTP_USERNAME');
    $pass = dm_cfg('KLINIKA_SMTP_PASSWORD');
    $from = dm_cfg('KLINIKA_EMAIL_FROM');
    $port = (int)(dm_cfg('KLINIKA_SMTP_PORT') ?: '587');
    if (!$host || !$user || !$pass || !$from || !filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        error_log('Klinika SMTP follow-up notice failed: SMTP configuration or recipient is invalid.');
        return [false, 'Could not send follow-up notice email. Check SMTP settings and server logs.'];
    }

    try {
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (!is_file($autoload)) {
            error_log('Klinika SMTP follow-up notice failed: PHPMailer autoloader is missing.');
            return [false, 'Could not send follow-up notice email. Check SMTP settings and server logs.'];
        }
        require_once $autoload;
        if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
            error_log('Klinika SMTP follow-up notice failed: PHPMailer dependency is missing.');
            return [false, 'Could not send follow-up notice email. Check SMTP settings and server logs.'];
        }

        $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = $host;
        $mailer->SMTPAuth = true;
        $mailer->Username = $user;
        $mailer->Password = $pass;
        $mailer->Port = $port;
        $mailer->SMTPSecure = $port === 465
            ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom($from, dm_cfg('KLINIKA_EMAIL_FROM_NAME') ?: 'Klinika Consulta');
        $mailer->addAddress($to);
        $safeReferenceCode = preg_replace('/[\r\n]+/', '', $referenceCode);
        $mailer->Subject = $safeReferenceCode;
        $mailer->isHTML(false);
        $mailer->Body = "The doctor has added follow-up advice for reference code $safeReferenceCode. "
            . "Use Track Appointment on the Klinika Consulta website with the reference code and contact number to view it.";
        $mailer->send();
        return [true, 'Follow-up notice email sent.'];
    } catch (\Throwable $e) {
        error_log('Klinika SMTP follow-up notice failed. See mail server logs for details.');
        return [false, 'Could not send follow-up notice email. Check SMTP settings and server logs.'];
    }
}

function dm_send_guest_followup_notice(PDO $pdo, int $appointmentId): bool {
    try {
        $pdo->beginTransaction();
        $query = $pdo->prepare("SELECT id, reference_code, email_address
            FROM appointments
            WHERE id = ? AND patient_id IS NULL AND followup_timeframe IS NOT NULL
              AND TRIM(followup_timeframe) <> ''
              AND email_address IS NOT NULL AND TRIM(email_address) <> ''
              AND contact_verified = 1 AND verification_channel = 'email'
              AND followup_email_sent_at IS NULL
            FOR UPDATE");
        $query->execute([$appointmentId]);
        $appointment = $query->fetch(PDO::FETCH_ASSOC);
        if (!$appointment || trim((string)$appointment['reference_code']) === '') {
            $pdo->commit();
            return false;
        }

        [$sent] = dm_send_email_followup_notice(
            (string)$appointment['email_address'],
            (string)$appointment['reference_code']
        );
        if (!$sent) {
            error_log('[Klinika Consulta] Follow-up notice was not sent for appointment #' . $appointmentId . '.');
            $pdo->rollBack();
            return false;
        }

        $markSent = $pdo->prepare('UPDATE appointments SET followup_email_sent_at = NOW() WHERE id = ? AND followup_email_sent_at IS NULL');
        $markSent->execute([$appointmentId]);
        if ($markSent->rowCount() !== 1) {
            throw new RuntimeException('Follow-up notice sent marker was not saved.');
        }
        $pdo->commit();
        return true;
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('[Klinika Consulta] Follow-up notice failed for appointment #' . $appointmentId . '.');
        return false;
    }
}
function dm_send_sms_otp(string $number,string $code): array {
    $key=dm_cfg('KLINIKA_SEMAPHORE_API_KEY');
    if($key==='') return [false,'SMS OTP is not configured yet. Add Semaphore credentials in backend/config.php, or choose email verification.'];
    $fields=['apikey'=>$key,'number'=>$number,'message'=>"Klinika Consulta verification code: $code. It expires in 5 minutes."];
    $sender=dm_cfg('KLINIKA_SEMAPHORE_SENDER'); if($sender!=='')$fields['sendername']=$sender;
    [$ok,$info]=dm_http_post('https://api.semaphore.co/api/v4/messages',['Content-Type: application/x-www-form-urlencoded'],http_build_query($fields));
    return [$ok,$ok?'Verification code sent by SMS.':'SMS provider error: '.$info];
}
