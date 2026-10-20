<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../authenticator.php';
require_login();

try {
    $userId = (int)$_SESSION['user_id'];
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        $status = $pdo->prepare('SELECT enabled FROM user_authenticators WHERE user_id = ?');
        $status->execute([$userId]);
        json_out(['success' => true, 'enabled' => (bool)$status->fetchColumn()]);
    }

    $data = json_input();
    $action = (string)($data['action'] ?? '');
    if (!in_array($action, ['setup', 'enable', 'disable'], true)) {
        json_out(['success' => false, 'message' => 'Invalid security action.'], 422);
    }
    if (authenticator_key() === null || !function_exists('openssl_encrypt')) {
        json_out(['success' => false, 'message' => 'Authenticator setup is not configured. Add a random 64-character hexadecimal KLINIKA_APP_KEY to backend/config.php.'], 503);
    }

    $account = $pdo->prepare('SELECT password, username FROM users WHERE id = ?');
    $account->execute([$userId]);
    $user = $account->fetch();
    $password = (string)($data['current_password'] ?? '');
    if (!$user || !password_verify($password, $user['password'])) {
        json_out(['success' => false, 'message' => 'Current password is incorrect.'], 422);
    }

    if ($action === 'setup') {
        $enabled = $pdo->prepare('SELECT enabled FROM user_authenticators WHERE user_id = ?');
        $enabled->execute([$userId]);
        if ((int)$enabled->fetchColumn() === 1) {
            json_out(['success' => false, 'message' => 'Two-factor authentication is already enabled.'], 409);
        }
        $secret = authenticator_generate_secret();
        $_SESSION['pending_authenticator'] = [
            'secret' => $secret,
            'expires_at' => time() + 600,
        ];
        $label = rawurlencode('Klinika Consulta:' . $user['username']);
        $issuer = rawurlencode('Klinika Consulta');
        $uri = "otpauth://totp/$label?secret=$secret&issuer=$issuer&algorithm=SHA1&digits=6&period=30";
        json_out(['success' => true, 'secret' => $secret, 'otpauth_uri' => $uri]);
    }

    $code = trim((string)($data['code'] ?? ''));
    if ($action === 'enable') {
        $pending = $_SESSION['pending_authenticator'] ?? null;
        if (!is_array($pending) || ($pending['expires_at'] ?? 0) < time()) {
            unset($_SESSION['pending_authenticator']);
            json_out(['success' => false, 'message' => 'Authenticator setup expired. Start setup again.'], 410);
        }
        $rateKey = substr(hash('sha256', 'enable:' . $userId), 0, 48);
        if (rate_limit_wait($pdo, 'two_setup', $rateKey, 5, 15) > 0) {
            json_out(['success' => false, 'message' => 'Too many incorrect codes. Wait before trying again.'], 429);
        }
        if (!authenticator_verify_code($pending['secret'], $code)) {
            rate_limit_hit($pdo, 'two_setup', $rateKey);
            json_out(['success' => false, 'message' => 'That authenticator code is incorrect. Check your device time and try again.'], 422);
        }
        rate_limit_clear($pdo, 'two_setup', $rateKey);
        $recoveryCodes = [];
        $recoveryHashes = [];
        for ($index = 0; $index < 8; $index++) {
            $recoveryCodes[] = strtoupper(bin2hex(random_bytes(5)));
            $recoveryHashes[] = password_hash($recoveryCodes[$index], PASSWORD_DEFAULT);
        }
        $save = $pdo->prepare("INSERT INTO user_authenticators (user_id, secret_ciphertext, recovery_codes, enabled)
            VALUES (?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE secret_ciphertext = VALUES(secret_ciphertext),
                recovery_codes = VALUES(recovery_codes), enabled = 1");
        $save->execute([$userId, authenticator_encrypt_secret($pending['secret']), json_encode($recoveryHashes)]);
        unset($_SESSION['pending_authenticator']);
        log_activity($pdo, null, 'two_factor_enabled', 'Authenticator-app sign-in enabled.');
        json_out(['success' => true, 'recovery_codes' => $recoveryCodes]);
    }

    $rateKey = substr(hash('sha256', 'disable:' . $userId), 0, 48);
    if (rate_limit_wait($pdo, 'two_setup', $rateKey, 5, 15) > 0) {
        json_out(['success' => false, 'message' => 'Too many incorrect codes. Wait before trying again.'], 429);
    }
    $stored = $pdo->prepare('SELECT secret_ciphertext, enabled FROM user_authenticators WHERE user_id = ?');
    $stored->execute([$userId]);
    $authenticator = $stored->fetch();
    if (!$authenticator || !(int)$authenticator['enabled']) {
        json_out(['success' => false, 'message' => 'Two-factor authentication is not enabled.'], 409);
    }
    if (!authenticator_verify_code(authenticator_decrypt_secret($authenticator['secret_ciphertext']), $code)) {
        rate_limit_hit($pdo, 'two_setup', $rateKey);
        json_out(['success' => false, 'message' => 'That authenticator code is incorrect.'], 422);
    }
    rate_limit_clear($pdo, 'two_setup', $rateKey);
    $pdo->prepare('DELETE FROM user_authenticators WHERE user_id = ?')->execute([$userId]);
    unset($_SESSION['pending_authenticator']);
    log_activity($pdo, null, 'two_factor_disabled', 'Authenticator-app sign-in disabled.');
    json_out(['success' => true]);
} catch (Throwable $e) {
    fail($e);
}
