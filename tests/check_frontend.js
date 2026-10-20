// Run: node tests/check_frontend.js  (no browser or server needed)
// Loads the split scripts with a fake Vue/Swal and checks the template only uses names setup() returns.
const fs=require('fs'), vm=require('vm');
const path=require('path');
const root=path.join(__dirname,'..','js')+path.sep;
const sandbox={console, window:{}, Swal:{fire(){},isVisible(){return false}}, setInterval,clearInterval,
  fetch:async()=>({status:200,text:async()=>JSON.stringify({authenticated:false,csrf:'t'})}),
  Vue:{createApp:(c)=>({mount(){sandbox.__App=c}}),ref:v=>({value:v}),computed:f=>({get value(){return f()}}),onMounted:f=>{}}};
sandbox.window=sandbox; vm.createContext(sandbox);
for (const f of ['utils.js','api.js','template.js']) vm.runInContext(fs.readFileSync(root+f,'utf8'),sandbox,{filename:f});
vm.runInContext(fs.readFileSync(root+'app.js','utf8')+';globalThis.__App=App;',sandbox,{filename:'app.js'});
const App=sandbox.__App; const ret=App.setup();
const names=new Set(Object.keys(ret));
const tpl=App.template;
// identifiers used in template expressions
const exprs=[...tpl.matchAll(/\{\{([\s\S]*?)\}\}/g)].map(m=>m[1]);
for (const m of tpl.matchAll(/(?:v-if|v-else-if|v-show|v-model|v-for|:[a-z-]+|@[a-z.]+)="([^"]*)"/g)) exprs.push(m[1]);
const ignore=new Set(['true','false','null','undefined','in','of','$event','app','n','s','d','doc','l','b','c','t','a','arr','x','i','key','e','res','val','opt','st','r','u','doctor','sp','k','v','id','index','idx','item','row','o','p','h','m','f','g','w','z','y','q','name','value','label','Number','String','Object','Array','Math','Date','JSON','parseInt','parseFloat','isNaN','typeof','new','return','function','if','else','length','includes','toFixed','filter','map','find','join','some','trim']);
const used=new Set();
for (const ex of exprs){ const cleaned=ex.replace(/'[^']*'|"[^"]*"/g,''); for (const m of cleaned.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)) used.add(m[1]); }
const missing=[...used].filter(n=>!names.has(n)&&!ignore.has(n));
console.log('setup exports:',names.size,'| template identifiers checked:',used.size);
console.log('possibly missing (review; loop vars are false positives):',missing.join(', ')||'none');
for (const need of ['authMode','registerForm','handleRegister','loginForm','handleLogin','handleLogout','publicPage','navigatePublic','downloadDoctorSchedule','createDoctorAccount']) if(!names.has(need)) {console.log('MISSING EXPORT',need);process.exitCode=1}
for (const need of ['v-model="registerForm.first_name"','v-model="registerForm.last_name"','pattern="09[0-9]{9}"']) {
  if (!tpl.includes(need)) { console.log('MISSING REGISTRATION RULE',need); process.exitCode=1; }
}
for (const page of ['home','about','doctors','how','contact']) {
  if (!tpl.includes(`href="?page=${page}"`) || !tpl.includes(`publicPage === '${page}'`)) {
    console.log('MISSING PUBLIC PAGE ROUTE',page); process.exitCode=1;
  }
}
for (const need of ['Browse specialties','Download schedule CSV','WEEKLY CLINIC DAYS']) {
  if (!tpl.includes(need)) { console.log('MISSING DOCTOR DIRECTORY FEATURE',need); process.exitCode=1; }
}
for (const need of ['+ Create doctor account','Doctor accounts','createDoctorAccount','Workdays & Worktime','editWorkSchedule','schedule-period-am','schedule-period-pm']) {
  if (!tpl.includes(need)) { console.log('MISSING COORDINATOR DOCTOR ACCOUNT CREATION',need); process.exitCode=1; }
}
for (const need of ['set_work_schedule','doctorScheduleLabel','loadDoctorTimeOptions','info.slots?.includes(t)']) {
  if (!fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8').includes(need)) {
    console.log('MISSING DOCTOR SCHEDULE HOURS IN APPOINTMENT FLOW',need);
    process.exitCode=1;
  }
}
for (const need of ['Doctor account list','Download doctor accounts CSV','Demo doctor profiles','Add sample doctor','Sample doctor']) {
  if (tpl.includes(need)) { console.log('UNEXPECTED SAMPLE/EXPORT UI',need); process.exitCode=1; }
}
if (!fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8').includes("action: 'create_doctor_account'")) {
  console.log('MISSING DOCTOR ACCOUNT CREATION API ACTION');
  process.exitCode=1;
}
const bookingApi=fs.readFileSync(path.join(__dirname,'..','backend','api','book.php'),'utf8');
if (!bookingApi.includes("notify_doctor($pdo, $doctor_id, 'New Appointment Request'") ||
    !bookingApi.includes('Please review and accept or decline.')) {
  console.log('MISSING DOCTOR NOTIFICATION FOR PATIENT APPOINTMENT REQUEST');
  process.exitCode=1;
}
if (!bookingApi.includes("status NOT IN ('Completed', 'Cancelled')") ||
    !tpl.includes('Active appointment already scheduled')) {
  console.log('MISSING ONE-ACTIVE-APPOINTMENT BOOKING LIMIT');
  process.exitCode=1;
}
const appointmentTimes=ret.TIME_SLOTS;
if (appointmentTimes.length!==11 || appointmentTimes[0]?.value!=='09:00:00' || appointmentTimes[5]?.value!=='11:30:00' ||
    appointmentTimes[6]?.value!=='13:30:00' || appointmentTimes[10]?.value!=='15:30:00' ||
    appointmentTimes.some(t=>['12:00:00','12:30:00','13:00:00','16:00:00'].includes(t.value))) {
  console.log('INVALID 30-MINUTE CLINIC APPOINTMENT SCHEDULE',appointmentTimes);
  process.exitCode=1;
}
for (const need of ['booking-slot-grid','isSlotDisabled','Checking the latest availability','Booked','publicAvailability','OPEN DATES','Next 30 days','booking-weekday-list','availableWeekdaysForDoctor','selectAvailableWeekday','selectAvailableDate','openPatientBooking']) {
  if (!tpl.includes(need)) { console.log('MISSING LIVE BOOKING SLOT FEATURE',need); process.exitCode=1; }
}
if (tpl.includes('booking-date-list')) {
  console.log('UNEXPECTED MONTH-LONG DATE LIST IN PATIENT BOOKING');
  process.exitCode=1;
}
const publicDoctors=tpl.slice(tpl.indexOf("publicPage === 'doctors'"),tpl.indexOf("publicPage === 'how'"));
if (publicDoctors.includes('room_number') || publicDoctors.includes('CLINIC ROOM')) {
  console.log('UNEXPECTED CLINIC ROOM CONTENT IN PUBLIC DOCTOR SCHEDULE');
  process.exitCode=1;
}
if (tpl.includes("Browse available doctors, their specialty, clinic room")) {
  console.log('UNEXPECTED CLINIC ROOM CONTENT IN PATIENT DIRECTORY');
  process.exitCode=1;
}
