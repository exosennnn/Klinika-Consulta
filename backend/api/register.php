<?php
// Patient self-registration. Always creates a 'patient' account; staff accounts are never self-service.
require_once __DIR__ . '/../db.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_out(['success' => false, 'message' => 'Invalid request.'], 405);
}

try {
    $d        = json_input();
    $username = trim((string)($d['username'] ?? ''));
    $password = (string)($d['password'] ?? '');
    $firstName = trim((string)preg_replace('/\s+/u', ' ', (string)($d['first_name'] ?? '')));
    $lastName  = trim((string)preg_replace('/\s+/u', ' ', (string)($d['last_name'] ?? '')));
    $namePattern = "/^[\\p{L}\\p{M}]+(?:[ '\\x{2019}-][\\p{L}\\p{M}]+)*$/uD";
    $contact  = (string)($d['contact_number'] ?? '');
    $email = strtolower(trim((string)($d['email'] ?? '')));
    $emailToken = trim((string)($d['email_verification_token'] ?? ''));
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['success'=>false,'message'=>'Invalid email address.'],422);

    if (!preg_match('/^[A-Za-z0-9_.]{3,30}$/', $username)) {
        json_out(['success' => false, 'message' => 'Username must be 3-30 characters: letters, numbers, dot or underscore.'], 422);
    }
    if (preg_match('/^(dr_|doctor|coordinator|nurse|admin|staff)/i', $username)) {
        json_out(['success' => false, 'message' => 'That username is reserved. Please choose another.'], 422);
    }
    if (mb_strlen($firstName) < 2 || mb_strlen($firstName) > 50 || !preg_match($namePattern, $firstName)) {
        json_out(['success' => false, 'message' => 'Enter a valid first name using letters only.'], 422);
    }
    if (mb_strlen($lastName) < 2 || mb_strlen($lastName) > 50 || !preg_match($namePattern, $lastName)) {
        json_out(['success' => false, 'message' => 'Enter a valid last name using letters only.'], 422);
    }
    $fullName = $firstName . ' ' . $lastName;
    if (mb_strlen($fullName) > 100) {
        json_out(['success' => false, 'message' => 'Your full name is too long.'], 422);
    }
    if (!preg_match('/^09[0-9]{9}$/D', $contact)) {
        json_out(['success' => false, 'message' => 'Invalid number.'], 422);
    }
    if (strlen($password) < 8 || strlen($password) > 72) {
        json_out(['success' => false, 'message' => 'Password must be 8-72 characters.'], 422);
    }
    if (strcasecmp($password, $username) === 0) {
        json_out(['success' => false, 'message' => 'Password must not be the same as your username.'], 422);
    }

    if ($email !== '') {
        $v=$pdo->prepare("SELECT id FROM guest_otp_verifications WHERE verification_token=? AND verified=1 AND channel='email' AND LOWER(email_address)=? AND contact_number=? AND expires_at>=NOW() LIMIT 1");
        $v->execute([$emailToken,$email,$contact]);
        if (!$v->fetchColumn()) json_out(['success'=>false,'message'=>'Verify your email before registering.'],422);
    }
    try {
        $pdo->prepare("INSERT INTO users (username, password, full_name, role, contact_number, email_address, email_verified) VALUES (?,?,?,'patient',?,?,?)")
            ->execute([$username, password_hash($password, PASSWORD_DEFAULT), $fullName, $contact, $email ?: null, $email ? 1 : 0]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            json_out(['success' => false, 'message' => 'That username is already taken.'], 409);
        }
        throw $e;
    }

    json_out(['success' => true, 'message' => 'Account created. You can log in now.', 'username' => $username]);
} catch (Throwable $e) {
    fail($e);
}
