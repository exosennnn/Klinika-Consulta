<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../otp_provider.php';
try {
  $d=json_input(); $name=trim((string)($d['full_name']??'')); $phone=trim((string)($d['contact_number']??'')); $email=strtolower(trim((string)($d['email']??''))); $channel=$d['channel']??'sms';
  if(mb_strlen($name)<4||mb_strlen($name)>100) json_out(['success'=>false,'message'=>'Enter a valid full name.'],422);
  if(!preg_match('/^09\d{9}$/D',$phone)) json_out(['success'=>false,'message'=>'Enter a valid 11-digit Philippine mobile number.'],422);
  if($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL)) json_out(['success'=>false,'message'=>'Enter a valid email address.'],422);
  if(!in_array($channel,['sms','email'],true)||($channel==='email'&&$email==='')) json_out(['success'=>false,'message'=>'Choose an available verification method.'],422);
  $pdo->prepare("DELETE FROM guest_otp_verifications WHERE created_at < (NOW() - INTERVAL 1 DAY)")->execute();
  $recent=$pdo->prepare("SELECT COUNT(*) FROM guest_otp_verifications WHERE contact_number=? AND created_at > (NOW() - INTERVAL 1 MINUTE)"); $recent->execute([$phone]);
  if((int)$recent->fetchColumn()>=2) json_out(['success'=>false,'message'=>'Please wait before requesting another code.'],429);
  $code=(string)random_int(100000,999999); $token=bin2hex(random_bytes(24));
  [$ok,$msg]=$channel==='email'?dm_send_email_otp($email,$code):dm_send_sms_otp($phone,$code);
  if(!$ok) json_out(['success'=>false,'message'=>$msg],503);
  $q=$pdo->prepare("INSERT INTO guest_otp_verifications (token,full_name,contact_number,email_address,channel,code_hash,expires_at) VALUES (?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 5 MINUTE))");
  $q->execute([$token,$name,$phone,$email?:null,$channel,password_hash($code,PASSWORD_DEFAULT)]);
  json_out(['success'=>true,'message'=>$msg,'token'=>$token]);
} catch(Throwable $e){ fail($e); }
