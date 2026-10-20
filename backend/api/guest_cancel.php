<?php
require_once __DIR__ . '/../db.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(['success' => false, 'message' => 'This endpoint accepts POST requests only.'], 405);
}

$d = json_input();
$ref = strtoupper(trim((string)($d['reference_code'] ?? '')));
$contact = preg_replace('/\D+/', '', (string)($d['contact_number'] ?? ''));
if (strlen($contact) === 12 && substr($contact, 0, 3) === '639') $contact = '0' . substr($contact, 2);
if (strlen($contact) === 10 && $contact[0] === '9') $contact = '0' . $contact;

if ($ref === '' || $contact === '' || ($d['confirm'] ?? null) !== true) {
    json_out(['success' => false, 'message' => 'Provide the Reference Code and Contact Number, then confirm cancellation.'], 422);
}

try {
    $wait = rate_limit_wait($pdo, 'guest_cncl', '-', 10, 15);
    if ($wait > 0) json_out(['success' => false, 'message' => 'Too many cancellation attempts. Please try again later.'], 429);

    $pdo->beginTransaction();
    $s = $pdo->prepare("SELECT id, reference_code, doctor_id, appointment_date, appointment_time, status
        FROM appointments
        WHERE UPPER(TRIM(reference_code)) = ?
          AND REPLACE(REPLACE(REPLACE(contact_number,' ',''),'-',''),'+','') = ?
          AND patient_id IS NULL
        FOR UPDATE");
    $s->execute([$ref, $contact]);
    $app = $s->fetch();
    if (!$app) {
        $pdo->commit();
        rate_limit_hit($pdo, 'guest_cncl', '-');
        json_out(['success' => false, 'message' => 'No guest appointment found for the details provided.'], 404);
    }

    if (!in_array($app['status'], ['Pending', 'Booked'], true)) {
        $pdo->commit();
        json_out(['success' => false, 'message' => 'Only Pending or Booked appointments can be cancelled. This appointment was not changed.'], 409);
    }

    $update = $pdo->prepare("UPDATE appointments
        SET status = 'Cancelled', cancel_reason = 'Cancelled by guest via Track Appointment'
        WHERE id = ? AND status IN ('Pending', 'Booked')");
    $update->execute([(int)$app['id']]);
    if ($update->rowCount() !== 1) {
        $pdo->rollBack();
        json_out(['success' => false, 'message' => 'This appointment can no longer be cancelled. Please check its current status.'], 409);
    }

    $when = $app['appointment_date'] . ' ' . substr((string)$app['appointment_time'], 0, 5);
    $message = "Guest appointment {$app['reference_code']} cancelled for $when. The slot is now free.";
    notify_doctor($pdo, (int)$app['doctor_id'], 'Guest Appointment Cancelled', $message);
    notify($pdo, 'coordinator', null, 'Guest Appointment Cancelled', $message);
    $pdo->commit();

    json_out(['success' => true, 'message' => 'Your appointment has been cancelled.']);
} catch (Throwable $e) {
    fail($e);
}
