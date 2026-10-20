<?php
require_once __DIR__ . '/../db.php';
try {
    $d = json_input();
    $name = preg_replace('/\s+/', ' ', trim((string)($d['full_name'] ?? '')));
    $phone = preg_replace('/\D+/', '', (string)($d['contact_number'] ?? ''));
    $email = strtolower(trim((string)($d['email'] ?? '')));
    $doctor = (int)($d['doctor_id'] ?? 0);
    $date = trim((string)($d['appointment_date'] ?? ''));
    $time = trim((string)($d['appointment_time'] ?? ''));
    $reason = trim((string)($d['reason_for_visit'] ?? ''));

    if (mb_strlen($name) < 3 || mb_strlen($name) > 100 || !preg_match('/^09\d{9}$/D', $phone) || !$doctor || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) {
        json_out(['success' => false, 'message' => 'Complete all required appointment details.'], 422);
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_out(['success' => false, 'message' => 'Enter a valid email address or leave it blank.'], 422);
    }
    $verificationToken = trim((string)($d['verification_token'] ?? ''));
    $emailVerified = false;
    if ($email !== '') {
        if (!preg_match('/^[a-f0-9]{64}$/D', $verificationToken)) json_out(['success'=>false,'message'=>'Verify your email before submitting.'],422);
        $verify = $pdo->prepare("SELECT id FROM guest_otp_verifications WHERE verification_token = ? AND verified = 1 AND channel = 'email' AND LOWER(email_address) = ? AND contact_number = ? AND LOWER(TRIM(full_name)) = LOWER(TRIM(?)) AND expires_at >= NOW() LIMIT 1");
        $verify->execute([$verificationToken,$email,$phone,$name]);
        $verifiedRow = $verify->fetch();
        if (!$verifiedRow) json_out(['success'=>false,'message'=>'Email verification expired or does not match your details.'],422);
        $emailVerified = true;
    }
    if (preg_match('/^\d{2}:\d{2}$/', $time)) $time .= ':00';
    if (mb_strlen($reason) > 500) json_out(['success' => false, 'message' => 'Reason for visit is too long.'], 422);
    if ($date < date('Y-m-d')) json_out(['success' => false, 'message' => 'Choose a future appointment date.'], 422);

    // Guest-booking abuse protection. The mobile number is used only as a rate-limit key here;
    // family members may still share a number and are not treated as the same person by name alone.
    $wait = rate_limit_wait($pdo, 'guest_book', $phone, 5, 15);
    if ($wait > 0) json_out(['success' => false, 'message' => 'Too many appointment requests. Please wait a few minutes and try again.'], 429);

    $doc = $pdo->prepare("SELECT id, specialty_id, name FROM doctors WHERE id = ? AND status = 'Active'");
    $doc->execute([$doctor]);
    $dr = $doc->fetch();
    if (!$dr) json_out(['success' => false, 'message' => 'Doctor not found.'], 404);

    // Prevent an accidental repeat request for the same patient/doctor/day. Same names, addresses,
    // and shared family phone numbers remain allowed when they belong to different people.
    $dup = $pdo->prepare("SELECT reference_code FROM appointments
        WHERE contact_number = ? AND LOWER(TRIM(patient_name)) = LOWER(TRIM(?))
          AND doctor_id = ? AND appointment_date = ?
          AND status NOT IN ('Cancelled','Declined','Completed')
        ORDER BY id DESC LIMIT 1");
    $dup->execute([$phone, $name, $doctor, $date]);
    if ($existing = $dup->fetch()) {
        rate_limit_hit($pdo, 'guest_book', $phone);
        json_out(['success' => false, 'message' => 'You already have an active request with this doctor on this date. Use your existing Tracking Code instead of sending another request.'], 409);
    }

    // Prevent the same named patient using one number to hold multiple active slots.
    // Different family members may legitimately share the same contact number.
    $active = $pdo->prepare("SELECT reference_code FROM appointments
        WHERE contact_number = ? AND LOWER(TRIM(patient_name)) = LOWER(TRIM(?))
          AND status IN ('Pending','Booked','Checked_In','Proposed','Needs_Reassignment')
        ORDER BY id DESC LIMIT 1");
    $active->execute([$phone, $name]);
    if ($active->fetch()) {
        rate_limit_hit($pdo, 'guest_book', $phone);
        json_out(['success' => false, 'message' => 'You already have an active appointment request. Please check its Tracking Code before making another request.'], 409);
    }

    // Flag shared/reused contact details for coordinator review without rejecting legitimate families.
    $shared = $pdo->prepare("SELECT patient_name FROM appointments
        WHERE contact_number = ? AND LOWER(TRIM(patient_name)) <> LOWER(TRIM(?)) LIMIT 1");
    $shared->execute([$phone, $name]);
    $sharedContact = (bool)$shared->fetch();

    $pdo->beginTransaction();
    $problem = slot_problem($pdo, $doctor, $date, $time);
    if ($problem) { $pdo->rollBack(); json_out(['success' => false, 'message' => $problem], 409); }

    $ref = new_reference($pdo);
    $ins = $pdo->prepare("INSERT INTO appointments
        (reference_code,patient_id,patient_name,contact_number,email_address,contact_verified,verification_channel,specialty_id,doctor_id,appointment_date,appointment_time,status,booked_by_role,forwarded_to_doctor,patient_notified,reason_for_visit)
        VALUES (?,NULL,?,?,?,?,?,?,?,?,?,'Pending','guest',1,0,?)");
    $ins->execute([$ref, $name, $phone, $email ?: null, $emailVerified ? 1 : 0, $emailVerified ? 'email' : 'not_verified', $dr['specialty_id'], $doctor, $date, $time, $reason ?: null]);
    $aid = (int)$pdo->lastInsertId();

    notify_doctor($pdo, $doctor, 'New Guest Appointment Request', "$name - $date " . substr($time, 0, 5) . " ($ref). Please review.");
    notify($pdo, 'coordinator', null, 'New Guest Reservation', "$name - $date " . substr($time, 0, 5) . " ($ref). Email OTP is enabled when an email is provided; SMS is not active.");
    if ($sharedContact) {
        notify($pdo, 'coordinator', null, 'Shared Contact Number', "$name used a mobile number that also appears on another patient record. Please verify the patient details during confirmation/check-in.");
    }
    log_activity($pdo, $aid, 'guest_appointment_requested', $sharedContact ? 'Email verification optional; shared contact flagged for review.' : 'Email verification optional; SMS unavailable.');
    if ($emailVerified) {
        $consume = $pdo->prepare("DELETE FROM guest_otp_verifications WHERE id = ? AND verification_token = ?");
        $consume->execute([$verifiedRow['id'], $verificationToken]);
        if ($consume->rowCount() !== 1) throw new RuntimeException('Verification token already used.');
    }
    $pdo->commit();
    rate_limit_hit($pdo, 'guest_book', $phone);
    json_out(['success' => true, 'reference_code' => $ref, 'status' => 'Pending']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    fail($e);
}
