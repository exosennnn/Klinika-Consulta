<?php
$authConfig = __DIR__ . '/config.php';
if (is_file($authConfig)) require_once $authConfig;

function authenticator_key(): ?string {
    $configured = defined('KLINIKA_APP_KEY')
        ? trim((string)KLINIKA_APP_KEY)
        : trim((string)(getenv('KLINIKA_APP_KEY') ?: ''));
    if (!preg_match('/^[a-f0-9]{64}$/iD', $configured)) return null;
    return hex2bin($configured) ?: null;
}

function authenticator_encrypt_secret(string $secret): string {
    $key = authenticator_key();
    if ($key === null || !function_exists('openssl_encrypt')) {
        throw new RuntimeException('Authenticator encryption is not configured.');
    }
    $iv = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt($secret, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($ciphertext === false) throw new RuntimeException('Could not protect authenticator secret.');
    return base64_encode($iv . $tag . $ciphertext);
}

function authenticator_decrypt_secret(string $encrypted): string {
    $key = authenticator_key();
    $payload = base64_decode($encrypted, true);
    if ($key === null || $payload === false || strlen($payload) < 29) {
        throw new RuntimeException('Authenticator encryption is not configured or the stored secret is invalid.');
    }
    $secret = openssl_decrypt(substr($payload, 28), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, substr($payload, 0, 12), substr($payload, 12, 16));
    if ($secret === false) throw new RuntimeException('Could not decrypt authenticator secret.');
    return $secret;
}

function authenticator_base32_encode(string $data): string {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split($data) as $char) $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
    $encoded = '';
    foreach (str_split($bits, 5) as $chunk) {
        if (strlen($chunk) < 5) $chunk = str_pad($chunk, 5, '0');
        $encoded .= $alphabet[bindec($chunk)];
    }
    return $encoded;
}

function authenticator_base32_decode(string $encoded): string {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split(strtoupper(rtrim($encoded, '='))) as $char) {
        $position = strpos($alphabet, $char);
        if ($position === false) throw new RuntimeException('Invalid authenticator secret.');
        $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
    }
    $data = '';
    foreach (str_split($bits, 8) as $byte) {
        if (strlen($byte) === 8) $data .= chr(bindec($byte));
    }
    return $data;
}

function authenticator_generate_secret(): string {
    return authenticator_base32_encode(random_bytes(20));
}

function authenticator_code(string $secret, ?int $timestamp = null): string {
    $counter = (int)floor(($timestamp ?? time()) / 30);
    $counterBytes = pack('N2', ($counter >> 32) & 0xffffffff, $counter & 0xffffffff);
    $hash = hash_hmac('sha1', $counterBytes, authenticator_base32_decode($secret), true);
    $offset = ord($hash[19]) & 0x0f;
    $binary = ((ord($hash[$offset]) & 0x7f) << 24)
        | ((ord($hash[$offset + 1]) & 0xff) << 16)
        | ((ord($hash[$offset + 2]) & 0xff) << 8)
        | (ord($hash[$offset + 3]) & 0xff);
    return str_pad((string)($binary % 1000000), 6, '0', STR_PAD_LEFT);
}

function authenticator_verify_code(string $secret, string $code, ?int $timestamp = null): bool {
    if (!preg_match('/^\d{6}$/D', $code)) return false;
    $now = $timestamp ?? time();
    foreach ([-30, 0, 30] as $offset) {
        if (hash_equals(authenticator_code($secret, $now + $offset), $code)) return true;
    }
    return false;
}
