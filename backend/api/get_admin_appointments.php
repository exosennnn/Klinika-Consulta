<?php
require_once __DIR__ . '/../db.php';
require_login();

try {
    $sql = "SELECT a.*, d.name AS doctor_name, s.name AS specialty_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN specialties s ON a.specialty_id = s.id";
    $params = [];

    // Each role sees only its own data
    if ($_SESSION['role'] === 'patient') {
        $sql .= " WHERE a.patient_id = ? AND NOT (a.status = 'Proposed' AND a.patient_notified = 0)";
        $params[] = $_SESSION['user_id'];
    } elseif ($_SESSION['role'] === 'doctor') {
        $sql .= " WHERE a.doctor_id = ? AND (a.forwarded_to_doctor = 1 OR a.status <> 'Pending') AND NOT (a.status = 'Proposed' AND a.patient_notified = 0)";
        $params[] = $_SESSION['doctor_id'];
    }
    $sql .= " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    $s = $pdo->prepare($sql);
    $s->execute($params);
    $rows = $s->fetchAll();

    if ($_SESSION['role'] === 'patient') {
        $active = $pdo->prepare("SELECT COUNT(*) FROM appointments
            WHERE patient_id = ? AND status NOT IN ('Completed', 'Cancelled')");
        $active->execute([$_SESSION['user_id']]);
        $hasActiveAppointment = (int)$active->fetchColumn() > 0;

        foreach ($rows as &$r) {
            // Keep workflow progress visible to the patient while preserving the Coordinator as the relay point.
            $relayed = (int)$r['patient_notified'] === 1 || $r['booked_by_role'] !== 'patient';
            $r['doctor_accepted'] = ($r['status'] === 'Booked' && !$relayed) ? 1 : 0;
            $r['needs_reassignment'] = $r['status'] === 'Needs_Reassignment' ? 1 : 0;
            if ($r['status'] === 'Needs_Reassignment' || ($r['status'] === 'Booked' && !$relayed)) $r['status'] = 'Pending';
            // Do NOT hide forwarded_to_doctor: the patient tracker needs it to show Coordinator -> Doctor Review progress.
            $r['decline_reason'] = null;
            $r['coordinator_note'] = null;
            // Doctor follow-up advice is visible to the patient immediately after it is saved.
            // followup_relayed is reserved for the coordinator's follow-up scheduling workflow.
        }
        unset($r);
    }
    json_out([
        'success' => true,
        'appointments' => $rows,
        'has_active_appointment' => $_SESSION['role'] === 'patient' ? $hasActiveAppointment : null
    ]);
} catch (Throwable $e) {
    fail($e);
}
