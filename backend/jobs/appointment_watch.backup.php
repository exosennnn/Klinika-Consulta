<?php
// Run from Windows Task Scheduler using PHP CLI, once per hour.
// Sends patient appointment reminders within 24 hours; reminds doctors after
// 12 hours pending and escalates unreviewed requests after 24 hours.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/otp_provider.php';
try {
    $guestEmailSent = 0;
    $guestEmailFailed = 0;
    $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Manila'));
    $reminderRangeEnd = $now->modify('+24 hours');

    try {
        $guestCandidates = $pdo->prepare("SELECT id FROM appointments
            WHERE patient_id IS NULL AND status = 'Booked'
              AND email_address IS NOT NULL AND TRIM(email_address) <> ''
              AND contact_verified = 1 AND verification_channel = 'email'
              AND reminder_email_sent_at IS NULL
              AND appointment_date BETWEEN ? AND ?");
        $guestCandidates->execute([$now->format('Y-m-d'), $reminderRangeEnd->format('Y-m-d')]);
        $guestAppointmentIds = $guestCandidates->fetchAll(PDO::FETCH_COLUMN);

        foreach ($guestAppointmentIds as $candidateId) {
            try {
                $pdo->beginTransaction();
                $guestAppointment = $pdo->prepare("SELECT id, reference_code, email_address, appointment_date, appointment_time
                    FROM appointments
                    WHERE id = ? AND patient_id IS NULL AND status = 'Booked'
                      AND email_address IS NOT NULL AND TRIM(email_address) <> ''
                      AND contact_verified = 1 AND verification_channel = 'email'
                      AND reminder_email_sent_at IS NULL
                    FOR UPDATE");
                $guestAppointment->execute([(int)$candidateId]);
                $appointment = $guestAppointment->fetch(PDO::FETCH_ASSOC);
                if (!$appointment || trim((string)$appointment['reference_code']) === '') {
                    $pdo->commit();
                    continue;
                }

                $appointmentAt = DateTimeImmutable::createFromFormat(
                    '!Y-m-d H:i:s',
                    $appointment['appointment_date'] . ' ' . $appointment['appointment_time'],
                    new DateTimeZone('Asia/Manila')
                );
                $secondsUntilAppointment = $appointmentAt
                    ? $appointmentAt->getTimestamp() - $now->getTimestamp()
                    : 0;
                if ($secondsUntilAppointment <= 0 || $secondsUntilAppointment > 86400) {
                    $pdo->commit();
                    continue;
                }

                [$sent] = dm_send_email_reminder(
                    (string)$appointment['email_address'],
                    (string)$appointment['reference_code'],
                    (string)$appointment['appointment_date'],
                    substr((string)$appointment['appointment_time'], 0, 5)
                );
                if (!$sent) {
                    $pdo->rollBack();
                    $guestEmailFailed++;
                    continue;
                }

                $markSent = $pdo->prepare('UPDATE appointments SET reminder_email_sent_at = NOW() WHERE id = ? AND reminder_email_sent_at IS NULL');
                $markSent->execute([(int)$appointment['id']]);
                if ($markSent->rowCount() !== 1) {
                    throw new RuntimeException('Guest reminder sent marker was not saved.');
                }
                $pdo->commit();
                $guestEmailSent++;
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                error_log('[Klinika Consulta] Guest appointment reminder failed for appointment #' . (int)$candidateId . '.');
                $guestEmailFailed++;
            }
        }
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('[Klinika Consulta] Guest appointment reminder query failed. Check database schema and PHP error logs.');
        $guestEmailFailed++;
    }

    $reminderQuery = $pdo->prepare("SELECT a.id,a.reference_code,a.patient_id,a.appointment_date,a.appointment_time,d.name AS doctor_name
        FROM appointments a JOIN doctors d ON d.id=a.doctor_id
        WHERE a.status='Booked' AND a.patient_id IS NOT NULL AND a.reference_code IS NOT NULL
          AND a.reference_code<>'' AND a.appointment_date BETWEEN ? AND ?");
    $reminderQuery->execute([$now->format('Y-m-d'), $reminderRangeEnd->format('Y-m-d')]);
    $patientReminders = 0;
    $reminderExists = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE target_role='patient' AND target_user_id=? AND title=?");
    foreach ($reminderQuery->fetchAll(PDO::FETCH_ASSOC) as $appointment) {
        $appointmentAt = DateTimeImmutable::createFromFormat(
            '!Y-m-d H:i:s',
            $appointment['appointment_date'] . ' ' . $appointment['appointment_time'],
            new DateTimeZone('Asia/Manila')
        );
        if (!$appointmentAt || $appointmentAt <= $now || $appointmentAt > $reminderRangeEnd) continue;
        $title = 'Appointment reminder: ' . $appointment['reference_code'] . ' · ' .
            $appointment['appointment_date'] . ' ' . substr($appointment['appointment_time'], 0, 5);
        $reminderExists->execute([(int)$appointment['patient_id'], $title]);
        if ((int)$reminderExists->fetchColumn() > 0) continue;
        notify(
            $pdo,
            'patient',
            (int)$appointment['patient_id'],
            $title,
            "Your visit with {$appointment['doctor_name']} is scheduled for {$appointment['appointment_date']} at " .
                substr($appointment['appointment_time'], 0, 5) . '.'
        );
        $patientReminders++;
    }

    $rows = $pdo->query("SELECT a.id,a.reference_code,a.doctor_id,a.created_at,a.status FROM appointments a WHERE a.status='Pending' AND a.created_at <= DATE_SUB(NOW(),INTERVAL 12 HOUR) AND a.forwarded_to_doctor=1")->fetchAll(PDO::FETCH_ASSOC);
    $reminded=0; $escalated=0;
    foreach ($rows as $a) {
        $id=(int)$a['id'];
        $hours=(time()-strtotime($a['created_at']))/3600;
        if ($hours >= 24) {
            $pdo->beginTransaction();
            $q=$pdo->prepare("UPDATE appointments SET status='Needs_Reassignment', forwarded_to_doctor=0 WHERE id=? AND status='Pending' AND forwarded_to_doctor=1");
            $q->execute([$id]);
            if ($q->rowCount()) { notify($pdo,'coordinator',null,'Appointment Escalated',"{$a['reference_code']} has been awaiting a doctor decision for 24 hours. Reassignment is required."); $escalated++; }
            $pdo->commit();
        } else {
            $marker='12-hour reminder: '.$a['reference_code'];
            $q=$pdo->prepare('SELECT COUNT(*) FROM notifications WHERE title=? AND target_role=? AND target_user_id IN (SELECT id FROM users WHERE doctor_id=? AND role=?)');
            $q->execute([$marker,'doctor',(int)$a['doctor_id'],'doctor']);
            if (!(int)$q->fetchColumn()) { notify_doctor($pdo,(int)$a['doctor_id'],$marker,'Please review the pending appointment. It will be escalated after 24 hours.'); $reminded++; }
        }
    }
    echo "Guest reminder emails sent: $guestEmailSent; guest reminder failures: $guestEmailFailed; "
        . "patient in-app reminders: $patientReminders; 12h doctor reminders: $reminded; "
        . "24h escalations: $escalated\n";
} catch(Throwable $e) { if($pdo->inTransaction()) $pdo->rollBack(); error_log($e->getMessage()); exit(1); }
