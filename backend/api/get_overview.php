<?php
require_once __DIR__ . '/../db.php';

try {
    $specialties = $pdo->query("SELECT * FROM specialties ORDER BY name")->fetchAll();
    $doctors = $pdo->query("SELECT d.id, d.name, d.specialty_id, d.room_number, d.available_days, d.work_schedule, s.name AS specialty_name
        FROM doctors d JOIN specialties s ON d.specialty_id = s.id
        WHERE d.status = 'Active' ORDER BY d.name")->fetchAll();
    foreach ($doctors as &$doctor) {
        $doctor['workdays'] = doctor_workdays($doctor['available_days']);
        $doctor['work_schedule'] = doctor_schedule($doctor['work_schedule']);
    }
    unset($doctor);
    json_out(['success' => true, 'specialties' => $specialties, 'doctors' => $doctors]);
} catch (Throwable $e) {
    fail($e);
}
