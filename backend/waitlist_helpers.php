<?php
require_once __DIR__ . '/otp_provider.php';

function waitlist_slot_problem(PDO $pdo, int $doctorId, string $date, string $time): ?string {
    if (!in_array($time, clinic_slots(), true)) {
        return 'Choose a scheduled 30-minute appointment time.';
    }
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date || $date < date('Y-m-d') || $date > date('Y-m-d', strtotime('+90 days'))) {
        return 'Choose a date within the next 90 days.';
    }
    if ($date === date('Y-m-d') && $time <= date('H:i:s')) {
        return 'That appointment time has already passed.';
    }

    $doctor = $pdo->prepare("SELECT available_days, work_schedule FROM doctors WHERE id = ? AND status = 'Active'");
    $doctor->execute([$doctorId]);
    $row = $doctor->fetch();
    if (!$row) return 'Doctor not found.';

    $weekday = (int)$parsed->format('N');
    if (!in_array($weekday, doctor_workdays($row['available_days']), true) ||
        !in_array($time, doctor_day_slots(doctor_schedule($row['work_schedule']), $weekday), true)) {
        return 'That time is outside the doctor’s scheduled work hours.';
    }
    $blocked = $pdo->prepare('SELECT COUNT(*) FROM doctor_blockouts WHERE doctor_id = ? AND block_date = ?');
    $blocked->execute([$doctorId, $date]);
    if ((int)$blocked->fetchColumn() > 0) return 'The doctor is not available on that date.';

    return null;
}

function offer_waitlist_for_slot(PDO $pdo, int $doctorId, string $date, string $time, int $attempt = 0): void {
    $candidate = null;
    $doctorName = '';
    try {
        $pdo->beginTransaction();
        $lock = $pdo->prepare("SELECT name FROM doctors WHERE id = ? AND status = 'Active' FOR UPDATE");
        $lock->execute([$doctorId]);
        $doctorName = (string)$lock->fetchColumn();
        if ($doctorName === '' || waitlist_slot_problem($pdo, $doctorId, $date, $time) !== null) {
            $pdo->commit();
            return;
        }

        $occupied = $pdo->prepare("SELECT COUNT(*) FROM appointments
            WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
              AND status NOT IN ('Cancelled','Needs_Reassignment')");
        $occupied->execute([$doctorId, $date, $time]);
        if ((int)$occupied->fetchColumn() > 0) {
            $pdo->commit();
            return;
        }

        $pdo->prepare("UPDATE appointment_waitlist SET status = 'Waiting', offer_token_hash = NULL,
            offered_at = NULL, expires_at = NULL, created_at = NOW()
            WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
              AND status = 'Offered' AND expires_at < NOW()")
            ->execute([$doctorId, $date, $time]);

        $next = $pdo->prepare("SELECT * FROM appointment_waitlist
            WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status = 'Waiting'
            ORDER BY created_at, id LIMIT 1 FOR UPDATE");
        $next->execute([$doctorId, $date, $time]);
        $candidate = $next->fetch();
        if (!$candidate) {
            $pdo->commit();
            return;
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $pdo->prepare("UPDATE appointment_waitlist SET status = 'Offered', offer_token_hash = ?,
            offered_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ? AND status = 'Waiting'")
            ->execute([$tokenHash, (int)$candidate['id']]);
        $candidate['offer_token'] = $token;
        if (!empty($candidate['patient_id'])) {
            notify($pdo, 'patient', (int)$candidate['patient_id'], 'Waitlist slot available',
                "A slot with $doctorName is available on $date at " . substr($time, 0, 5) . '. Open Booking to claim it within 30 minutes.');
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('[Klinika Consulta] Waitlist offer failed: ' . $e->getMessage());
        return;
    }

    if ($candidate && empty($candidate['patient_id'])) {
        [$sent, $message] = dm_send_email_waitlist_offer(
            (string)$candidate['guest_email'],
            $doctorName,
            $date,
            substr($time, 0, 5),
            (string)$candidate['offer_token']
        );
        if (!$sent) {
            $pdo->prepare("UPDATE appointment_waitlist SET status = 'Waiting', offer_token_hash = NULL,
                offered_at = NULL, expires_at = NULL, created_at = NOW()
                WHERE id = ? AND status = 'Offered' AND offer_token_hash = ?")
                ->execute([(int)$candidate['id'], hash('sha256', (string)$candidate['offer_token'])]);
            error_log('[Klinika Consulta] Waitlist offer email failed: ' . $message);
            if ($attempt < 4) offer_waitlist_for_slot($pdo, $doctorId, $date, $time, $attempt + 1);
        }
    }
}

function expire_waitlist_offers(PDO $pdo): void {
    $slots = $pdo->query("SELECT DISTINCT doctor_id, appointment_date, appointment_time
            FROM appointment_waitlist WHERE status = 'Offered' AND expires_at < NOW()")->fetchAll();
    $pdo->exec("UPDATE appointment_waitlist SET status = 'Waiting', offer_token_hash = NULL,
            offered_at = NULL, expires_at = NULL, created_at = NOW()
            WHERE status = 'Offered' AND expires_at < NOW()");
    foreach ($slots as $slot) {
            offer_waitlist_for_slot(
                $pdo,
                (int)$slot['doctor_id'],
                (string)$slot['appointment_date'],
                (string)$slot['appointment_time']
            );
    }
}
