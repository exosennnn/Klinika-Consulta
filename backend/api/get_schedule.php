<?php
// Schedule of all doctors (for the Coordinator): workdays + upcoming blockouts
require_once __DIR__ . '/../db.php';
require_login(['coordinator']);

try {
    $docs = $pdo->query("SELECT d.id, d.name, d.room_number, d.available_days, d.work_schedule, sp.name AS specialty_name
        FROM doctors d JOIN specialties sp ON d.specialty_id = sp.id
        WHERE d.status = 'Active' ORDER BY d.name")->fetchAll();

    $b = $pdo->prepare("SELECT id, doctor_id, block_date, type, reason FROM doctor_blockouts
        WHERE block_date >= ? ORDER BY block_date");
    $b->execute([date('Y-m-d')]);
    $by = [];
    foreach ($b->fetchAll() as $row) $by[$row['doctor_id']][] = $row;

    foreach ($docs as &$d) {
        $d['workdays'] = doctor_workdays($d['available_days']);
        $d['work_schedule'] = doctor_schedule($d['work_schedule']);
        $d['work_slots'] = [];
        foreach ($d['workdays'] as $day) $d['work_slots'][$day] = doctor_day_slots($d['work_schedule'], $day);
        $d['blockouts'] = $by[$d['id']] ?? [];
    }
    unset($d);
    json_out(['success' => true, 'doctors' => $docs]);
} catch (Throwable $e) {
    fail($e);
}
