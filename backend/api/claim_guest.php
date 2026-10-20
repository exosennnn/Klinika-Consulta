<?php
// Link a previously verified guest booking to the signed-in patient after fresh email OTP.
require_once __DIR__ . '/../db.php';
require_login(['patient']);
try {
    $d = json_input();
    $ref = strtoupper(trim((string)($d['reference_code'] ?? '')));
    $phone = preg_replace('/\D+/', '', (string)($d['contact_number'] ?? ''));
    $email = strtolower(trim((string)($d['email'] ?? '')));
    $token = trim((string)($d['verification_token'] ?? ''));
    if (!preg_match('/^REF-[A-F0-9]{8}$/D', $ref) || !preg_match('/^09\d{9}$/D', $phone) || !filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[a-f0-9]{64}$/D', $token)) {
        json_out(['success'=>false,'message'=>'Enter your tracking code and verify the booking email.'],422);
    }
    $wait = rate_limit_wait($pdo, 'guest_claim', (string)$_SESSION['user_id'], 5, 15);
    if ($wait > 0) json_out(['success'=>false,'message'=>'Too many attempts. Try again later.'],429);
    $pdo->beginTransaction();
    $u = $pdo->prepare("SELECT id, full_name, contact_number FROM users WHERE id=? AND role='patient' FOR UPDATE");
    $u->execute([$_SESSION['user_id']]); $user = $u->fetch();
    $a = $pdo->prepare('SELECT id,patient_id,patient_name,contact_number,email_address,contact_verified FROM appointments WHERE reference_code=? FOR UPDATE');
    $a->execute([$ref]); $appt=$a->fetch();
    $v = $pdo->prepare("SELECT id FROM guest_otp_verifications WHERE verification_token=? AND verified=1 AND channel='email' AND LOWER(email_address)=? AND contact_number=? AND expires_at>=NOW() LIMIT 1 FOR UPDATE");
    $v->execute([$token,$email,$phone]); $verified=$v->fetch();
    // Name AND contact must match the patient's registered identity; email ownership is reverified.
    $normalize = static function($n) { return mb_strtolower(preg_replace('/\s+/u',' ',trim((string)$n))); };
    if (!$user || !$appt || $appt['patient_id'] !== null || !$verified ||
        $normalize($appt['patient_name']) !== $normalize($user['full_name']) ||
        $normalize($appt['patient_name']) !== $normalize($d['full_name'] ?? '') ||
        $phone !== $appt['contact_number'] || $phone !== $user['contact_number'] ||
        strtolower((string)$appt['email_address']) !== $email || (int)$appt['contact_verified'] !== 1) {
        $pdo->rollBack(); rate_limit_hit($pdo,'guest_claim',(string)$_SESSION['user_id']);
        json_out(['success'=>false,'message'=>'Unable to link. The booking name, verified email and phone must match your patient account. Contact the coordinator if your details differ.'],409);
    }
    $pdo->prepare('UPDATE appointments SET patient_id=? WHERE id=? AND patient_id IS NULL')->execute([$user['id'],$appt['id']]);
    $pdo->prepare('DELETE FROM guest_otp_verifications WHERE id=?')->execute([$verified['id']]);
    log_activity($pdo,(int)$appt['id'],'guest_account_linked','Patient linked guest booking after fresh email verification.');
    $pdo->commit();
    json_out(['success'=>true,'message'=>'Guest appointment linked to your account.']);
} catch(Throwable $e) { if($pdo->inTransaction())$pdo->rollBack(); fail($e); }
