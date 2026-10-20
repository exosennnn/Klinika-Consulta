<?php
require_once __DIR__ . '/../db.php';
try{
 $d=json_input(); $token=trim((string)($d['token']??'')); $code=trim((string)($d['code']??''));
 if(!preg_match('/^[a-f0-9]{48}$/D',$token)||!preg_match('/^\d{6}$/D',$code)) json_out(['success'=>false,'message'=>'Invalid verification request.'],422);
 $q=$pdo->prepare("SELECT * FROM guest_otp_verifications WHERE token=? LIMIT 1");$q->execute([$token]);$r=$q->fetch();
 if(!$r||strtotime($r['expires_at'])<time()) json_out(['success'=>false,'message'=>'This code has expired. Request a new code.'],410);
 if((int)$r['attempts']>=5) json_out(['success'=>false,'message'=>'Too many incorrect attempts. Request a new code.'],429);
 if(!password_verify($code,$r['code_hash'])){$pdo->prepare("UPDATE guest_otp_verifications SET attempts=attempts+1 WHERE id=?")->execute([$r['id']]);json_out(['success'=>false,'message'=>'Incorrect verification code.'],422);}
 $verifyToken=bin2hex(random_bytes(32));$pdo->prepare("UPDATE guest_otp_verifications SET verified=1,verification_token=?,verified_at=NOW() WHERE id=?")->execute([$verifyToken,$r['id']]);
 json_out(['success'=>true,'verification_token'=>$verifyToken]);
}catch(Throwable $e){fail($e);}
