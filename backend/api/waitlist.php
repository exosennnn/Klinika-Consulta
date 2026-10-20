<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../waitlist_helpers.php';

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        require_login(['patient']);
        $q = $pdo->prepare("SELECT w.id, w.doctor_id, d.name AS doctor_name, s.name AS specialty_name,
                w.appointment_date, w.appointment_time, w.status, w.expires_at, w.created_at
            FROM appointment_waitlist w
            JOIN doctors d ON d.id = w.doctor_id
            JOIN specialties s ON s.id = w.specialty_id
            WHERE w.patient_id = ? AND w.status IN ('Waiting','Offered')
            ORDER BY w.created_at DESC");
        $q->execute([(int)$_SESSION['user_id']]);
        json_out(['success' => true, 'entries' => $q->fetchAll()]);
    }

    $d = json_input();
    $action = trim((string)($d['action'] ?? ''));
    if ($action === 'join_patient') {
        require_login(['patient']);
    } elseif (!in_array($action, ['join_guest', 'claim'], true)) {
        json_out(['success' => false, 'message' => 'Invalid waitlist action.'], 422);
    }

    if ($action === 'join_patient' || $action === 'join_guest') {
        $doctorId = (int)($d['doctor_id'] ?? 0);
        $date = trim((string)($d['appointment_date'] ?? ''));
        $time = trim((string)($d['appointment_time'] ?? ''));
        $reason = trim((string)($d['reason_for_visit'] ?? ''));
        if (preg_match('/^\d{2}:\d{2}$/D', $time)) $time .= ':00';
        if (!$doctorId || mb_strlen($reason) > 500) {
            json_out(['success' => false, 'message' => 'Select a doctor and a valid appointment time.'], 422);
        }
        $problem = waitlist_slot_problem($pdo, $doctorId, $date, $time);
        if ($problem) json_out(['success' => false, 'message' => $problem], 422);

        $doctorQuery = $pdo->prepare("SELECT id, specialty_id FROM doctors WHERE id = ? AND status = 'Active'");
        $doctorQuery->execute([$doctorId]);
        $doctor = $doctorQuery->fetch();
        if (!$doctor) json_out(['success' => false, 'message' => 'Doctor not found.'], 404);

        $occupied = $pdo->prepare("SELECT COUNT(*) FROM appointments
            WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
              AND status NOT IN ('Cancelled','Needs_Reassignment')");
        $occupied->execute([$doctorId, $date, $time]);
        if ((int)$occupied->fetchColumn() === 0) {
            json_out(['success' => false, 'message' => 'That time is open now. Refresh availability and book it directly.'], 409);
        }

        $patientId = null;
        $guestName = null;
        $guestPhone = null;
        $guestEmail = null;
        $verificationRow = null;
        if ($action === 'join_patient') {
            $patientId = (int)$_SESSION['user_id'];
            $userQuery = $pdo->prepare("SELECT full_name, contact_number FROM users WHERE id = ? AND role = 'patient'");
            $userQuery->execute([$patientId]);
            $user = $userQuery->fetch();
            if (!$user) json_out(['success' => false, 'message' => 'Patient account not found.'], 404);
            $active = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE patient_id = ? AND status NOT IN ('Cancelled','Completed')");
            $active->execute([$patientId]);
            if ((int)$active->fetchColumn() > 0) {
                json_out(['success' => false, 'message' => 'Complete or cancel your active appointment before joining the waitlist.'], 409);
            }
        } else {
            $guestName = preg_replace('/\s+/', ' ', trim((string)($d['full_name'] ?? '')));
            $guestPhone = preg_replace('/\D+/', '', (string)($d['contact_number'] ?? ''));
            $guestEmail = strtolower(trim((string)($d['email'] ?? '')));
            $verificationToken = trim((string)($d['verification_token'] ?? ''));
            if (mb_strlen($guestName) < 3 || mb_strlen($guestName) > 100 ||
                !preg_match('/^09\d{9}$/D', $guestPhone) ||
                !filter_var($guestEmail, FILTER_VALIDATE_EMAIL) ||
                !preg_match('/^[a-f0-9]{64}$/D', $verificationToken)) {
                json_out(['success' => false, 'message' => 'A verified email, patient name, and valid mobile number are required to join the waitlist.'], 422);
            }
            $wait = rate_limit_wait($pdo, 'guest_wait', $guestPhone, 4, 15);
            if ($wait > 0) json_out(['success' => false, 'message' => 'Too many waitlist requests. Please wait and try again.'], 429);
            $verify = $pdo->prepare("SELECT id FROM guest_otp_verifications
                WHERE verification_token = ? AND verified = 1 AND channel = 'email'
                  AND LOWER(email_address) = ? AND contact_number = ?
                  AND LOWER(TRIM(full_name)) = LOWER(TRIM(?)) AND expires_at >= NOW()
                LIMIT 1");
            $verify->execute([$verificationToken, $guestEmail, $guestPhone, $guestName]);
            $verificationRow = $verify->fetch();
            if (!$verificationRow) json_out(['success' => false, 'message' => 'Email verification expired or does not match your details. Verify your email again.'], 422);
            $active = $pdo->prepare("SELECT COUNT(*) FROM appointments
                WHERE patient_id IS NULL AND contact_number = ? AND LOWER(TRIM(patient_name)) = LOWER(TRIM(?))
                  AND status NOT IN ('Cancelled','Completed')");
            $active->execute([$guestPhone, $guestName]);
            if ((int)$active->fetchColumn() > 0) {
                json_out(['success' => false, 'message' => 'You already have an active appointment. Check its tracking code before joining the waitlist.'], 409);
            }
        }

        $pdo->beginTransaction();
        $doctorLock = $pdo->prepare("SELECT id FROM doctors WHERE id = ? AND status = 'Active' FOR UPDATE");
        $doctorLock->execute([$doctorId]);
        if (!$doctorLock->fetchColumn()) {
            $pdo->rollBack();
            json_out(['success' => false, 'message' => 'Doctor not found.'], 404);
        }
        if ($patientId !== null) {
            $userLock = $pdo->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
            $userLock->execute([$patientId]);
            $active->execute([$patientId]);
            if ((int)$active->fetchColumn() > 0) {
                $pdo->rollBack();
                json_out(['success' => false, 'message' => 'Complete or cancel your active appointment before joining the waitlist.'], 409);
            }
        }

        if ($patientId !== null) {
            $duplicate = $pdo->prepare("SELECT COUNT(*) FROM appointment_waitlist
                WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
                  AND status IN ('Waiting','Offered') AND patient_id = ?");
            $duplicate->execute([$doctorId, $date, $time, $patientId]);
        } else {
            $duplicate = $pdo->prepare("SELECT COUNT(*) FROM appointment_waitlist
                WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
                  AND status IN ('Waiting','Offered') AND patient_id IS NULL
                  AND guest_phone = ? AND LOWER(TRIM(guest_name)) = LOWER(TRIM(?))");
            $duplicate->execute([$doctorId, $date, $time, $guestPhone, $guestName]);
        }
        if ((int)$duplicate->fetchColumn() > 0) {
            $pdo->rollBack();
            json_out(['success' => false, 'message' => 'You are already on the waitlist for this time.'], 409);
        }

        $occupied->execute([$doctorId, $date, $time]);
        if ((int)$occupied->fetchColumn() === 0) {
            $pdo->rollBack();
            json_out(['success' => false, 'message' => 'That time opened while you were joining. Refresh availability and book it directly.'], 409);
        }
        $insert = $pdo->prepare("INSERT INTO appointment_waitlist
            (patient_id, guest_name, guest_phone, guest_email, doctor_id, specialty_id,
             appointment_date, appointment_time, reason_for_visit, status)
            VALUES (?,?,?,?,?,?,?,?,?,'Waiting')");
        $insert->execute([$patientId, $guestName, $guestPhone, $guestEmail, $doctorId, (int)$doctor['specialty_id'],
            $date, $time, $reason !== '' ? $reason : null]);
        $entryId = (int)$pdo->lastInsertId();
        if ($verificationRow) {
            $consume = $pdo->prepare('DELETE FROM guest_otp_verifications WHERE id = ? AND verification_token = ?');
            $consume->execute([(int)$verificationRow['id'], $verificationToken]);
            if ($consume->rowCount() !== 1) throw new RuntimeException('Email verification token was already used.');
        }
        log_activity($pdo, null, 'waitlist_joined', "Added a " . ($patientId ? 'patient' : 'verified guest') . " to doctor #$doctorId waitlist for $date " . substr($time, 0, 5) . '.');
        $pdo->commit();
        if ($guestPhone) rate_limit_hit($pdo, 'guest_wait', $guestPhone);
        json_out(['success' => true, 'entry_id' => $entryId, 'message' => 'You are on the waitlist. We will notify you if this slot opens.']);
    }

    if ($action === 'claim') {
        $token = trim((string)($d['offer_token'] ?? ''));
        $waitlistId = (int)($d['waitlist_id'] ?? 0);
        if (!$waitlistId && !preg_match('/^[a-f0-9]{64}$/D', $token)) {
            json_out(['success' => false, 'message' => 'Enter the valid waitlist offer code.'], 422);
        }
        $patientId = null;
        if (!empty($_SESSION['user_id']) && ($_SESSION['role'] ?? '') === 'patient') {
            $patientId = (int)$_SESSION['user_id'];
        }
        $pdo->beginTransaction();
        if ($patientId !== null && $waitlistId > 0) {
            $offerQuery = $pdo->prepare("SELECT *, (expires_at IS NOT NULL AND expires_at >= NOW()) AS offer_is_valid
                FROM appointment_waitlist
                WHERE id = ? AND patient_id = ? AND status = 'Offered' FOR UPDATE");
            $offerQuery->execute([$waitlistId, $patientId]);
        } else {
            $offerQuery = $pdo->prepare("SELECT *, (expires_at IS NOT NULL AND expires_at >= NOW()) AS offer_is_valid
                FROM appointment_waitlist
                WHERE offer_token_hash = ? AND status = 'Offered' FOR UPDATE");
            $offerQuery->execute([hash('sha256', $token)]);
        }
        $entry = $offerQuery->fetch();
        if (!$entry || ($patientId !== null && (int)$entry['patient_id'] !== $patientId) ||
            ($patientId === null && !empty($entry['patient_id']))) {
            $pdo->rollBack();
            json_out(['success' => false, 'message' => 'This waitlist offer is invalid or no longer available.'], 404);
        }
        if (!(int)$entry['offer_is_valid']) {
            $pdo->prepare("UPDATE appointment_waitlist SET status = 'Waiting', offer_token_hash = NULL,
                offered_at = NULL, expires_at = NULL, created_at = NOW() WHERE id = ?")->execute([(int)$entry['id']]);
            $pdo->commit();
            offer_waitlist_for_slot($pdo, (int)$entry['doctor_id'], (string)$entry['appointment_date'], (string)$entry['appointment_time']);
            json_out(['success' => false, 'message' => 'This offer has expired. You remain on the waitlist for another opening.'], 410);
        }

        $doctorLock = $pdo->prepare('SELECT id FROM doctors WHERE id = ? FOR UPDATE');
        $doctorLock->execute([(int)$entry['doctor_id']]);
        if (!$doctorLock->fetchColumn()) {
            $pdo->rollBack();
            json_out(['success' => false, 'message' => 'The doctor is no longer available.'], 409);
        }
        $problem = slot_problem($pdo, (int)$entry['doctor_id'], (string)$entry['appointment_date'], (string)$entry['appointment_time']);
        if ($problem) {
            $pdo->prepare("UPDATE appointment_waitlist SET status = 'Waiting', offer_token_hash = NULL,
                offered_at = NULL, expires_at = NULL, created_at = NOW() WHERE id = ?")->execute([(int)$entry['id']]);
            $pdo->commit();
            json_out(['success' => false, 'message' => 'The slot is no longer available. You remain on the waitlist.'], 409);
        }

        if ($patientId !== null) {
            $active = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE patient_id = ? AND status NOT IN ('Cancelled','Completed')");
            $active->execute([$patientId]);
            if ((int)$active->fetchColumn() > 0) {
                $pdo->prepare("UPDATE appointment_waitlist SET status = 'Cancelled', offer_token_hash = NULL
                    WHERE id = ? AND status = 'Offered'")->execute([(int)$entry['id']]);
                $pdo->commit();
                offer_waitlist_for_slot($pdo, (int)$entry['doctor_id'], (string)$entry['appointment_date'], (string)$entry['appointment_time']);
                json_out(['success' => false, 'message' => 'Complete or cancel your active appointment before claiming this slot.'], 409);
            }
            $patient = $pdo->prepare('SELECT full_name, contact_number FROM users WHERE id = ?');
            $patient->execute([$patientId]);
            $user = $patient->fetch();
            if (!$user) {
                $pdo->rollBack();
                json_out(['success' => false, 'message' => 'Patient account not found.'], 404);
            }
            $patientName = (string)$user['full_name'];
            $phone = (string)$user['contact_number'];
            $role = 'patient';
            $verified = 0;
            $email = null;
            $channel = null;
        } else {
            $active = $pdo->prepare("SELECT COUNT(*) FROM appointments
                WHERE patient_id IS NULL AND contact_number = ? AND LOWER(TRIM(patient_name)) = LOWER(TRIM(?))
                  AND status NOT IN ('Cancelled','Completed')");
            $active->execute([(string)$entry['guest_phone'], (string)$entry['guest_name']]);
            if ((int)$active->fetchColumn() > 0) {
                $pdo->prepare("UPDATE appointment_waitlist SET status = 'Cancelled', offer_token_hash = NULL
                    WHERE id = ? AND status = 'Offered'")->execute([(int)$entry['id']]);
                $pdo->commit();
                offer_waitlist_for_slot($pdo, (int)$entry['doctor_id'], (string)$entry['appointment_date'], (string)$entry['appointment_time']);
                json_out(['success' => false, 'message' => 'You already have an active appointment. Check its tracking code before claiming.'], 409);
            }
            $patientName = (string)$entry['guest_name'];
            $phone = (string)$entry['guest_phone'];
            $role = 'guest';
            $verified = 1;
            $email = (string)$entry['guest_email'];
            $channel = 'email';
        }

        $ref = new_reference($pdo);
        $appointment = $pdo->prepare("INSERT INTO appointments
            (reference_code, patient_id, patient_name, contact_number, email_address, contact_verified,
             verification_channel, specialty_id, doctor_id, appointment_date, appointment_time,
             status, booked_by_role, forwarded_to_doctor, patient_notified, reason_for_visit)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,'Pending',?,1,0,?)");
        $appointment->execute([
            $ref, $patientId, $patientName, $phone, $email, $verified, $channel, (int)$entry['specialty_id'],
            (int)$entry['doctor_id'], $entry['appointment_date'], $entry['appointment_time'], $role,
            $entry['reason_for_visit']
        ]);
        $appointmentId = (int)$pdo->lastInsertId();
        $pdo->prepare("UPDATE appointment_waitlist SET status = 'Claimed', claimed_appointment_id = ?,
            offer_token_hash = NULL WHERE id = ? AND status = 'Offered'")->execute([$appointmentId, (int)$entry['id']]);
        notify_doctor($pdo, (int)$entry['doctor_id'], 'Waitlist Slot Claimed', "$patientName - {$entry['appointment_date']} " . substr((string)$entry['appointment_time'], 0, 5) . " ($ref). Please review.");
        notify($pdo, 'coordinator', null, 'Waitlist Slot Claimed', "A waitlist offer was claimed for {$entry['appointment_date']} " . substr((string)$entry['appointment_time'], 0, 5) . " ($ref).");
        if ($patientId !== null) {
            notify($pdo, 'patient', $patientId, 'Waitlist Request Submitted', "Your request for {$entry['appointment_date']} at " . substr((string)$entry['appointment_time'], 0, 5) . " was sent to the doctor for review.");
        }
        log_activity($pdo, $appointmentId, 'waitlist_slot_claimed', 'Patient claimed an offered slot; appointment request sent for doctor review.');
        $pdo->commit();
        json_out(['success' => true, 'reference_code' => $ref, 'status' => 'Pending']);
    }

    json_out(['success' => false, 'message' => 'Invalid waitlist action.'], 422);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    fail($e);
}
