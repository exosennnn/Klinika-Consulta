-- KLINIKA CONSULTA - FRESH DEMO DATABASE
-- Import into a NEW, EMPTY database named klinika_consulta_db.
-- Contains demo users and doctors only; no previous patient appointments or OTP data.
-- DO NOT import into an existing database with data.

CREATE DATABASE IF NOT EXISTS `klinika_consulta_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `klinika_consulta_db`;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 09, 2026 at 04:04 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `klinika_consulta_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `reference_code` varchar(20) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `patient_name` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email_address` varchar(150) DEFAULT NULL,
  `contact_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_channel` varchar(10) DEFAULT NULL,
  `specialty_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'Pending',
  `booked_by_role` varchar(20) DEFAULT 'patient',
  `decline_reason` varchar(255) DEFAULT NULL,
  `followup_timeframe` varchar(100) DEFAULT NULL,
  `followup_notes` text DEFAULT NULL,
  `reason_for_visit` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `forwarded_to_doctor` tinyint(1) NOT NULL DEFAULT 0,
  `coordinator_note` text DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `patient_notified` tinyint(1) NOT NULL DEFAULT 0,
  `reminder_email_sent_at` datetime DEFAULT NULL,
  `booked_email_sent_at` datetime DEFAULT NULL,
  `followup_email_sent_at` datetime DEFAULT NULL,
  `followup_relayed` tinyint(1) NOT NULL DEFAULT 0,
  `parent_id` int(11) DEFAULT NULL,
  `active_slot` varchar(40) GENERATED ALWAYS AS (if(`status` in ('Cancelled','Needs_Reassignment'),NULL,concat(`doctor_id`,'|',`appointment_date`,'|',`appointment_time`))) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--


-- --------------------------------------------------------

--
-- Table structure for table `appointment_reschedule_history`
--

CREATE TABLE `appointment_reschedule_history` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `old_date` date NOT NULL,
  `old_time` time NOT NULL,
  `new_date` date NOT NULL,
  `new_time` time NOT NULL,
  `changed_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `specialty_id` int(11) NOT NULL,
  `room_number` varchar(20) DEFAULT NULL,
  `available_days` varchar(100) DEFAULT 'Mon-Fri',
  `work_schedule` longtext DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Active',
  `is_demo` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `name`, `specialty_id`, `room_number`, `available_days`, `work_schedule`, `status`, `is_demo`) VALUES
(1, 'Dr. Maria Santos', 1, 'Room 101', 'Mon-Fri', NULL, 'Active', 0),
(2, 'Dr. Jose Reyes', 1, 'Room 102', 'Mon,Wed,Fri', NULL, 'Active', 0),
(3, 'Dr. Ana Cruz', 2, 'Room 201', 'Mon-Thu', NULL, 'Active', 0),
(4, 'Dr. Luis Garcia', 3, 'Room 301', 'Tue,Thu,Sat', NULL, 'Active', 0),
(5, 'Dr. Carla Mendoza', 4, 'Room 401', 'Mon-Fri', NULL, 'Active', 0),
(6, 'Dr. Nina Lim', 5, 'Room 501', 'Mon,Tue,Fri', NULL, 'Active', 0),
(7, 'Dr. Rafael Torres', 6, 'Room 203', 'Mon,Wed,Fri', NULL, 'Active', 0),
(8, 'Dr. Sofia Villanueva', 7, 'Room 104', 'Tue,Thu,Sat', NULL, 'Active', 0),
(9, 'Dr. Angela Ramos', 8, 'Room 205', 'Mon,Wed,Thu', NULL, 'Active', 0),
(10, 'Dr. Marco Bautista', 9, 'Room 302', 'Tue,Fri,Sat', NULL, 'Active', 0),
(11, 'Dr. Elena Navarro', 10, 'Room 303', 'Mon,Thu,Fri', NULL, 'Active', 0),
(12, 'Dr. Paolo Aquino', 11, 'Room 304', 'Tue,Wed,Sat', NULL, 'Active', 0),
(13, 'Dr. Bea Castillo', 12, 'Room 305', 'Mon,Wed,Fri', NULL, 'Active', 0),
(14, 'Dr. Miguel Flores', 13, 'Room 306', 'Tue,Thu,Sat', NULL, 'Active', 0),
(15, 'Dr. Camille Dizon', 14, 'Room 307', 'Mon,Thu,Fri', NULL, 'Active', 0);

-- --------------------------------------------------------

--
-- Table structure for table `doctor_blockouts`
--

CREATE TABLE `doctor_blockouts` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `block_date` date NOT NULL,
  `type` varchar(30) DEFAULT 'emergency',
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctor_leaves`
--

CREATE TABLE `doctor_leaves` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `leave_type` varchar(20) NOT NULL DEFAULT 'Planned',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guest_otp_verifications`
--

CREATE TABLE `guest_otp_verifications` (
  `id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `verification_token` varchar(80) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email_address` varchar(150) DEFAULT NULL,
  `channel` varchar(10) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guest_otp_verifications`
--


-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `ip` varchar(45) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `kind` varchar(10) NOT NULL DEFAULT 'login',
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_attempts`
--


-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `sender_user_id` int(11) NOT NULL,
  `receiver_user_id` int(11) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `target_role` varchar(20) NOT NULL,
  `target_user_id` int(11) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--


-- --------------------------------------------------------

--
-- Table structure for table `specialties`
--

CREATE TABLE `specialties` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `specialties`
--

INSERT INTO `specialties` (`id`, `name`, `description`) VALUES
(1, 'General Medicine', 'General check-up and consultation'),
(2, 'Pediatrics', 'Care for children'),
(3, 'Cardiology', 'Heart and blood pressure care'),
(4, 'Dermatology', 'Skin, hair and nails'),
(5, 'Ophthalmology', 'Eye and vision care'),
(6, 'Internal Medicine', 'Adult medical care and long-term condition management'),
(7, 'Family Medicine', 'Primary care for patients and families of all ages'),
(8, 'OB-GYN', 'Women’s health, pregnancy, and reproductive care'),
(9, 'Orthopedics', 'Bones, joints, muscles, and injury care'),
(10, 'Neurology', 'Brain, nerves, headaches, and neurologic concerns'),
(11, 'ENT', 'Ear, nose, throat, and related conditions'),
(12, 'Pulmonology', 'Lung and respiratory care'),
(13, 'Gastroenterology', 'Digestive system and gastrointestinal care'),
(14, 'Endocrinology', 'Hormonal, thyroid, and metabolic care');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('patient','doctor','coordinator') NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `doctor_id`, `contact_number`) VALUES
(1, 'patient1', '$2y$10$y.l8qGdqi1lSfHpeF8s1n.woyq./.QmJCcvBs/vFZl5/783ISDzDG', 'Juan Dela Cruz', 'patient', NULL, '09123456789'),
(2, 'coordinator1', '$2y$10$2O0N6XVhm/cDN7FmsdobZO8EbszGQ.B6SuZbjNLCUf/gECfk9rZKO', 'Nurse Liza Ramos', 'coordinator', NULL, NULL),
(3, 'doctor1', '$2y$10$ohyv/NB5jMPPNKFKd.NTwOp0flI2FlTijhYXIxF.XNaS/ytCxa0PS', 'Dr. Maria Santos', 'doctor', 1, NULL),
(4, 'dr_reyes', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Jose Reyes', 'doctor', 2, NULL),
(5, 'dr_cruz', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Ana Cruz', 'doctor', 3, NULL),
(6, 'dr_garcia', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Luis Garcia', 'doctor', 4, NULL),
(7, 'dr_mendoza', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Carla Mendoza', 'doctor', 5, NULL),
(8, 'dr_lim', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Nina Lim', 'doctor', 6, NULL),
(9, 'dr_torres', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Rafael Torres', 'doctor', 7, NULL),
(10, 'dr_villanueva', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Sofia Villanueva', 'doctor', 8, NULL),
(11, 'dr_ramos', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Angela Ramos', 'doctor', 9, NULL),
(12, 'dr_bautista', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Marco Bautista', 'doctor', 10, NULL),
(13, 'dr_navarro', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Elena Navarro', 'doctor', 11, NULL),
(14, 'dr_aquino', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Paolo Aquino', 'doctor', 12, NULL),
(15, 'dr_castillo', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Bea Castillo', 'doctor', 13, NULL),
(16, 'dr_flores', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Miguel Flores', 'doctor', 14, NULL),
(17, 'dr_dizon', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Camille Dizon', 'doctor', 15, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_appointment` (`appointment_id`,`created_at`),
  ADD KEY `idx_activity_user` (`user_id`,`created_at`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_code` (`reference_code`),
  ADD UNIQUE KEY `uq_active_slot` (`active_slot`),
  ADD KEY `idx_slot` (`doctor_id`,`appointment_date`,`appointment_time`),
  ADD KEY `specialty_id` (`specialty_id`);

--
-- Indexes for table `appointment_reschedule_history`
--
ALTER TABLE `appointment_reschedule_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_resched_app` (`appointment_id`,`created_at`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `specialty_id` (`specialty_id`);

--
-- Indexes for table `doctor_blockouts`
--
ALTER TABLE `doctor_blockouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `guest_otp_verifications`
--
ALTER TABLE `guest_otp_verifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD UNIQUE KEY `verification_token` (`verification_token`),
  ADD KEY `idx_guest_otp_contact` (`contact_number`,`created_at`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ip` (`ip`,`kind`,`attempted_at`),
  ADD KEY `idx_user` (`username`,`kind`,`attempted_at`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_msg_appt` (`appointment_id`,`created_at`),
  ADD KEY `idx_msg_receiver` (`receiver_user_id`,`is_read`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `specialties`
--
ALTER TABLE `specialties`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `appointment_reschedule_history`
--
ALTER TABLE `appointment_reschedule_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `doctor_blockouts`
--
ALTER TABLE `doctor_blockouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guest_otp_verifications`
--
ALTER TABLE `guest_otp_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `specialties`
--
ALTER TABLE `specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`);

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`);

--
-- Constraints for table `doctor_blockouts`
--
ALTER TABLE `doctor_blockouts`
  ADD CONSTRAINT `doctor_blockouts_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- EXPANDED SYSTEM FEATURES (26 specialties total)
-- Run ONCE on your existing klinika_consulta_db; backup first.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_address VARCHAR(150) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS password_reset_codes (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, code_hash VARCHAR(255) NOT NULL, attempts INT NOT NULL DEFAULT 0, expires_at DATETIME NOT NULL, used_at DATETIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_reset_user (user_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO specialties (name,description) SELECT 'Dentistry','Dental and oral health' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Dentistry');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Andrea Mercado',s.id,'Demo', 'Mon,Wed,Fri','Active',1 FROM specialties s WHERE s.name='Dentistry' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Andrea Mercado' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_dentistry', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Dentistry' AND d.name='Dr. Andrea Mercado' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Psychiatry','Mental health assessment and care' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Psychiatry');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Daniel Valdez',s.id,'Demo', 'Tue,Thu,Sat','Active',1 FROM specialties s WHERE s.name='Psychiatry' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Daniel Valdez' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_psychiatry', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Psychiatry' AND d.name='Dr. Daniel Valdez' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Urology','Urinary tract and male reproductive health' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Urology');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Victor Salazar',s.id,'Demo', 'Mon,Thu,Fri','Active',1 FROM specialties s WHERE s.name='Urology' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Victor Salazar' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_urology', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Urology' AND d.name='Dr. Victor Salazar' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Nephrology','Kidney care and related conditions' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Nephrology');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Isabel Tan',s.id,'Demo', 'Tue,Wed,Sat','Active',1 FROM specialties s WHERE s.name='Nephrology' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Isabel Tan' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_nephrology', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Nephrology' AND d.name='Dr. Isabel Tan' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'General Surgery','Surgical evaluation and general surgery' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='General Surgery');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Benjamin Rivera',s.id,'Demo', 'Mon,Wed,Fri','Active',1 FROM specialties s WHERE s.name='General Surgery' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Benjamin Rivera' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_generalsurgery', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='General Surgery' AND d.name='Dr. Benjamin Rivera' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Physical Medicine and Rehabilitation','Rehabilitation and recovery of movement' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Physical Medicine and Rehabilitation');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Patricia Sy',s.id,'Demo', 'Tue,Thu,Sat','Active',1 FROM specialties s WHERE s.name='Physical Medicine and Rehabilitation' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Patricia Sy' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_physicalmedicineandrehabilitatio', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Physical Medicine and Rehabilitation' AND d.name='Dr. Patricia Sy' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Rheumatology','Arthritis and autoimmune joint conditions' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Rheumatology');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Gabriela Chua',s.id,'Demo', 'Mon,Thu,Fri','Active',1 FROM specialties s WHERE s.name='Rheumatology' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Gabriela Chua' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_rheumatology', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Rheumatology' AND d.name='Dr. Gabriela Chua' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Hematology','Blood disorders and blood health' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Hematology');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Nathan Ong',s.id,'Demo', 'Tue,Wed,Fri','Active',1 FROM specialties s WHERE s.name='Hematology' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Nathan Ong' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_hematology', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Hematology' AND d.name='Dr. Nathan Ong' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Oncology','Cancer assessment and coordinated treatment' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Oncology');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Teresa Yu',s.id,'Demo', 'Mon,Wed,Sat','Active',1 FROM specialties s WHERE s.name='Oncology' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Teresa Yu' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_oncology', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Oncology' AND d.name='Dr. Teresa Yu' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Infectious Diseases','Infections and infectious disease consultations' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Infectious Diseases');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Carlo Fernandez',s.id,'Demo', 'Tue,Thu,Fri','Active',1 FROM specialties s WHERE s.name='Infectious Diseases' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Carlo Fernandez' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_infectiousdiseases', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Infectious Diseases' AND d.name='Dr. Carlo Fernandez' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Allergy and Immunology','Allergies and immune conditions' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Allergy and Immunology');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Hannah Go',s.id,'Demo', 'Mon,Wed,Fri','Active',1 FROM specialties s WHERE s.name='Allergy and Immunology' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Hannah Go' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_allergyandimmunology', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Allergy and Immunology' AND d.name='Dr. Hannah Go' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);
INSERT INTO specialties (name,description) SELECT 'Geriatrics','Medical care for older adults' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name='Geriatrics');
INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo) SELECT 'Dr. Emilio Ramos',s.id,'Demo', 'Tue,Thu,Sat','Active',1 FROM specialties s WHERE s.name='Geriatrics' AND NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Emilio Ramos' AND specialty_id=s.id);
INSERT INTO users (username,password,full_name,role,doctor_id) SELECT 'demo_geriatrics', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', d.name, 'doctor', d.id FROM doctors d JOIN specialties s ON s.id=d.specialty_id WHERE s.name='Geriatrics' AND d.name='Dr. Emilio Ramos' AND NOT EXISTS (SELECT 1 FROM users WHERE doctor_id=d.id);

DROP TEMPORARY TABLE IF EXISTS `_reassignment_doctor_seed`;
CREATE TEMPORARY TABLE `_reassignment_doctor_seed` (
    `specialty_name` VARCHAR(100) NOT NULL,
    `doctor_name` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `available_days` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`specialty_name`)
);
INSERT INTO `_reassignment_doctor_seed` (`specialty_name`,`doctor_name`,`username`,`available_days`) VALUES
('General Medicine','Dr. Adrian Villareal','dr_adrian_villareal','Mon,Wed,Fri'),
('Pediatrics','Dr. Sofia Mercado','dr_sofia_mercado','Tue,Thu,Sat'),
('Cardiology','Dr. Gabriel Santos','dr_gabriel_santos','Mon,Thu,Fri'),
('Dermatology','Dr. Lucia Navarro','dr_lucia_navarro','Tue,Wed,Sat'),
('Ophthalmology','Dr. Miguel Tan','dr_miguel_tan','Mon,Wed,Fri'),
('Internal Medicine','Dr. Irene Valdez','dr_irene_valdez','Tue,Thu,Sat'),
('Family Medicine','Dr. Paulo Garcia','dr_paulo_garcia','Mon,Thu,Fri'),
('OB-GYN','Dr. Teresa Mendoza','dr_teresa_mendoza','Tue,Wed,Sat'),
('Orthopedics','Dr. Rafael Lim','dr_rafael_lim','Mon,Wed,Fri'),
('Neurology','Dr. Clara Reyes','dr_clara_reyes','Tue,Thu,Sat'),
('ENT','Dr. Nicolas Bautista','dr_nicolas_bautista','Mon,Thu,Fri'),
('Pulmonology','Dr. Andrea Castillo','dr_andrea_castillo','Tue,Wed,Sat'),
('Gastroenterology','Dr. Javier Flores','dr_javier_flores','Mon,Wed,Fri'),
('Endocrinology','Dr. Bianca Aquino','dr_bianca_aquino','Tue,Thu,Sat'),
('Dentistry','Dr. Marco Santiago','dr_marco_santiago','Mon,Wed,Fri'),
('Psychiatry','Dr. Elena Cruz','dr_elena_cruz','Tue,Thu,Sat'),
('Urology','Dr. Andres Dela Cruz','dr_andres_dela_cruz','Mon,Thu,Fri'),
('Nephrology','Dr. Camille Ortega','dr_camille_ortega','Tue,Wed,Sat'),
('General Surgery','Dr. Luis Domingo','dr_luis_domingo','Mon,Wed,Fri'),
('Physical Medicine and Rehabilitation','Dr. Nina Salazar','dr_nina_salazar','Tue,Thu,Sat'),
('Rheumatology','Dr. Tomas Villanueva','dr_tomas_villanueva','Mon,Thu,Fri'),
('Hematology','Dr. Amara Chua','dr_amara_chua','Tue,Wed,Sat'),
('Oncology','Dr. Paolo Fernandez','dr_paolo_fernandez','Mon,Wed,Fri'),
('Infectious Diseases','Dr. Beatriz Gomez','dr_beatriz_gomez','Tue,Thu,Sat'),
('Allergy and Immunology','Dr. Samuel Ramos','dr_samuel_ramos','Mon,Thu,Fri'),
('Geriatrics','Dr. Olivia Tan','dr_olivia_tan','Tue,Wed,Sat');

INSERT INTO doctors (name,specialty_id,room_number,available_days,status,is_demo)
SELECT seed.doctor_name,s.id,'Demo',seed.available_days,'Active',1
FROM `_reassignment_doctor_seed` seed
JOIN specialties s ON s.name=seed.specialty_name
WHERE NOT EXISTS (
    SELECT 1 FROM doctors d
    WHERE d.name=seed.doctor_name AND d.specialty_id=s.id
);

INSERT INTO users (username,password,full_name,role,doctor_id)
SELECT seed.username,'$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe',d.name,'doctor',d.id
FROM `_reassignment_doctor_seed` seed
JOIN specialties s ON s.name=seed.specialty_name
JOIN doctors d ON d.name=seed.doctor_name AND d.specialty_id=s.id
WHERE NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.username=seed.username OR u.doctor_id=d.id
);
DROP TEMPORARY TABLE `_reassignment_doctor_seed`;
