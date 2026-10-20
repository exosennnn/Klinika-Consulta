<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../otp_provider.php';
if (($_SERVER['REQUEST_METHOD']??'')!=='POST') json_out(['success'=>false,'message'=>'Invalid method.'],405);
try {
 $d=json_input(); $action=(string)($d['action']??'request');
 $username=trim((string)($d['username']??'')); $email=strtolower(trim((string)($d['email']??'')));
 if(!preg_match('/^[A-Za-z0-9_.-]{3,50}$/D',$username)||!filter_var($email,FILTER_VALIDATE_EMAIL)) json_out(['success'=>false,'message'=>'Enter your username and verified email.'],422);
 $wait=rate_limit_wait($pdo,'password_reset',hash('sha256',strtolower($username).'|'.$email),3,30);
 if($wait>0) json_out(['success'=>false,'message'=>'Please wait before trying again.'],429);
 $q=$pdo->prepare('SELECT id FROM users WHERE username=? AND LOWER(email_address)=? AND email_verified=1 LIMIT 1');$q->execute([$username,$email]);$uid=(int)$q->fetchColumn();
 if($action==='request') {
  rate_limit_hit($pdo,'password_reset',hash('sha256',strtolower($username).'|'.$email));
  if($uid){
   $recent=$pdo->prepare('SELECT COUNT(*) FROM password_reset_codes WHERE user_id=? AND created_at>NOW()-INTERVAL 2 MINUTE');$recent->execute([$uid]);
   if(!(int)$recent->fetchColumn()) {
    $code=(string)random_int(100000,999999);[$ok,$msg]=dm_send_email_otp($email,$code);
    if(!$ok) json_out(['success'=>false,'message'=>'Email service is temporarily unavailable.'],503);
    $pdo->prepare('DELETE FROM password_reset_codes WHERE user_id=?')->execute([$uid]);
    $pdo->prepare('INSERT INTO password_reset_codes (user_id,code_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 5 MINUTE))')->execute([$uid,password_hash($code,PASSWORD_DEFAULT)]);
   }
  }
  json_out(['success'=>true,'message'=>'If the account has that verified email, a recovery code has been sent.']);
 }
 if($action!=='reset') json_out(['success'=>false,'message'=>'Invalid action.'],422);
 $code=trim((string)($d['code']??''));$password=(string)($d['new_password']??'');
 if(!preg_match('/^\d{6}$/D',$code)||strlen($password)<8||strlen($password)>72||strcasecmp($password,$username)===0) json_out(['success'=>false,'message'=>'Enter a six-digit code and a strong new password (8–72 characters).'],422);
 if(!$uid) json_out(['success'=>false,'message'=>'Invalid or expired recovery code.'],422);
 $pdo->beginTransaction();
 $q=$pdo->prepare('SELECT * FROM password_reset_codes WHERE user_id=? AND used_at IS NULL AND expires_at>=NOW() ORDER BY id DESC LIMIT 1 FOR UPDATE');$q->execute([$uid]);$r=$q->fetch();
 if(!$r||(int)$r['attempts']>=5){$pdo->rollBack();json_out(['success'=>false,'message'=>'Invalid or expired recovery code.'],422);}
 if(!password_verify($code,$r['code_hash'])){$pdo->prepare('UPDATE password_reset_codes SET attempts=attempts+1 WHERE id=?')->execute([$r['id']]);$pdo->commit();json_out(['success'=>false,'message'=>'Invalid or expired recovery code.'],422);}
 $pdo->prepare('UPDATE users SET password=? WHERE id=?')->execute([password_hash($password,PASSWORD_DEFAULT),$uid]);
 $pdo->prepare('UPDATE password_reset_codes SET used_at=NOW() WHERE user_id=? AND used_at IS NULL')->execute([$uid]);
 $pdo->commit();json_out(['success'=>true,'message'=>'Password updated. Please log in.']);
} catch(Throwable $e){fail($e);}
