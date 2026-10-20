<?php
require_once __DIR__ . '/../db.php';
require_login(['doctor']);

try {
    $doctorId = (int)($_SESSION['doctor_id'] ?? 0);
    if (!$doctorId) json_out(['success' => false, 'message' => 'No doctor profile is linked to this account.'], 422);
    $data = json_input();
    $schedule = validate_doctor_work_schedule($data['days'] ?? [], $data['work_schedule'] ?? null);
    if (isset($schedule['error'])) json_out(['success' => false, 'message' => $schedule['error']], 422);
    $reason = trim((string)($data['reason'] ?? ''));
    if (mb_strlen($reason) > 255) json_out(['success' => false, 'message' => 'Reason must be 255 characters or fewer.'], 422);

    $doctor = $pdo->prepare("SELECT id, name, status FROM doctors WHERE id = ? AND status = 'Active'");
    $doctor->execute([$doctorId]);
    $profile = $doctor->fetch();
    if (!$profile) json_out(['success' => false, 'message' => 'Active doctor profile not found.'], 404);

    $pending = $pdo->prepare("SELECT COUNT(*) FROM doctor_schedule_requests WHERE doctor_id = ? AND status = 'Pending'");
    $pending->execute([$doctorId]);
    if ((int)$pending->fetchColumn() > 0) {
        json_out(['success' => false, 'message' => 'You already have a schedule change waiting for coordinator review.'], 409);
    }

    $dayNames = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];
    $days = implode(',', array_map(static fn($day) => $dayNames[$day], $schedule['days']));
    $pdo->beginTransaction();
    $insert = $pdo->prepare("INSERT INTO doctor_schedule_requests (doctor_id, requested_days, requested_schedule, reason)
        VALUES (?, ?, ?, ?)");
    $insert->execute([$doctorId, $days, json_encode($schedule['schedule'], JSON_THROW_ON_ERROR), $reason ?: null]);
    $requestId = (int)$pdo->lastInsertId();
    notify($pdo, 'coordinator', null, 'Doctor Schedule Change Request',
        "{$profile['name']} requested new workdays and hours ($days). Please review the schedule request.");
    log_activity($pdo, null, 'doctor_schedule_requested', "Doctor #$doctorId submitted schedule request #$requestId ($days).");
    $pdo->commit();
    json_out(['success' => true, 'request_id' => $requestId, 'message' => 'Your schedule request was sent to the coordinator.']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail($e);
}
