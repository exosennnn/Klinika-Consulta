<?php
require_once __DIR__ . '/../db.php';
require_login();

try {
    $d = json_input();
    $role = $_SESSION['role'];

    $doctor_id = (int)($d['doctor_id'] ?? 0);
    $date      = trim($d['appointment_date'] ?? '');
    $time      = trim($d['appointment_time'] ?? '');
    $reason_for_visit = trim((string)($d['reason_for_visit'] ?? ''));
    if (mb_strlen($reason_for_visit) > 500) json_out(['success'=>false,'message'=>'Reason for visit is too long.'],422);

    if (!$doctor_id || !$date || !$time) {
        json_out(['success' => false, 'message' => 'Doctor, date and time are required.'], 422);
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || strtotime($date) === false) {
        json_out(['success' => false, 'message' => 'Invalid date.'], 422);
    }
    if ($date < date('Y-m-d')) {
        json_out(['success' => false, 'message' => 'Cannot book a past date.'], 422);
    }
    if (preg_match('/^\d{2}:\d{2}$/', $time)) $time .= ':00';

    // Who is the patient? Patient = themselves. Coordinator = walk-in.
    if ($role === 'patient') {
        $patient_id     = $_SESSION['user_id'];
        $patient_name   = $_SESSION['full_name'];
        $contact        = trim($d['contact_number'] ?? '');
        try {
            $s = $pdo->prepare("SELECT contact_number FROM users WHERE id = ?");
            $s->execute([$patient_id]);
            $contact = $s->fetchColumn() ?: $contact;
        } catch (Throwable $e) { /* fine, ignore */ }
        $booked_by_role = 'patient';
    } elseif ($role === 'coordinator') {
        $patient_id     = null;
        $patient_name   = trim($d['patient_name'] ?? '');
        $contact        = trim($d['contact_number'] ?? '');
        $booked_by_role = 'coordinator';
        if ($patient_name === '') {
            json_out(['success' => false, 'message' => 'Enter the patient name.'], 422);
        }
    } else {
        json_out(['success' => false, 'message' => 'This role cannot make bookings.'], 403);
    }

    $s = $pdo->prepare("SELECT id, specialty_id, name FROM doctors WHERE id = ? AND status = 'Active'");
    $s->execute([$doctor_id]);
    $doc = $s->fetch();
    if (!$doc) json_out(['success' => false, 'message' => 'Doctor not found.'], 404);
    $specialty_id = (int)$doc['specialty_id'];

    $pdo->beginTransaction();
    if ($role === 'patient') {
        // Serializing bookings on the patient row prevents simultaneous requests
        // from creating multiple active appointments for the same account.
        $patientLock = $pdo->prepare("SELECT id FROM users WHERE id = ? FOR UPDATE");
        $patientLock->execute([$patient_id]);
        $activeAppointment = $pdo->prepare("SELECT id FROM appointments
            WHERE patient_id = ? AND status NOT IN ('Completed', 'Cancelled')
            LIMIT 1");
        $activeAppointment->execute([$patient_id]);
        if ($activeAppointment->fetchColumn()) {
            $pdo->rollBack();
            json_out([
                'success' => false,
                'message' => 'You already have an active appointment. Complete or cancel it before booking another.'
            ], 409);
        }
    }

    // Workday, leave/blockout, at kuha nang oras
    $problem = slot_problem($pdo, $doctor_id, $date, $time);
    if ($problem) {
        $pdo->rollBack();
        json_out(['success' => false, 'message' => $problem], 409);
    }

    $s = $pdo->prepare("SELECT COUNT(*) FROM appointments
        WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
          AND status NOT IN ('Cancelled','Needs_Reassignment') FOR UPDATE");
    $s->execute([$doctor_id, $date, $time]);
    if ($s->fetchColumn() > 0) {
        $pdo->rollBack();
        json_out(['success' => false, 'message' => 'That time slot is already taken. Please choose another time.'], 409);
    }

    $ref = new_reference($pdo);

    // Patient requests wait for the doctor's decision; coordinator walk-ins are booked immediately.
    $isWalkin  = ($role === 'coordinator');
    $status    = $isWalkin ? 'Booked' : 'Pending';
    // Patient requests go straight to the assigned doctor; the Coordinator relays the doctor's decision.
    $forwarded = 1;

    $pdo->prepare("INSERT INTO appointments
        (reference_code, patient_id, patient_name, contact_number, specialty_id, doctor_id,
         appointment_date, appointment_time, status, booked_by_role, forwarded_to_doctor, patient_notified, reason_for_visit)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
        ->execute([$ref, $patient_id, $patient_name, $contact, $specialty_id, $doctor_id,
                   $date, $time, $status, $booked_by_role, $forwarded, $isWalkin ? 1 : 0, $reason_for_visit !== '' ? $reason_for_visit : null]);

    if ($isWalkin) {
        notify_doctor($pdo, $doctor_id, 'Walk-in Appointment', "$patient_name - $date $time ($ref)");
    } else {
        notify_doctor($pdo, $doctor_id, 'New Appointment Request',
            "$patient_name - $date " . substr($time, 0, 5) . " ($ref). Please review and accept or decline.");
        notify($pdo, 'coordinator', null, 'New Reservation', "$patient_name - $date $time ($ref). The assigned doctor can review it now.");
        // This is the only notice to the patient until the Coordinator relays the decision
        notify($pdo, 'patient', (int)$patient_id, 'Reservation Received', "$ref received. Awaiting confirmation.");
    }

    $pdo->commit();
    json_out(['success' => true, 'message' => 'Successfully booked!', 'reference_code' => $ref, 'status' => $status]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    fail($e);
}
