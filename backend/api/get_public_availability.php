<?php
// Public read-only availability for active doctors over the next 30 days.
require_once __DIR__ . '/../db.php';

try {
    $today = new DateTimeImmutable('today');
    $lastDate = $today->modify('+30 days');
    $start = $today->format('Y-m-d');
    $end = $lastDate->format('Y-m-d');

    $doctors = $pdo->query("SELECT id, available_days, work_schedule FROM doctors WHERE status = 'Active'")->fetchAll();
    $appointments = $pdo->prepare("SELECT doctor_id, appointment_date, appointment_time FROM appointments
        WHERE appointment_date BETWEEN ? AND ? AND status NOT IN ('Cancelled','Needs_Reassignment')");
    $appointments->execute([$start, $end]);
    $taken = [];
    foreach ($appointments->fetchAll() as $appointment) {
        $date = (string)$appointment['appointment_date'];
        $time = substr((string)$appointment['appointment_time'], 0, 8);
        $taken[(int)$appointment['doctor_id']][$date][$time] = true;
    }

    $blockouts = $pdo->prepare("SELECT doctor_id, block_date FROM doctor_blockouts WHERE block_date BETWEEN ? AND ?");
    $blockouts->execute([$start, $end]);
    $blocked = [];
    foreach ($blockouts->fetchAll() as $blockout) {
        $blocked[(int)$blockout['doctor_id']][(string)$blockout['block_date']] = true;
    }

    $availability = [];
    foreach ($doctors as $doctor) {
        $doctorId = (int)$doctor['id'];
        $workdays = doctor_workdays($doctor['available_days']);
        $workSchedule = doctor_schedule($doctor['work_schedule']);
        $dates = [];
        for ($date = $today; $date <= $lastDate; $date = $date->modify('+1 day')) {
            $isoDate = $date->format('Y-m-d');
            if (!in_array((int)$date->format('N'), $workdays, true) || isset($blocked[$doctorId][$isoDate])) {
                continue;
            }

            $openSlots = [];
            foreach (doctor_day_slots($workSchedule, (int)$date->format('N')) as $time) {
                $slotDateTime = $isoDate . ' ' . $time;
                if (!isset($taken[$doctorId][$isoDate][$time]) &&
                    !($isoDate === $today->format('Y-m-d') && $slotDateTime <= date('Y-m-d H:i:s'))) {
                    $openSlots[] = [
                        'value' => $time,
                        'label' => $date->setTime(
                            (int)substr($time, 0, 2),
                            (int)substr($time, 3, 2)
                        )->format('h:i A')
                    ];
                }
            }
            if ($openSlots) {
                $dates[] = [
                    'date' => $isoDate,
                    'label' => $date->format('D, M j'),
                    'slots' => $openSlots
                ];
            }
        }
        $availability[$doctorId] = $dates;
    }

    json_out(['success' => true, 'availability' => $availability, 'through' => $end]);
} catch (Throwable $e) {
    fail($e);
}
