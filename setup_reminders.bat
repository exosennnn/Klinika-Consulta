@echo off
setlocal
set "PHP=C:\xampp\php\php.exe"
set "JOB=C:\xampp\htdocs\klinika_consulta\backend\jobs\appointment_watch.php"
if not exist "%PHP%" (echo ERROR: PHP not found at %PHP% & pause & exit /b 1)
if not exist "%JOB%" (echo ERROR: Job not found at %JOB% & pause & exit /b 1)
schtasks /Create /F /SC HOURLY /MO 1 /TN "KlinikaConsultaAppointmentWatch" /TR "\"%PHP%\" \"%JOB%\""
if errorlevel 1 (echo Task creation failed. See error above.) else (echo Task created. Confirm it in Windows Task Scheduler.)
pause
