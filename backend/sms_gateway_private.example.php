<?php
// Copy this file to backend/sms_gateway_private.php and set a NEW IPROG token.
// The real file is git-ignored and must never be shared.
// Expected signature used by backend/otp_provider.php:
//   klinika_private_send_sms(string $number, string $code): array  -> [bool $ok, string $message]

function klinika_private_send_sms(string $number, string $code): array
{
    $token = 'YOUR_IPROG_API_TOKEN';
    if (trim($token) === '' || $token === 'YOUR_IPROG_API_TOKEN') {
        return [false, 'SMS gateway is not configured.'];
    }
    // TODO: implement the IPROG request here, same as the working private version.
    return [false, 'SMS gateway adapter not implemented.'];
}
