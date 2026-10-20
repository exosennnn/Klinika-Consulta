<?php
require_once __DIR__ . '/../db.php';

// Also hands the browser its CSRF token (send it back in the X-CSRF-Token header on every POST)
if (!empty($_SESSION['user_id'])) {
    json_out(['authenticated' => true, 'csrf' => csrf_token(), 'user' => [
        'id'        => $_SESSION['user_id'],
        'username'  => $_SESSION['username'],
        'full_name' => $_SESSION['full_name'],
        'role'      => $_SESSION['role'],
        'doctor_id' => $_SESSION['doctor_id'] ?? null,
    ]]);
}
json_out(['authenticated' => false, 'csrf' => csrf_token()]);
