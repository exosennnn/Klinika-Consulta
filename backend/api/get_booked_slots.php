<?php
// Taken times + whether the doctor is unavailable on that date (leave/blockout or non-workday)
require_once __DIR__ . '/../db.php';
require_login();

$doctor_id = (int)($_GET['doctor_id'] ?? 0);
$date = $_GET['date'] ?? '';
if (!$doctor_id || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    json_out(['success' => false, 'message' => 'Select a valid doctor and date.'], 422);
}
$parsedDate = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
if (!$parsedDate || $parsedDate->format('Y-m-d') !== $date) {
    json_out(['success' => false, 'message' => 'Select a valid date.'], 422);
}
try {
    $s = $pdo->prepare("SELECT appointment_time FROM appointments
        WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('Cancelled','Needs_Reassignment')");
    $s->execute([$doctor_id, $date]);
    $taken = $s->fetchAll(PDO::FETCH_COLUMN);

    $b = $pdo->prepare("SELECT COUNT(*) FROM doctor_blockouts WHERE doctor_id = ? AND block_date = ?");
    $b->execute([$doctor_id, $date]);
    $blocked = $b->fetchColumn() > 0;

    $d = $pdo->prepare("SELECT available_days, work_schedule FROM doctors WHERE id = ? AND status = 'Active'");
    $d->execute([$doctor_id]);
    $doctor = $d->fetch();
    if (!$doctor) {
        json_out(['success' => false, 'message' => 'Doctor not found.'], 404);
    }
    $weekday = (int)$parsedDate->format('N');
    if (!in_array($weekday, doctor_workdays($doctor['available_days']), true)) $blocked = true;
    $slots = doctor_day_slots(doctor_schedule($doctor['work_schedule']), $weekday);
    if (!$slots) $blocked = true;

    json_out(['success' => true, 'taken' => $taken, 'slots' => $slots, 'blocked' => $blocked]);
} catch (Throwable $e) {
    fail($e);
}
