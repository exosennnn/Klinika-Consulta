<?php
// Coordinator-assisted claim for walk-in and guest appointments when automatic matching fails.
// Requires an authenticated coordinator, a reference code, an in-person identity check,
// matching contact number, and an auditable reason. Never link by name alone.
require_once __DIR__ . '/../db.php';
require_login(['coordinator']);
try {
    $d = json_input();
    $ref = strtoupper(trim((string)($d['reference_code'] ?? '')));
    $username = trim((string)($d['patient_username'] ?? ''));
    $reason = trim((string)($d['verification_note'] ?? ''));
    if (!preg_match('/^REF-[A-F0-9]{8}$/D', $ref) ||
        !preg_match('/^[A-Za-z0-9_.-]{3,50}$/D', $username) ||
        ($d['identity_checked'] ?? false) !== true || mb_strlen($reason) < 12 || mb_strlen($reason) > 240) {
        json_out(['success'=>false,'message'=>'Enter a valid reference, username, and a verification note (12–240 characters); confirm the in-person identity check.'],422);
    }
    $wait = rate_limit_wait($pdo, 'manual_claim', (string)$_SESSION['user_id'], 10, 15);
    if ($wait > 0) json_out(['success'=>false,'message'=>'Too many linking attempts. Try again later.'],429);
    $pdo->beginTransaction();
    $q=$pdo->prepare("SELECT id, patient_id, patient_name, contact_number, email_address, contact_verified, booked_by_role FROM appointments WHERE reference_code=? FOR UPDATE");
    $q->execute([$ref]); $a=$q->fetch();
    $q=$pdo->prepare("SELECT id, full_name, contact_number, email_address, email_verified FROM users WHERE username=? AND role='patient' FOR UPDATE");
    $q->execute([$username]); $u=$q->fetch();
    $phone = static fn($v) => preg_replace('/\D+/', '', (string)$v);
    $samePhone = $a && $u && $phone($a['contact_number']) !== '' && $phone($a['contact_number']) === $phone($u['contact_number']);
    // A verified matching email strengthens the check but is not required for a true walk-in.
    $sameVerifiedEmail = $a && $u && (int)$a['contact_verified'] === 1 &&
        (int)$u['email_verified'] === 1 && !empty($a['email_address']) &&
        strtolower(trim($a['email_address'])) === strtolower(trim((string)$u['email_address']));
    if (!$a || !$u || $a['patient_id'] !== null || !in_array($a['booked_by_role'], ['guest','coordinator'], true) || !$samePhone) {
        $pdo->rollBack();
        rate_limit_hit($pdo, 'manual_claim', (string)$_SESSION['user_id']);
        json_out(['success'=>false,'message'=>'Cannot link. The booking must be unclaimed and the registered contact number must match. Verify the identity and correct records first.'],409);
    }
    $q=$pdo->prepare('UPDATE appointments SET patient_id=? WHERE id=? AND patient_id IS NULL');
    $q->execute([(int)$u['id'], (int)$a['id']]);
    if ($q->rowCount() !== 1) throw new RuntimeException('The appointment was claimed by another process.');
    $label = $a['booked_by_role'] === 'guest' ? 'guest_history_linked_by_coordinator' : 'walkin_history_linked';
    log_activity($pdo, (int)$a['id'], $label, 'Coordinator #' . (int)$_SESSION['user_id'] . ' verified identity in person. Verified email match: ' . ($sameVerifiedEmail ? 'yes' : 'no') . '. Note: ' . $reason);
    $pdo->commit();
    json_out(['success'=>true,'message'=>'Appointment linked after coordinator verification.']);
} catch(Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); fail($e); }
