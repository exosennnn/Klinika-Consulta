<?php
require_once __DIR__ . '/../db.php';
require_login(['coordinator']);

try {
    $days = filter_var($_GET['days'] ?? '30', FILTER_VALIDATE_INT);
    if (!in_array($days, [30, 90, 365], true)) {
        json_out(['success' => false, 'message' => 'Choose a 30, 90, or 365-day report period.'], 422);
    }
    $start = (new DateTimeImmutable('today'))->modify('-' . ($days - 1) . ' days')->format('Y-m-d');
    $end = date('Y-m-d');

    $summaryQuery = $pdo->prepare("SELECT COUNT(*) AS total,
        SUM(status = 'Completed') AS completed,
        SUM(status = 'Cancelled') AS cancelled,
        SUM(status = 'Booked') AS booked,
        SUM(status = 'Checked_In') AS checked_in,
        SUM(status = 'Needs_Reassignment') AS needs_reassignment,
        SUM(status = 'Pending') AS pending,
        SUM(booked_by_role = 'coordinator') AS walk_ins,
        SUM(followup_timeframe IS NOT NULL AND followup_timeframe <> '') AS followups
        FROM appointments WHERE appointment_date BETWEEN ? AND ?");
    $summaryQuery->execute([$start, $end]);
    $summary = $summaryQuery->fetch();
    $total = (int)$summary['total'];
    $summary = array_map('intval', $summary);
    $summary['completion_rate'] = $total > 0 ? (int)round($summary['completed'] * 100 / $total) : 0;

    $specialtyQuery = $pdo->prepare("SELECT s.name, COUNT(a.id) AS count
        FROM appointments a JOIN specialties s ON s.id = a.specialty_id
        WHERE a.appointment_date BETWEEN ? AND ?
        GROUP BY s.id, s.name ORDER BY count DESC, s.name");
    $specialtyQuery->execute([$start, $end]);
    $specialties = array_map(static function ($row) use ($total) {
        $row['count'] = (int)$row['count'];
        $row['percent'] = $total > 0 ? (int)round($row['count'] * 100 / $total) : 0;
        return $row;
    }, $specialtyQuery->fetchAll());

    $trendQuery = $pdo->prepare("SELECT appointment_date AS date, COUNT(*) AS total,
        SUM(status = 'Completed') AS completed, SUM(status = 'Cancelled') AS cancelled,
        SUM(status IN ('Pending', 'Needs_Reassignment')) AS needs_action
        FROM appointments WHERE appointment_date BETWEEN ? AND ?
        GROUP BY appointment_date ORDER BY appointment_date");
    $trendQuery->execute([$start, $end]);
    $trend = array_map(static function ($row) {
        foreach (['total', 'completed', 'cancelled', 'needs_action'] as $key) $row[$key] = (int)$row[$key];
        return $row;
    }, $trendQuery->fetchAll());

    $doctors = $pdo->query("SELECT id, available_days FROM doctors WHERE status = 'Active'")->fetchAll();
    $todayNumber = (int)date('N');
    $scheduledToday = 0;
    $scheduledDoctorIds = [];
    foreach ($doctors as $doctor) {
        if (in_array($todayNumber, doctor_workdays($doctor['available_days']), true)) {
            $scheduledToday++;
            $scheduledDoctorIds[(int)$doctor['id']] = true;
        }
    }
    $blockouts = $pdo->prepare('SELECT DISTINCT doctor_id FROM doctor_blockouts WHERE block_date = ?');
    $blockouts->execute([$end]);
    $blockedToday = 0;
    foreach ($blockouts->fetchAll(PDO::FETCH_COLUMN) as $doctorId) {
        if (isset($scheduledDoctorIds[(int)$doctorId])) $blockedToday++;
    }

    json_out([
        'success' => true,
        'period' => ['days' => $days, 'start' => $start, 'end' => $end],
        'summary' => $summary,
        'specialties' => $specialties,
        'trend' => $trend,
        'availability' => [
            'active_doctors' => count($doctors),
            'scheduled_today' => $scheduledToday,
            'blocked_today' => $blockedToday,
        ],
    ]);
} catch (Throwable $e) {
    fail($e);
}
