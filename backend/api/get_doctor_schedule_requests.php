<?php
require_once __DIR__ . '/../db.php';
require_login(['doctor']);

try {
    $query = $pdo->prepare("SELECT id, requested_days, requested_schedule, reason, status, created_at, reviewed_at
        FROM doctor_schedule_requests
        WHERE doctor_id = ?
        ORDER BY id DESC
        LIMIT 10");
    $query->execute([(int)($_SESSION['doctor_id'] ?? 0)]);
    $requests = $query->fetchAll();
    foreach ($requests as &$request) {
        $request['workdays'] = doctor_workdays($request['requested_days']);
        $request['work_schedule'] = doctor_schedule($request['requested_schedule']);
    }
    unset($request);
    json_out(['success' => true, 'requests' => $requests]);
} catch (Throwable $e) {
    fail($e);
}
