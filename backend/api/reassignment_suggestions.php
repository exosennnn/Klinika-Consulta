<?php
require_once __DIR__.'/../db.php';
require_login(['coordinator']);
try {
    $id=(int)($_GET['appointment_id']??0);
    $q=$pdo->prepare('SELECT id,specialty_id,doctor_id,appointment_date FROM appointments WHERE id=?');
    $q->execute([$id]); $a=$q->fetch(PDO::FETCH_ASSOC);
    if(!$a) json_out(['success'=>false,'message'=>'Appointment not found.'],404);
    $q=$pdo->prepare("SELECT id,name,available_days,work_schedule FROM doctors WHERE specialty_id=? AND status='Active' ORDER BY name");
    $q->execute([(int)$a['specialty_id']]); $docs=$q->fetchAll(PDO::FETCH_ASSOC);
    $start=new DateTimeImmutable('today'); $end=$start->modify('+30 days');
    $slots=[];
    $taken=$pdo->prepare("SELECT 1 FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status NOT IN ('Cancelled','Needs_Reassignment') AND id<>? LIMIT 1");
    $blocked=$pdo->prepare('SELECT 1 FROM doctor_blockouts WHERE doctor_id=? AND block_date=? LIMIT 1');
    $leave=$pdo->prepare("SELECT 1 FROM doctor_leaves WHERE doctor_id=? AND status='Approved' AND start_date<=? AND end_date>=? LIMIT 1");
    foreach($docs as $doc) {
        $workdays=doctor_workdays($doc['available_days']); $schedule=doctor_schedule($doc['work_schedule']);
        for($date=$start;$date<=$end;$date=$date->modify('+1 day')) {
            $day=$date->format('Y-m-d');
            if(!in_array((int)$date->format('N'),$workdays,true))continue;
            $blocked->execute([$doc['id'],$day]); if($blocked->fetchColumn())continue;
            $leave->execute([$doc['id'],$day,$day]); if($leave->fetchColumn())continue;
            foreach(doctor_day_slots($schedule,(int)$date->format('N')) as $time) {
                if(strtotime("$day $time")<=time())continue;
                $taken->execute([$doc['id'],$day,$time,$id]); if($taken->fetchColumn())continue;
                $slots[]=['doctor_id'=>(int)$doc['id'],'doctor_name'=>$doc['name'],'date'=>$day,'time'=>$time];
                break;
            }
            if(count(array_filter($slots,fn($x)=>$x['doctor_id']==$doc['id']))>=3)break;
        }
    }
    usort($slots,fn($x,$y)=>strcmp($x['date'].' '.$x['time'],$y['date'].' '.$y['time']));
    json_out(['success'=>true,'suggestions'=>array_slice($slots,0,12)]);
} catch(Throwable $e){fail($e);}
