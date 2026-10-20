<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../otp_provider.php';
require_login(['doctor']);

try {
    $data = json_input();
    $appointmentId = (int)($data['appointment_id'] ?? 0);
    $action = strtolower(trim((string)($data['action'] ?? '')));
    $reason = trim((string)($data['reason'] ?? ''));
    $period = trim((string)($data['followup_period'] ?? ''));
    $notes = trim((string)($data['followup_notes'] ?? ''));

    if (!$appointmentId) json_out(['success' => false, 'message' => 'Missing appointment ID.'], 422);

    // A doctor may only act on appointments assigned and forwarded to that doctor.
    $q = $pdo->prepare("SELECT * FROM appointments WHERE id = ? AND doctor_id = ?");
    $q->execute([$appointmentId, (int)$_SESSION['doctor_id']]);
    $app = $q->fetch();
    if (!$app) json_out(['success' => false, 'message' => 'Appointment not found for this doctor.'], 404);

    if ($action === 'accept' || $action === 'approved') {
        if ($app['status'] !== 'Pending' || !(int)$app['forwarded_to_doctor']) {
            json_out(['success' => false, 'message' => 'This appointment is not awaiting your review.'], 409);
        }
        $pdo->beginTransaction();
        $update = $pdo->prepare("UPDATE appointments SET status = 'Booked'
            WHERE id = ? AND doctor_id = ? AND status = 'Pending' AND forwarded_to_doctor = 1");
        $update->execute([$appointmentId, (int)$_SESSION['doctor_id']]);
        if ($update->rowCount() !== 1) {
            $pdo->rollBack();
            json_out(['success' => false, 'message' => 'This appointment is no longer awaiting your review.'], 409);
        }
        notify($pdo, 'coordinator', null, 'Doctor Accepted Appointment',
            "The doctor confirmed {$app['reference_code']}. The appointment is now booked; no coordinator relay is required.");
        if (!empty($app['patient_id'])) {
            notify($pdo, 'patient', (int)$app['patient_id'], 'Appointment Booked',
                "Your appointment {$app['reference_code']} is confirmed for {$app['appointment_date']} at " . substr($app['appointment_time'], 0, 5) . ".");
        }
        $pdo->prepare("UPDATE appointments SET patient_notified = 1 WHERE id = ?")->execute([$appointmentId]);
        log_activity($pdo, $appointmentId, 'doctor_accepted', 'Doctor accepted; appointment booked immediately.');
        $pdo->commit();
        if ($app['patient_id'] === null
            && (int)$app['contact_verified'] === 1
            && $app['verification_channel'] === 'email'
            && trim((string)$app['email_address']) !== '') {
            dm_send_guest_booked_confirmation($pdo, $appointmentId);
        }
        json_out(['success' => true, 'message' => 'Appointment booked. Patient status updated immediately; coordinator notified.']);
    }

    if ($action === 'decline') {
        if ($app['status'] !== 'Pending' || !(int)$app['forwarded_to_doctor']) {
            json_out(['success' => false, 'message' => 'This appointment is not awaiting your review.'], 409);
        }
        $pdo->beginTransaction();
        $update = $pdo->prepare("UPDATE appointments SET status = 'Needs_Reassignment', forwarded_to_doctor = 0, decline_reason = ?
            WHERE id = ? AND doctor_id = ? AND status = 'Pending' AND forwarded_to_doctor = 1");
        $update->execute([$reason !== '' ? $reason : null, $appointmentId, (int)$_SESSION['doctor_id']]);
        if ($update->rowCount() !== 1) {
            $pdo->rollBack();
            json_out(['success' => false, 'message' => 'This appointment is no longer awaiting your review.'], 409);
        }
        notify($pdo, 'coordinator', null, 'Doctor Declined Appointment',
            "The doctor declined {$app['reference_code']}. Reassignment is required.");
        log_activity($pdo, $appointmentId, 'doctor_declined', $reason);
        $pdo->commit();
        json_out(['success' => true, 'message' => 'Appointment declined.']);
    }

    if ($action === 'complete' || $action === 'consultation_done') {
        if ($app['status'] !== 'Checked_In') {
            json_out(['success' => false, 'message' => 'Only checked-in appointments can be completed.'], 409);
        }
        $pdo->prepare("UPDATE appointments SET status = 'Completed' WHERE id = ?")->execute([$appointmentId]);
        notify($pdo, 'coordinator', null, 'Consultation Completed',
            "The consultation for {$app['reference_code']} has been completed. Follow-up advice may now be recorded.");
        if (!empty($app['patient_id'])) {
            notify($pdo, 'patient', (int)$app['patient_id'], 'Consultation Completed',
                "Your consultation ({$app['reference_code']}) has been marked completed.");
        }
        log_activity($pdo, $appointmentId, 'consultation_completed', 'Consultation marked completed.');
        json_out(['success' => true, 'message' => 'Consultation marked as completed.']);
    }

    if ($action === 'followup') {
        if ($app['status'] !== 'Completed') {
            json_out(['success' => false, 'message' => 'Follow-up advice can only be added after the consultation is completed.'], 409);
        }
        if ($period === '') {
            json_out(['success' => false, 'message' => 'Please provide a follow-up timeframe.'], 422);
        }
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE appointments SET followup_timeframe = ?, followup_notes = ? WHERE id = ?")
            ->execute([$period, $notes !== '' ? $notes : null, $appointmentId]);
        notify($pdo, 'coordinator', null, 'Follow-up Advice',
            "The doctor added follow-up advice for {$app['reference_code']}. Please arrange the follow-up schedule if needed.");
        if (!empty($app['patient_id'])) {
            $patientMsg = "Your doctor added follow-up advice for {$app['reference_code']}: {$period}";
            if ($notes !== '') $patientMsg .= " — {$notes}";
            notify($pdo, 'patient', (int)$app['patient_id'], 'New Follow-up Advice', $patientMsg);
        }
        log_activity($pdo, $appointmentId, 'followup_advice', $period . ($notes !== '' ? ' — ' . $notes : ''));
        $pdo->commit();
        if ($app['patient_id'] === null
            && (int)$app['contact_verified'] === 1
            && $app['verification_channel'] === 'email'
            && trim((string)$app['email_address']) !== '') {
            dm_send_guest_followup_notice($pdo, $appointmentId);
        }
        json_out(['success' => true, 'message' => 'Follow-up advice saved and sent to the patient.']);
    }

    json_out(['success' => false, 'message' => 'Invalid action.'], 422);
} catch (Throwable $e) {
    fail($e);
}
