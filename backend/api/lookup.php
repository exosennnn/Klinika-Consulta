<?php
require_once __DIR__ . '/../db.php';

$ref = strtoupper(trim((string)($_GET['ref'] ?? '')));
$contact = preg_replace('/\D+/', '', (string)($_GET['contact'] ?? ''));
if (strlen($contact) === 12 && substr($contact, 0, 3) === '639') $contact = '0' . substr($contact, 2);
if (strlen($contact) === 10 && $contact[0] === '9') $contact = '0' . $contact;
if ($ref === '' || $contact === '') {
    json_out(['success' => false, 'message' => 'Provide the Reference Code and Contact Number.'], 422);
}
try {
    $wait = rate_limit_wait($pdo, 'lookup', '-', 10, 15);
    if ($wait > 0) json_out(['success' => false, 'message' => 'Too many lookups. Please try again later.'], 429);
    $s = $pdo->prepare("SELECT a.*, d.name AS doctor_name, d.room_number, s.name AS specialty_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN specialties s ON a.specialty_id = s.id
        WHERE UPPER(TRIM(a.reference_code)) = ? AND REPLACE(REPLACE(REPLACE(a.contact_number,' ',''),'-',''),'+','') = ?");
    $s->execute([$ref, $contact]);
    $row = $s->fetch();
    if ($row) {
        // Public tracking must not expose private contact, visit notes, or internal coordinator data.
        $safe = array_intersect_key($row, array_flip(['reference_code','status','doctor_name','specialty_name','appointment_date','appointment_time','room_number','followup_timeframe']));
        json_out(['success' => true, 'appointment' => $safe]);
    }
    rate_limit_hit($pdo, 'lookup', '-');
    json_out(['success' => false, 'message' => 'No appointment found for the details provided.'], 404);
} catch (Throwable $e) {
    fail($e);
}
