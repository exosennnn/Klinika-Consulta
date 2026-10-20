<?php
// Centralized DB connection + helpers for all APIs
$host = '127.0.0.1';
$db   = 'klinika_consulta_db';
$user = 'root';
$pass = '';

date_default_timezone_set('Asia/Manila');

// Never show PHP errors to the browser (they leak paths and SQL); log them instead.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS'])]);
    ini_set('session.use_strict_mode', '1');
    session_start();
}

function json_out($arr, $code = 200) {
    http_response_code($code);
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_input() {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : [];
}

// Stop if not logged in (or wrong role)
function require_login(array $roles = []) {
    if (empty($_SESSION['user_id'])) {
        json_out(['success' => false, 'message' => 'Session expired. Please log in again.'], 401);
    }
    if ($roles && !in_array($_SESSION['role'], $roles, true)) {
        json_out(['success' => false, 'message' => 'You are not allowed to perform this action.'], 403);
    }
}

// Log the real error, send the browser a generic message. Duplicate-slot errors get a friendly 409.
function fail(Throwable $e, int $code = 500) {
    global $pdo;
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    $msg = $e->getMessage();
    if ($e instanceof PDOException) {
        if (strpos($msg, 'uq_active_slot') !== false) {
            json_out(['success' => false, 'message' => 'That time slot was just taken by someone else. Please choose another time.'], 409);
        }
        if (in_array((string)$e->getCode(), ['40001', '1213', '1205'], true)) {   // deadlock / lock timeout
            json_out(['success' => false, 'message' => 'The system is busy. Please try again.'], 409);
        }
    }
    error_log('[Klinika Consulta] ' . get_class($e) . ': ' . $msg . ' @ ' . basename($e->getFile()) . ':' . $e->getLine());
    json_out(['success' => false, 'message' => 'Something went wrong on the server. Please try again.'], $code);
}

// ---------- CSRF ----------
function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
// Every state-changing (non-GET) request must send the token in the X-CSRF-Token header.
function csrf_enforce() {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') return;
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($_SESSION['csrf']) || !is_string($sent) || !hash_equals($_SESSION['csrf'], $sent)) {
        json_out(['success' => false, 'message' => 'Security check failed. Please refresh the page and try again.'], 403);
    }
}
csrf_enforce();

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    error_log('[Klinika Consulta] DB connection failed: ' . $e->getMessage());
    json_out(['success' => false, 'message' => 'Cannot connect to the database. Is MySQL running?'], 500);
}

// Creates ALL missing tables (IF NOT EXISTS). Existing tables are untouched.
// Demo data is only inserted into newly created tables.
function ensure_schema(PDO $pdo) {
    $exists = function ($t) use ($pdo) {
        $s = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
        $s->execute([$t]);
        return $s->fetchColumn() > 0;
    };

    $defs = [
        'specialties' => "CREATE TABLE specialties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(255) DEFAULT NULL)",
        'doctors' => "CREATE TABLE doctors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            specialty_id INT NOT NULL,
            room_number VARCHAR(20) DEFAULT NULL,
            available_days VARCHAR(100) DEFAULT 'Mon-Fri',
            work_schedule LONGTEXT DEFAULT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Active',
            is_demo TINYINT(1) NOT NULL DEFAULT 0)",
        'users' => "CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            role VARCHAR(20) NOT NULL,
            doctor_id INT DEFAULT NULL,
            contact_number VARCHAR(20) DEFAULT NULL)",
        'appointments' => "CREATE TABLE appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reference_code VARCHAR(20) DEFAULT NULL,
            patient_id INT DEFAULT NULL,
            patient_name VARCHAR(100) NOT NULL DEFAULT '',
            contact_number VARCHAR(20) DEFAULT NULL,
            specialty_id INT DEFAULT NULL,
            doctor_id INT NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time TIME NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Pending',
            booked_by_role VARCHAR(20) DEFAULT 'patient',
            decline_reason VARCHAR(255) DEFAULT NULL,
            followup_timeframe VARCHAR(100) DEFAULT NULL,
            followup_notes TEXT DEFAULT NULL,
            forwarded_to_doctor TINYINT(1) NOT NULL DEFAULT 0,
            coordinator_note TEXT DEFAULT NULL,
            cancel_reason VARCHAR(255) DEFAULT NULL,
            patient_notified TINYINT(1) NOT NULL DEFAULT 0,
            reminder_email_sent_at DATETIME DEFAULT NULL,
            booked_email_sent_at DATETIME DEFAULT NULL,
            followup_email_sent_at DATETIME DEFAULT NULL,
            followup_relayed TINYINT(1) NOT NULL DEFAULT 0,
            parent_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_slot (doctor_id, appointment_date, appointment_time))",
        'doctor_blockouts' => "CREATE TABLE doctor_blockouts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT NOT NULL,
            block_date DATE NOT NULL,
            type VARCHAR(30) DEFAULT 'emergency',
            reason VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        'doctor_leaves' => "CREATE TABLE doctor_leaves (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT NOT NULL,
            leave_type VARCHAR(20) NOT NULL DEFAULT 'Planned',
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reason VARCHAR(255) DEFAULT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        'login_attempts' => "CREATE TABLE login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip VARCHAR(45) NOT NULL,
            username VARCHAR(50) DEFAULT NULL,
            kind VARCHAR(10) NOT NULL DEFAULT 'login',
            attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ip (ip, kind, attempted_at),
            INDEX idx_user (username, kind, attempted_at))",
        'notifications' => "CREATE TABLE notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            target_role VARCHAR(20) NOT NULL,
            target_user_id INT DEFAULT NULL,
            title VARCHAR(150) NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        'messages' => "CREATE TABLE messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT NOT NULL,
            sender_user_id INT NOT NULL,
            receiver_user_id INT NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_msg_appointment (appointment_id, created_at),
            INDEX idx_msg_receiver (receiver_user_id, is_read))",
        'guest_otp_verifications' => "CREATE TABLE guest_otp_verifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(64) NOT NULL UNIQUE,
            verification_token VARCHAR(80) DEFAULT NULL UNIQUE,
            full_name VARCHAR(100) NOT NULL,
            contact_number VARCHAR(20) NOT NULL,
            email_address VARCHAR(150) DEFAULT NULL,
            channel VARCHAR(10) NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            attempts INT NOT NULL DEFAULT 0,
            verified TINYINT(1) NOT NULL DEFAULT 0,
            expires_at DATETIME NOT NULL,
            verified_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_guest_otp_contact (contact_number, created_at))",
        'activity_logs' => "CREATE TABLE activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT DEFAULT NULL,
            user_id INT DEFAULT NULL,
            role VARCHAR(20) DEFAULT NULL,
            action VARCHAR(80) NOT NULL,
            details VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_activity_appointment (appointment_id, created_at),
            INDEX idx_activity_user (user_id, created_at))",
    ];

    $demoHash = password_hash('123456', PASSWORD_DEFAULT);   // demo accounts are hashed too
    $created = [];
    foreach ($defs as $table => $sql) {
        if (!$exists($table)) {
            $pdo->exec($sql);
            $created[] = $table;
        }
    }

    // Demo data, for newly created tables only
    if (in_array('specialties', $created, true)) {
        $pdo->exec("INSERT INTO specialties (name, description) VALUES
            ('Cardiology','Heart and blood pressure care'),
            ('Dermatology','Skin, hair and nail care'),
            ('Ophthalmology','Eye care'),
            ('Pediatrics','Care for children')");
    }
    if (in_array('doctors', $created, true)) {
        $pdo->exec("INSERT INTO doctors (name, specialty_id, room_number, available_days) VALUES
            ('Dr. Garcia (Cardiologist)', 1, 'Room 301', 'Mon,Wed,Fri'),
            ('Dr. Reyes (Dermatologist)', 2, 'Room 401', 'Tue,Thu,Sat'),
            ('Dr. Lim (Ophthalmologist)', 3, 'Room 501', 'Mon,Tue,Fri'),
            ('Dr. Cruz (Pediatrician)', 4, 'Room 201', 'Mon,Tue,Wed,Thu,Fri')");
    }
    if (in_array('users', $created, true)) {
        $pdo->exec("INSERT INTO users (username, password, full_name, role, contact_number) VALUES
            ('patient1','" . $demoHash . "','Juan Dela Cruz','patient','09123456789'),
            ('coordinator1','" . $demoHash . "','Nurse Liza Ramos','coordinator',NULL)");
        $pdo->exec("INSERT INTO users (username, password, full_name, role, doctor_id)
            SELECT 'doctor1', '" . $demoHash . "', name, 'doctor', id FROM doctors ORDER BY id LIMIT 1");
    }
    // Add missing columns to existing tables (so migrate.php is no longer needed)
    try {
        $need = [
            'appointments' => [
                'reference_code'      => 'VARCHAR(20) DEFAULT NULL',
                'patient_id'          => 'INT DEFAULT NULL',
                'patient_name'        => "VARCHAR(100) NOT NULL DEFAULT ''",
                'contact_number'      => 'VARCHAR(20) DEFAULT NULL',
                'specialty_id'        => 'INT DEFAULT NULL',
                'booked_by_role'      => "VARCHAR(20) DEFAULT 'patient'",
                'decline_reason'      => 'VARCHAR(255) DEFAULT NULL',
                'followup_timeframe'  => 'VARCHAR(100) DEFAULT NULL',
                'followup_notes'      => 'TEXT DEFAULT NULL',
                'forwarded_to_doctor' => 'TINYINT(1) NOT NULL DEFAULT 0',
                'coordinator_note'    => 'TEXT DEFAULT NULL',
                'cancel_reason'       => 'VARCHAR(255) DEFAULT NULL',
                'patient_notified'    => 'TINYINT(1) NOT NULL DEFAULT 0',
                'reminder_email_sent_at' => 'DATETIME DEFAULT NULL',
                'booked_email_sent_at' => 'DATETIME DEFAULT NULL',
                'followup_email_sent_at' => 'DATETIME DEFAULT NULL',
                'followup_relayed'    => 'TINYINT(1) NOT NULL DEFAULT 0',
                'parent_id'           => 'INT DEFAULT NULL',
                'reason_for_visit'    => 'VARCHAR(500) DEFAULT NULL',
                'email_address'       => 'VARCHAR(150) DEFAULT NULL',
                'contact_verified'    => 'TINYINT(1) NOT NULL DEFAULT 0',
                'verification_channel'=> 'VARCHAR(10) DEFAULT NULL',
            ],
            'doctors' => [
                'room_number'    => 'VARCHAR(20) DEFAULT NULL',
                'available_days' => "VARCHAR(100) DEFAULT 'Mon-Fri'",
                'work_schedule' => 'LONGTEXT DEFAULT NULL',
                'status'         => "VARCHAR(20) NOT NULL DEFAULT 'Active'",
                'is_demo'        => 'TINYINT(1) NOT NULL DEFAULT 0',
            ],
            'users' => [
                'doctor_id'      => 'INT DEFAULT NULL',
                'contact_number' => 'VARCHAR(20) DEFAULT NULL',
            ],
        ];
        foreach ($need as $table => $cols) {
            $have = $pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_COLUMN);
            foreach ($cols as $c => $ddl) {
                if (!in_array($c, $have, true)) $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$c` $ddl");
            }
        }

        // Old NOT NULL columns without a default (e.g. patient_phone) block INSERTs; make them nullable
        $keep = ['id', 'doctor_id', 'appointment_date', 'appointment_time'];
        $rows = $pdo->query("SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments'
              AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL
              AND EXTRA NOT LIKE '%auto_increment%'")->fetchAll();
        foreach ($rows as $r) {
            if (in_array($r['COLUMN_NAME'], $keep, true)) continue;
            $pdo->exec("ALTER TABLE appointments MODIFY `{$r['COLUMN_NAME']}` {$r['COLUMN_TYPE']} NULL DEFAULT NULL");
        }
    } catch (Throwable $e) { /* do not kill the request because of this */ }

    // Every doctor must have their OWN and CORRECT account (so they can see appointments forwarded to them)
    try {
        $clean = function ($name) {
            $n = preg_replace('/\(.*?\)/', '', (string)$name);          // remove the (Specialty)
            $n = preg_replace('/,?\s*M\.?D\.?\s*$/i', '', trim($n));    // remove ", M.D."
            $n = preg_replace('/^\s*Dr\.?\s*/i', '', $n);               // remove "Dr."
            return trim($n);
        };
        $surname = function ($name) use ($clean) {
            $w = preg_split('/\s+/', $clean($name), -1, PREG_SPLIT_NO_EMPTY);
            return $w ? strtolower(preg_replace('/[^a-z0-9]/i', '', end($w))) : '';
        };

        $docs = $pdo->query("SELECT id, name FROM doctors WHERE status = 'Active' ORDER BY id")->fetchAll();
        $bySurname = [];
        foreach ($docs as $dd) { $k = $surname($dd['name']); if ($k !== '') $bySurname[$k][] = (int)$dd['id']; }

        // (a) Fix wrong links: if the account surname matches exactly ONE doctor, link it to that doctor.
        //     (e.g. "doctor.mendoza" pointing to Dr. Reyes -> move to Dr. Mendoza)
        $accts = $pdo->query("SELECT id, username, full_name, doctor_id FROM users WHERE role = 'doctor' ORDER BY id")->fetchAll();
        $upd = $pdo->prepare("UPDATE users SET doctor_id = ? WHERE id = ?");
        foreach ($accts as $u) {
            $k = $surname($u['full_name']);
            if ($k !== '' && isset($bySurname[$k]) && count($bySurname[$k]) === 1) {
                $target = $bySurname[$k][0];
                if ((int)$u['doctor_id'] !== $target) $upd->execute([$target, $u['id']]);
            } elseif (empty($u['doctor_id'])) {
                // no readable surname and no link: assign to the first doctor without an account
                $free = $pdo->query("SELECT d.id FROM doctors d LEFT JOIN users x ON x.doctor_id = d.id AND x.role = 'doctor'
                    WHERE d.status = 'Active' AND x.id IS NULL ORDER BY d.id LIMIT 1")->fetchColumn();
                if ($free) $upd->execute([$free, $u['id']]);
            }
        }

        // (b) Doctors still without an account: create one (username: dr_<surname>, password: 123456 - demo only)
        $missing = $pdo->query("SELECT d.id, d.name FROM doctors d
            LEFT JOIN users u ON u.doctor_id = d.id AND u.role = 'doctor'
            WHERE d.status = 'Active' AND u.id IS NULL")->fetchAll();
        foreach ($missing as $m) {
            $slug = $surname($m['name']);
            $username = 'dr_' . ($slug !== '' ? $slug : 'doctor' . $m['id']);
            $chk = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $chk->execute([$username]);
            if ((int)$chk->fetchColumn() > 0) $username .= '_' . $m['id'];
            $pdo->prepare("INSERT INTO users (username, password, full_name, role, doctor_id) VALUES (?,?,?,'doctor',?)")
                ->execute([$username, $demoHash, $m['name'], $m['id']]);
        }

        // (c) If a doctors.user_id column exists (from the old schema), sync it with users.doctor_id
        $hasUid = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'user_id'")->fetchColumn();
        if ((int)$hasUid > 0) {
            $pdo->exec("UPDATE doctors d SET d.user_id = (SELECT MIN(u.id) FROM users u WHERE u.role = 'doctor' AND u.doctor_id = d.id)");
        }

        // (c2) Coordinator and Nurse are now one role: remove the old nurse1, convert other nurse accounts to coordinator
        $pdo->exec("DELETE FROM users WHERE role = 'nurse' AND username = 'nurse1'");
        $pdo->exec("UPDATE users SET role = 'coordinator' WHERE role = 'nurse'");
        $pdo->exec("DELETE FROM notifications WHERE target_role = 'nurse'");

        // (c3) Convert old Filipino specialty names/descriptions to English (idempotent)
        foreach ([' (Puso)', ' (Mata)', ' (Balat)', ' (Bata)'] as $suffix) {
            $pdo->prepare("UPDATE specialties SET name = REPLACE(name, ?, '') WHERE name LIKE ?")->execute([$suffix, '%' . $suffix]);
        }
        foreach ([
            'Pagtitingin sa puso%'      => 'Heart and blood pressure care',
            'Paggamot sa balat%'        => 'Skin, hair and nail care',
            'Pagtitingin at pag-alaga%' => 'Eye care',
            'Pangangalaga sa kalusugan ng mga bata%' => 'Care for children',
            'Pangkalahatang check-up%'  => 'General check-up and consultation',
        ] as $like => $en) {
            $pdo->prepare("UPDATE specialties SET description = ? WHERE description LIKE ?")->execute([$en, $like]);
        }

        // (c4) Keep the public directory broad enough for real clinic browsing.
        foreach ([
            ['General Medicine','General check-ups, primary care, and referrals'],
            ['Internal Medicine','Adult medical care and long-term condition management'],
            ['Family Medicine','Primary care for patients and families of all ages'],
            ['OB-GYN','Women’s health, pregnancy, and reproductive care'],
            ['Orthopedics','Bones, joints, muscles, and injury care'],
            ['Neurology','Brain, nerves, headaches, and neurologic concerns'],
            ['ENT','Ear, nose, throat, and related conditions'],
            ['Pulmonology','Lung and respiratory care'],
            ['Gastroenterology','Digestive system and gastrointestinal care'],
            ['Endocrinology','Hormonal, thyroid, and metabolic care']
        ] as [$sn,$sd]) {
            $q=$pdo->prepare("SELECT id FROM specialties WHERE name=? LIMIT 1"); $q->execute([$sn]);
            if(!$q->fetchColumn()) $pdo->prepare("INSERT INTO specialties(name,description) VALUES(?,?)")->execute([$sn,$sd]);
        }

        // (d) Old lowercase status ('accept') -> 'Booked'
        $pdo->exec("UPDATE appointments SET status = 'Booked' WHERE status IN ('accept','accepted','booked')");
    } catch (Throwable $e) { /* do not kill the request because of this */ }

    // Hash any leftover plain-text passwords from older versions
    try {
        $rows = $pdo->query("SELECT id, password FROM users WHERE password NOT LIKE '$2y$%'")->fetchAll();
        $up = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        foreach ($rows as $r) $up->execute([password_hash($r['password'], PASSWORD_DEFAULT), $r['id']]);
    } catch (Throwable $e) { error_log('[Klinika Consulta] password hash migration: ' . $e->getMessage()); }

    // DB-level guarantee against double booking: only one ACTIVE appointment per doctor/date/time.
    // Cancelled / Needs_Reassignment free the slot (active_slot becomes NULL, and NULLs never collide).
    try {
        $has = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'active_slot'")->fetchColumn();
        if ((int)$has === 0) {
            $pdo->exec("ALTER TABLE appointments ADD COLUMN active_slot VARCHAR(40)
                GENERATED ALWAYS AS (IF(status IN ('Cancelled','Needs_Reassignment'), NULL,
                    CONCAT(doctor_id, '|', appointment_date, '|', appointment_time))) STORED");
        }
        $idx = $pdo->query("SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND INDEX_NAME = 'uq_active_slot'")->fetchColumn();
        if ((int)$idx === 0) $pdo->exec("ALTER TABLE appointments ADD UNIQUE KEY uq_active_slot (active_slot)");
    } catch (Throwable $e) {
        // Usually means old data already has duplicate active slots; clean those up and reload.
        error_log('[Klinika Consulta] unique slot index not created: ' . $e->getMessage());
    }

    return $created;
}

// ---------- Shared helpers ----------
function notify(PDO $pdo, string $role, $userId, string $title, string $message) {
    $pdo->prepare("INSERT INTO notifications (target_role, target_user_id, title, message) VALUES (?,?,?,?)")
        ->execute([$role, $userId, $title, $message]);
}

function log_activity(PDO $pdo, ?int $appointmentId, string $action, string $details = '') {
    try {
        $uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
        $role = $_SESSION['role'] ?? null;
        $pdo->prepare("INSERT INTO activity_logs (appointment_id,user_id,role,action,details) VALUES (?,?,?,?,?)")
            ->execute([$appointmentId, $uid, $role, $action, $details !== '' ? $details : null]);
    } catch (Throwable $e) { error_log('[Klinika Consulta] activity log: ' . $e->getMessage()); }
}

// Notify the user account(s) linked to the doctor
function notify_doctor(PDO $pdo, int $doctorId, string $title, string $message) {
    $s = $pdo->prepare("SELECT id FROM users WHERE role = 'doctor' AND doctor_id = ?");
    $s->execute([$doctorId]);
    foreach ($s->fetchAll(PDO::FETCH_COLUMN) as $uid) {
        notify($pdo, 'doctor', (int)$uid, $title, $message);
    }
}

// Block the leave dates and mark affected appointments for reassignment
function apply_leave_block(PDO $pdo, int $doctorId, string $start, string $end, string $reason, string $type): int {
    $period = new DatePeriod(new DateTime($start), new DateInterval('P1D'), (new DateTime($end))->modify('+1 day'));
    $chk = $pdo->prepare("SELECT COUNT(*) FROM doctor_blockouts WHERE doctor_id = ? AND block_date = ?");
    $ins = $pdo->prepare("INSERT INTO doctor_blockouts (doctor_id, block_date, type, reason) VALUES (?,?,?,?)");
    foreach ($period as $day) {
        $d = $day->format('Y-m-d');
        $chk->execute([$doctorId, $d]);
        if ((int)$chk->fetchColumn() === 0) $ins->execute([$doctorId, $d, $type, $reason]);
    }
    $u = $pdo->prepare("UPDATE appointments SET status = 'Needs_Reassignment', forwarded_to_doctor = 0, decline_reason = ?
        WHERE doctor_id = ? AND appointment_date BETWEEN ? AND ? AND status IN ('Pending','Booked','Proposed')");
    $u->execute(['Doctor unavailable (' . $reason . ')', $doctorId, $start, $end]);
    return $u->rowCount();
}

// Create any missing table (existing ones are untouched)
try {
    ensure_schema($pdo);
} catch (Throwable $e) {
    error_log('[Klinika Consulta] Schema setup failed: ' . $e->getMessage());
    json_out(['success' => false, 'message' => 'Database setup failed. Check the PHP error log.'], 500);
}

// ---------- Schedule helpers ----------
// Appointments start every 30 minutes during clinic hours; the lunch break is excluded.
function clinic_slots(): array {
    $windows = [['09:00', '12:00'], ['13:30', '16:00']];
    $slots = [];
    foreach ($windows as [$start, $end]) {
        [$hour, $minute] = array_map('intval', explode(':', $start));
        [$endHour, $endMinute] = array_map('intval', explode(':', $end));
        $startMinutes = $hour * 60 + $minute;
        $endMinutes = $endHour * 60 + $endMinute;
        for ($minutes = $startMinutes; $minutes < $endMinutes; $minutes += 30) {
            $slots[] = sprintf('%02d:%02d:00', intdiv($minutes, 60), $minutes % 60);
        }
    }
    return $slots;
}

function clinic_slot_windows(): array {
    return [['09:00', '12:00'], ['13:30', '16:00']];
}

function doctor_schedule($stored): ?array {
    if (!is_string($stored) || $stored === '') return null;
    $schedule = json_decode($stored, true);
    return is_array($schedule) ? $schedule : null;
}

function doctor_day_slots(?array $schedule, int $weekday): array {
    $periods = $schedule[$weekday] ?? null;
    if ($periods === null) $periods = [
        ['start' => '09:00', 'end' => '12:00'],
        ['start' => '13:30', 'end' => '16:00'],
    ];
    $slots = [];
    foreach (clinic_slots() as $time) {
        $start = substr($time, 0, 5);
        $endMinutes = ((int)substr($time, 0, 2) * 60) + (int)substr($time, 3, 2) + 30;
        $end = sprintf('%02d:%02d', intdiv($endMinutes, 60), $endMinutes % 60);
        foreach ($periods as $period) {
            if (is_array($period) && isset($period['start'], $period['end']) &&
                $start >= $period['start'] && $end <= $period['end']) {
                $slots[] = $time;
                break;
            }
        }
    }
    return $slots;
}

function validate_doctor_work_schedule($daysInput, $scheduleInput): array {
    $days = array_values(array_unique(array_map('intval', (array)$daysInput)));
    $validDays = [1, 2, 3, 4, 5, 6, 7];
    if (!$days || array_diff($days, $validDays)) {
        return ['error' => 'Select at least one valid workday.'];
    }
    sort($days);
    if (!is_array($scheduleInput)) return ['error' => 'Set work hours for each selected day.'];

    $schedule = [];
    foreach ($days as $day) {
        $periods = $scheduleInput[$day] ?? $scheduleInput[(string)$day] ?? null;
        if (!is_array($periods) || count($periods) < 1 || count($periods) > 2) {
            return ['error' => 'Each workday needs one or two work periods.'];
        }
        $normalized = [];
        foreach ($periods as $period) {
            if (!is_array($period)) return ['error' => 'Invalid work period.'];
            $start = (string)($period['start'] ?? '');
            $end = (string)($period['end'] ?? '');
            if (!preg_match('/^(?:09|10|11|13|14|15):(?:00|30)$/D', $start) &&
                !preg_match('/^13:(?:30)$/D', $start)) {
                return ['error' => 'Work periods must start on a clinic 30-minute time.'];
            }
            if (!preg_match('/^(?:09|10|11|12|13|14|15|16):(?:00|30)$/D', $end)) {
                return ['error' => 'Work periods must end on a clinic 30-minute time.'];
            }
            $validWindow = false;
            foreach (clinic_slot_windows() as [$windowStart, $windowEnd]) {
                if ($start >= $windowStart && $end <= $windowEnd && $start < $end) {
                    $validWindow = true;
                    break;
                }
            }
            if (!$validWindow) return ['error' => 'Work periods must fit within a clinic session and cannot include the lunch closure.'];
            $normalized[] = ['start' => $start, 'end' => $end];
        }
        usort($normalized, fn($a, $b) => strcmp($a['start'], $b['start']));
        if (count($normalized) === 2 && $normalized[0]['end'] > $normalized[1]['start']) {
            return ['error' => 'Work periods cannot overlap.'];
        }
        $schedule[$day] = $normalized;
    }
    return ['days' => $days, 'schedule' => $schedule];
}

// "Mon,Wed,Fri" o "Mon-Fri" -> [1,3,5]  (1=Mon ... 7=Sun). If unreadable: Mon-Fri.
function doctor_workdays($str): array {
    $map = ['mon' => 1, 'tue' => 2, 'wed' => 3, 'thu' => 4, 'fri' => 5, 'sat' => 6, 'sun' => 7];
    $days = [];
    foreach (explode(',', strtolower((string)$str)) as $tok) {
        $tok = trim($tok);
        if ($tok === '') continue;
        if (strpos($tok, '-') !== false) {
            $parts = array_map('trim', explode('-', $tok, 2));
            $a = $map[substr($parts[0], 0, 3)] ?? null;
            $b = $map[substr($parts[1], 0, 3)] ?? null;
            if ($a && $b) {
                $i = $a;
                for ($n = 0; $n < 7; $n++) {
                    $days[] = $i;
                    if ($i === $b) break;
                    $i = $i % 7 + 1;
                }
            }
        } elseif (isset($map[substr($tok, 0, 3)])) {
            $days[] = $map[substr($tok, 0, 3)];
        }
    }
    $days = array_values(array_unique($days));
    return $days ?: [1, 2, 3, 4, 5];
}

// Any problem with the slot? Returns the message, or null if OK. (workday, blockout/leave, already taken)
function slot_problem(PDO $pdo, int $doctorId, string $date, string $time, int $excludeId = 0): ?string {
    if (!in_array($time, clinic_slots(), true)) {
        return 'Choose an available 30-minute appointment time during clinic hours.';
    }
    if ($date === date('Y-m-d') && $time <= date('H:i:s')) {
        return 'That appointment time has already passed. Choose a later time.';
    }

    $s = $pdo->prepare("SELECT available_days, work_schedule FROM doctors WHERE id = ? AND status = 'Active'");
    $s->execute([$doctorId]);
    $row = $s->fetch();
    if (!$row) return 'Doctor not found.';

    $dow = (int)date('N', strtotime($date));
    if (!in_array($dow, doctor_workdays($row['available_days']), true)) {
        return 'That date is not a workday for the doctor.';
    }
    $schedule = doctor_schedule($row['work_schedule']);
    if (!in_array($time, doctor_day_slots($schedule, $dow), true)) {
        return 'That time is outside the doctor’s scheduled work hours.';
    }
    $b = $pdo->prepare("SELECT COUNT(*) FROM doctor_blockouts WHERE doctor_id = ? AND block_date = ?");
    $b->execute([$doctorId, $date]);
    if ((int)$b->fetchColumn() > 0) return 'The doctor is not available on that date.';

    $c = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
        AND status NOT IN ('Cancelled','Needs_Reassignment') AND id != ?");
    $c->execute([$doctorId, $date, $time, $excludeId]);
    if ((int)$c->fetchColumn() > 0) return 'That time slot is already taken.';
    return null;
}

function new_reference(PDO $pdo): string {
    do {
        $ref = 'REF-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        $c = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE reference_code = ?");
        $c->execute([$ref]);
    } while ((int)$c->fetchColumn() > 0);
    return $ref;
}


// ---------- Rate limiting (login / register) ----------
function client_ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45); }

// Returns seconds to wait (0 = allowed). $max failures per $windowMin minutes, per IP+username and per IP overall.
// All time math is done inside MySQL so PHP/MySQL timezone differences cannot skew it.
function rate_limit_wait(PDO $pdo, string $kind, string $username, int $max = 5, int $windowMin = 15): int {
    $pdo->exec("DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)");
    $q = $pdo->prepare("SELECT COUNT(*), TIMESTAMPDIFF(SECOND, NOW(), MIN(attempted_at) + INTERVAL $windowMin MINUTE)
        FROM login_attempts
        WHERE kind = ? AND ip = ? AND username = ? AND attempted_at > (NOW() - INTERVAL $windowMin MINUTE)");
    $q->execute([$kind, client_ip(), $username]);
    [$n, $secs] = $q->fetch(PDO::FETCH_NUM);
    $q2 = $pdo->prepare("SELECT COUNT(*) FROM login_attempts
        WHERE kind = ? AND ip = ? AND attempted_at > (NOW() - INTERVAL $windowMin MINUTE)");
    $q2->execute([$kind, client_ip()]);
    $ipTotal = (int)$q2->fetchColumn();
    if ((int)$n >= $max) return max(30, (int)$secs);
    if ($ipTotal >= $max * 4) return $windowMin * 60;
    return 0;
}
function rate_limit_hit(PDO $pdo, string $kind, string $username) {
    $pdo->prepare("INSERT INTO login_attempts (ip, username, kind) VALUES (?,?,?)")->execute([client_ip(), $username, $kind]);
}
function rate_limit_clear(PDO $pdo, string $kind, string $username) {
    $pdo->prepare("DELETE FROM login_attempts WHERE kind = ? AND ip = ? AND username = ?")->execute([$kind, client_ip(), $username]);
}
