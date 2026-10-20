<?php
// Klinika Consulta integration tests (run against your local XAMPP install).
//   php tests/run_tests.php [base_url]        default base_url: http://localhost/klinika_consulta
// Needs: PHP CLI with the curl extension, Apache + MySQL running.
// It creates a few throw-away patient accounts (test_*) and cancels the appointment it books.

$base = rtrim($argv[1] ?? 'http://localhost/klinika_consulta', '/') . '/backend/api/';
$pass = 0; $failN = 0;
function check(string $name, bool $ok, string $extra = '') {
    global $pass, $failN;
    $ok ? $pass++ : $failN++;
    echo ($ok ? "  [PASS] " : "  [FAIL] ") . $name . ($ok || $extra === '' ? '' : "  -> $extra") . "\n";
}

// A tiny browser: own cookie jar, remembers the CSRF token.
class Client {
    public $jar; public $csrf = '';
    function __construct() { $this->jar = tempnam(sys_get_temp_dir(), 'dm'); }
    function handle(string $ep, ?array $body = null, bool $sendCsrf = true) {
        $ch = curl_init($GLOBALS['base'] . $ep);
        $this->setup($ch, $ep, $body, $sendCsrf);
        $raw = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
        return $this->parse($raw, $code);
    }
    function setup($ch, $ep, $body, $sendCsrf) {
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_COOKIEJAR => $this->jar, CURLOPT_COOKIEFILE => $this->jar]);
        if ($body !== null) {
            $h = ['Content-Type: application/json'];
            if ($sendCsrf) $h[] = 'X-CSRF-Token: ' . $this->csrf;
            curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($body), CURLOPT_HTTPHEADER => $h]);
        }
    }
    function parse($raw, $code) {
        $d = json_decode((string)$raw, true) ?: [];
        if (!empty($d['csrf'])) $this->csrf = $d['csrf'];
        $d['_code'] = $code; $d['_raw'] = $raw;
        return $d;
    }
    function start() { return $this->handle('check_session.php'); }
}

echo "\n== 1. CSRF ==\n";
$c = new Client(); $c->start();
$publicAvailability = (new Client())->handle('get_public_availability.php');
$availabilitySlots = ['09:00:00','09:30:00','10:00:00','10:30:00','11:00:00','11:30:00','13:30:00','14:00:00','14:30:00','15:00:00','15:30:00'];
$validPublicAvailability = !empty($publicAvailability['success']) && !empty($publicAvailability['availability']);
foreach (($publicAvailability['availability'] ?? []) as $doctorDates) {
    foreach ($doctorDates as $availableDate) {
        $validPublicAvailability = $validPublicAvailability &&
            ($availableDate['date'] >= date('Y-m-d')) &&
            ($availableDate['date'] <= date('Y-m-d', strtotime('+30 days'))) &&
            !empty($availableDate['slots']);
        foreach (($availableDate['slots'] ?? []) as $availableSlot) {
            $validPublicAvailability = $validPublicAvailability &&
                in_array($availableSlot['value'] ?? '', $availabilitySlots, true);
        }
    }
}
check('public doctor availability is available without login and limited to open 30-minute slots in the next 30 days',
    ($publicAvailability['_code'] ?? 0) === 200 && $validPublicAvailability, $publicAvailability['_raw'] ?? '');
$coordinator = new Client();
$coordinator->start();
$coordinatorLogin = $coordinator->handle('login.php', ['username' => 'coordinator1', 'password' => '123456']);
$invalidDoctorAccount = $coordinator->handle('coordinator_actions.php', [
    'action' => 'create_doctor_account', 'name' => 'Dr. Test Doctor',
    'username' => 'test_doctor_' . bin2hex(random_bytes(3)), 'password' => 'short',
    'specialty_id' => 1, 'days' => [1, 2, 3]
]);
check('coordinator doctor account creation rejects passwords under 8 characters',
    ($invalidDoctorAccount['_code'] ?? 0) === 422);
$longDoctorPassword = $coordinator->handle('coordinator_actions.php', [
    'action' => 'create_doctor_account', 'name' => 'Dr. Test Doctor',
    'username' => 'test_doctor_' . bin2hex(random_bytes(3)), 'password' => str_repeat('x', 73),
    'specialty_id' => 1, 'days' => [1, 2, 3]
]);
check('coordinator doctor account creation rejects passwords over 72 characters',
    ($longDoctorPassword['_code'] ?? 0) === 422);
$invalidDoctorHours = $coordinator->handle('coordinator_actions.php', [
    'action' => 'create_doctor_account', 'name' => 'Dr. Test Doctor',
    'username' => 'test_doctor_' . bin2hex(random_bytes(3)), 'password' => 'valid-password',
    'specialty_id' => 1, 'days' => [1],
    'work_schedule' => ['1' => [['start' => '11:30', 'end' => '14:00']]]
]);
check('coordinator doctor account creation rejects work hours spanning the clinic lunch closure',
    ($invalidDoctorHours['_code'] ?? 0) === 422);
$duplicateDoctorUsername = $coordinator->handle('coordinator_actions.php', [
    'action' => 'create_doctor_account', 'name' => 'Dr. Test Doctor',
    'username' => 'coordinator1', 'password' => 'valid-password',
    'specialty_id' => 1, 'days' => [1, 2, 3],
    'work_schedule' => [
        '1' => [['start' => '09:00', 'end' => '12:00']],
        '2' => [['start' => '09:00', 'end' => '12:00']],
        '3' => [['start' => '09:00', 'end' => '12:00']]
    ]
]);
check('coordinator doctor account creation rejects an existing username',
    ($duplicateDoctorUsername['_code'] ?? 0) === 409);
$r = $c->handle('login.php', ['username' => 'patient1', 'password' => '123456'], false);
check('POST without CSRF token is rejected (403)', $r['_code'] === 403, $r['_raw']);
$c2 = new Client(); $c2->start(); $c2->csrf = 'wrong-token';
$r = $c2->handle('login.php', ['username' => 'patient1', 'password' => '123456']);
check('POST with wrong CSRF token is rejected (403)', $r['_code'] === 403);
$r = $c->handle('logout.php');
check('logout via GET is refused (405)', $r['_code'] === 405);

echo "\n== 2. Registration ==\n";
$u1 = 'test_' . bin2hex(random_bytes(3)); $u2 = 'test_' . bin2hex(random_bytes(3));
$reg = fn($c, $o) => $c->handle('register.php', $o + ['first_name' => 'Test', 'last_name' => 'Patient', 'contact_number' => '09171234567', 'username' => 'x', 'password' => 'password123']);
$r = $reg($c, ['username' => 'ab']);              check('too-short username rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => 'dr_hacker']);       check('reserved "dr_" username rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'password' => 'short']); check('password under 8 chars rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'first_name' => 'Test123']); check('non-letter name rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'contact_number' => '0917123456789']); check('13-digit contact number rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'contact_number' => '6391712345678']); check('overlong international number rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'contact_number' => '0917123456']); check('short local number rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'contact_number' => '08171234567']); check('non-Philippine number prefix rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'contact_number' => '0917123456a']); check('non-digit contact number rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1, 'contact_number' => ' 09171234567']); check('whitespace in contact number rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => $u1]);               check('valid registration succeeds', !empty($r['success']), $r['_raw']);
$r = $reg($c, ['username' => $u1, 'contact_number' => '639171234567']); check('12-digit international number starting 639 rejected', $r['_code'] === 422);
$r = $reg($c, ['username' => strtoupper($u1)]);   check('duplicate username (any case) rejected (409)', $r['_code'] === 409, $r['_raw']);
$extraRegistrationsSucceeded = true;
for ($i = 0; $i < 5; $i++) {
    $extraUser = 'test_' . bin2hex(random_bytes(3));
    $extraResult = $reg($c, ['username' => $extraUser]);
    $extraRegistrationsSucceeded = $extraRegistrationsSucceeded && !empty($extraResult['success']);
}
check('more than five registrations from one device are allowed', $extraRegistrationsSucceeded);

echo "\n== 3. Login + rate limiting ==\n";
$a = new Client(); $a->start();
$r = $a->handle('login.php', ['username' => $u1, 'password' => 'password123']);
check('new patient can log in with separated names stored together', !empty($r['success']) && ($r['user']['role'] ?? '') === 'patient' && ($r['user']['full_name'] ?? '') === 'Test Patient', $r['_raw']);
check('login returns a fresh CSRF token', !empty($r['csrf']));
$r = $a->handle('get_overview.php');
check('session works after login', !empty($r['success']));
$bad = new Client(); $bad->start(); $codes = [];
for ($i = 0; $i < 7; $i++) $codes[] = $bad->handle('login.php', ['username' => $u2, 'password' => 'wrong-password'])['_code'];
check('wrong passwords give 401, then 429 after 5 failures', array_slice($codes, 0, 5) === [401, 401, 401, 401, 401] && $codes[5] === 429, implode(',', $codes));
$r = $bad->handle('login.php', ['username' => $u2, 'password' => 'password123']);
check('correct password is also blocked while locked out (429)', $r['_code'] === 429);
$r = $a->handle('logout.php', []);
check('logout via POST works', !empty($r['success']));
$r = $a->handle('get_overview.php');
check('API refuses access after logout (401)', $r['_code'] === 401);

echo "\n== 4. Errors do not leak details ==\n";
$r = $bad->handle('login.php', ['username' => str_repeat('a', 80), 'password' => 'x']);
check('no SQL / file paths in error responses', !preg_match('/SQLSTATE|PDOException|\.php|Stack trace/i', $r['_raw']), $r['_raw']);

echo "\n== 5. Double booking (two patients, same slot, at the same instant) ==\n";
// Two logged-in patients
$p1 = new Client(); $p1->start(); $p1->handle('login.php', ['username' => $u1, 'password' => 'password123']);
$p2 = new Client(); $p2->start();
$u3 = 'test_' . bin2hex(random_bytes(3));
$p2->handle('register.php', [
    'first_name' => 'Test', 'last_name' => 'Two', 'contact_number' => '09170000000',
    'username' => $u3, 'password' => 'password123'
]);
$p2->handle('login.php', ['username' => $u3, 'password' => 'password123']);
$ov = $p1->handle('get_overview.php'); $doctor = $ov['doctors'][0]['id'] ?? 0;
check('a doctor exists to book with', $doctor > 0);

$pastSlots = array_filter(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00', '15:30'],
    fn($slot) => $slot . ':00' < date('H:i:s'));
if ($pastSlots) {
    $pastSlot = end($pastSlots);
    $r = $p1->handle('book.php', [
        'doctor_id' => $doctor,
        'appointment_date' => date('Y-m-d'),
        'appointment_time' => $pastSlot
    ]);
    check('a passed 30-minute start time today cannot be reserved', $r['_code'] === 409 &&
        stripos($r['message'] ?? '', 'already passed') !== false, $r['_raw']);
}

$invalidDate = date('Y-m-d', strtotime('+30 days'));
foreach (['09:15', '12:00', '12:30', '13:00', '16:00'] as $invalidTime) {
    $r = $p1->handle('book.php', [
        'doctor_id' => $doctor,
        'appointment_date' => $invalidDate,
        'appointment_time' => $invalidTime
    ]);
    check("$invalidTime is not an available 30-minute clinic start time", $r['_code'] === 409 &&
        stripos($r['message'] ?? '', '30-minute') !== false, $r['_raw']);
}

$slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00', '15:30'];
$booked = null; $tested = 0;
for ($day = 1; $day < 120 && !$booked; $day++) {           // winning test appointments are cancelled immediately
    $date = date('Y-m-d', strtotime("+$day days"));
    $slot = $slots[$day % count($slots)];
    $body = ['doctor_id' => $doctor, 'appointment_date' => $date, 'appointment_time' => $slot];
    // fire both requests in parallel
    $mh = curl_multi_init(); $hs = [];
    foreach ([$p1, $p2] as $k => $cl) {
        $ch = curl_init($base . 'book.php'); $cl->setup($ch, 'book.php', $body, true);
        curl_multi_add_handle($mh, $ch); $hs[$k] = $ch;
    }
    do { curl_multi_exec($mh, $running); curl_multi_select($mh, 0.05); } while ($running > 0);
    $res = [];
    foreach ($hs as $k => $ch) {
        $res[$k] = json_decode(curl_multi_getcontent($ch), true) ?: [];
        $res[$k]['_code'] = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_multi_remove_handle($mh, $ch);
    }
    curl_multi_close($mh);
    $wins = count(array_filter($res, fn($x) => !empty($x['success'])));
    $notWorkday = count(array_filter($res, fn($x) => stripos($x['message'] ?? '', 'workday') !== false || stripos($x['message'] ?? '', 'not available') !== false));
    $alreadyTaken = count(array_filter($res, fn($x) => stripos($x['message'] ?? '', 'taken') !== false));
    if ($notWorkday === 2 || $alreadyTaken === 2) continue;    // skip unavailable dates and pre-existing reservations
    $tested++;
    check("exactly ONE of two simultaneous bookings succeeds ($date $slot)", $wins === 1,
        "wins=$wins; " . json_encode([$res[0]['message'] ?? '', $res[1]['message'] ?? '']));
    $loser = array_values(array_filter($res, fn($x) => empty($x['success'])))[0] ?? [];
    check('the loser gets a clear "slot taken / busy" message (409), not a server error', ($loser['_code'] ?? 0) === 409, json_encode($loser));
    $booked = $wins === 1;
    if ($booked) {
        $winnerClient = !empty($res[0]['success']) ? $p1 : $p2;
        $activeAppointments = $winnerClient->handle('get_admin_appointments.php');
        check('patient appointment API reports an active booking lock',
            !empty($activeAppointments['success']) && !empty($activeAppointments['has_active_appointment']),
            $activeAppointments['_raw'] ?? '');
        $anotherRequest = $winnerClient->handle('book.php', [
            'doctor_id' => $doctor,
            'appointment_date' => $date,
            'appointment_time' => $slots[($day + 1) % count($slots)]
        ]);
        check('a patient with an active appointment cannot reserve a second schedule',
            ($anotherRequest['_code'] ?? 0) === 409 &&
            stripos($anotherRequest['message'] ?? '', 'active appointment') !== false,
            $anotherRequest['_raw'] ?? '');
    }
    if ($booked && $date <= date('Y-m-d', strtotime('+30 days'))) {
        $publicCheck = (new Client())->handle('get_public_availability.php');
        $publicDates = $publicCheck['availability'][(string)$doctor] ?? [];
        $reservedTimeStillOpen = false;
        foreach ($publicDates as $availableDate) {
            if (($availableDate['date'] ?? '') !== $date) continue;
            foreach (($availableDate['slots'] ?? []) as $availableSlot) {
                if (substr((string)($availableSlot['value'] ?? ''), 0, 5) === $slot) $reservedTimeStillOpen = true;
            }
        }
        check('public availability hides a slot as soon as a reservation holds it',
            !empty($publicCheck['success']) && !$reservedTimeStillOpen, $publicCheck['_raw'] ?? '');
    }
    // clean up: cancel whichever one won
    foreach ([[$p1, $res[0]], [$p2, $res[1]]] as [$cl, $x]) {
        if (!empty($x['success'])) {
            $list = $cl->handle('get_admin_appointments.php');
            foreach (($list['appointments'] ?? []) as $ap) if (($ap['reference_code'] ?? '') === $x['reference_code']) {
                $cl->handle('patient_actions.php', ['action' => 'cancel', 'appointment_id' => $ap['id'], 'reason' => 'automated test']);
            }
        }
    }
    if ($booked) {
        $clearedLock = $winnerClient->handle('get_admin_appointments.php');
        check('cancelling the active appointment clears the patient booking lock',
            !empty($clearedLock['success']) && empty($clearedLock['has_active_appointment']),
            $clearedLock['_raw'] ?? '');
    }
}
check('found a bookable date to test the race', $tested > 0, 'no working day found in the next 120 days');

echo "\nResult: $pass passed, $failN failed\n";
exit($failN ? 1 : 0);
