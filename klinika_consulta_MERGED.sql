-- MERGED DATABASE: leader (4) as authoritative base; added activity_logs.role from (5).
-- IMPORTANT: Fresh/empty database import only. Do not import over existing tables.
-- The two exports have conflicting doctor/specialty/user IDs; blindly combining rows would corrupt references.
-- Transient OTP attempts from (5) are intentionally not imported.

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 13, 2026 at 05:50 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
CREATE DATABASE IF NOT EXISTS `klinika_consulta_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `klinika_consulta_db`;
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `role` varchar(20) DEFAULT NULL,
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
  `followup_relayed` tinyint(1) NOT NULL DEFAULT 0,
  `parent_id` int(11) DEFAULT NULL,
  `active_slot` varchar(40) GENERATED ALWAYS AS (if(`status` in ('Cancelled','Needs_Reassignment'),NULL,concat(`doctor_id`,'|',`appointment_date`,'|',`appointment_time`))) STORED,
  `reminder_email_sent_at` datetime DEFAULT NULL,
  `booked_email_sent_at` datetime DEFAULT NULL,
  `followup_email_sent_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `reference_code`, `patient_id`, `patient_name`, `contact_number`, `email_address`, `contact_verified`, `verification_channel`, `specialty_id`, `doctor_id`, `appointment_date`, `appointment_time`, `status`, `booked_by_role`, `decline_reason`, `followup_timeframe`, `followup_notes`, `reason_for_visit`, `created_at`, `forwarded_to_doctor`, `coordinator_note`, `cancel_reason`, `patient_notified`, `followup_relayed`, `parent_id`, `reminder_email_sent_at`, `booked_email_sent_at`, `followup_email_sent_at`) VALUES
(6, 'REF-6DF0BDB6', NULL, 'Jay Mark Almojuela', '09481340800', 'almojuelajaymark0@gmail.com', 1, 'email', 5, 6, '2026-10-12', '09:00:00', 'Cancelled', 'guest', NULL, NULL, NULL, 'My child is sick or needs a check-up', '2026-10-10 13:25:05', 1, NULL, 'Cancelled by guest via Track Appointment', 1, 0, NULL, NULL, '2026-10-13 01:35:03', NULL),
(7, 'REF-3B8D5B59', NULL, 'Juan Dela Cruz', '09481340800', 'exosen075@gmail.com', 1, 'email', 3, 4, '2026-10-13', '09:00:00', 'Completed', 'guest', NULL, 'within 2 weeks', NULL, NULL, '2026-10-11 13:30:56', 1, NULL, NULL, 1, 1, NULL, NULL, NULL, '2026-10-13 16:35:12'),
(8, 'REF-D71308F9', 1, 'Juan Dela Cruz', '09123456789', NULL, 0, NULL, 24, 25, '2026-10-13', '09:00:00', 'Cancelled', 'patient', NULL, NULL, NULL, 'Fever, cough, colds or general check-up', '2026-10-11 13:41:44', 1, NULL, 'wala lang', 0, 0, NULL, NULL, NULL, NULL),
(9, 'REF-6FDC9FDC', 1, 'Juan Dela Cruz', '09123456789', NULL, 0, NULL, 4, 5, '2026-10-21', '11:00:00', 'Cancelled', 'patient', NULL, NULL, NULL, 'Fever, cough, colds or general check-up', '2026-10-11 13:44:15', 1, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL),
(10, 'REF-B89B3D05', NULL, 'Jose Rizal', '0948129389', NULL, 0, NULL, 2, 3, '2026-10-29', '09:00:00', 'Booked', 'coordinator', NULL, NULL, NULL, NULL, '2026-10-11 13:47:33', 1, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL),
(11, 'REF-782941AC', NULL, 'Juan Dela Cruz', '09481340800', NULL, 0, NULL, 3, 4, '2026-10-29', '09:30:00', 'Checked_In', 'coordinator', NULL, NULL, NULL, NULL, '2026-10-11 13:58:43', 1, NULL, NULL, 1, 0, 7, NULL, NULL, NULL),
(12, 'REF-E5A72D99', 1, 'Juan Dela Cruz', '09123456789', NULL, 0, NULL, 15, 16, '2026-10-19', '09:30:00', 'Cancelled', 'patient', NULL, NULL, NULL, 'sakit ng ngipin ko', '2026-10-12 16:37:51', 1, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL),
(13, 'REF-6222FAE6', 1, 'Juan Dela Cruz', '09123456789', NULL, 0, NULL, 14, 15, '2026-10-13', '10:30:00', 'Cancelled', 'patient', NULL, NULL, NULL, 'Thyroid, diabetes or hormone concerns', '2026-10-12 16:39:48', 1, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL),
(14, 'REF-E3BEE930', NULL, 'Pedro Reyes', '09121238890', 'exosen075@gmail.com', 1, 'email', 2, 3, '2026-10-13', '03:13:07', 'Booked', 'guest', NULL, NULL, NULL, 'My child is sick or needs a check-up', '2026-10-12 17:03:58', 1, NULL, NULL, 1, 0, NULL, '2026-10-13 01:13:15', '2026-10-13 01:35:06', NULL),
(15, 'REF-BFBB5154', NULL, 'Victória Gaios', '09481340800', 'toshironoaim@gmail.com', 1, 'email', 2, 3, '2026-10-13', '13:30:00', 'Booked', 'guest', NULL, NULL, NULL, 'My child is sick or needs a check-up', '2026-10-12 17:18:51', 1, NULL, NULL, 1, 0, NULL, '2026-10-13 01:21:29', '2026-10-13 01:35:08', NULL),
(16, 'REF-1890254A', NULL, 'Clopas Oscar', '09481340800', 'graysync12345@gmail.com', 1, 'email', 4, 5, '2026-11-09', '14:30:00', 'Completed', 'guest', NULL, 'within 2 weeks', 'wag ka maglalakad', 'Skin rash, itching or acne', '2026-10-12 17:29:12', 1, NULL, NULL, 1, 0, NULL, NULL, '2026-10-13 01:29:28', '2026-10-13 01:36:28'),
(17, 'REF-EB56B479', NULL, 'Clopas Oscar', '09481340800', 'graysync12345@gmail.com', 1, 'email', 4, 5, '2026-11-06', '11:00:00', 'Cancelled', 'guest', NULL, NULL, NULL, NULL, '2026-10-12 17:46:43', 1, NULL, 'Cancelled by guest via Track Appointment', 1, 0, NULL, NULL, '2026-10-13 01:47:14', NULL),
(18, 'REF-82D17ED5', 1, 'Juan Dela Cruz', '09123456789', NULL, 0, NULL, 9, 10, '2026-10-16', '09:30:00', 'Booked', 'patient', NULL, NULL, NULL, 'Joint, bone or muscle pain', '2026-10-13 03:17:00', 1, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL),
(19, 'REF-7B121605', NULL, 'Andres Bonifacio', '09481340800', 'exosen075@gmail.com', 1, 'email', 26, 27, '2026-11-07', '14:30:00', 'Cancelled', 'guest', NULL, NULL, NULL, NULL, '2026-10-13 14:36:22', 1, NULL, 'Cancelled by guest via Track Appointment', 0, 0, NULL, NULL, NULL, NULL),
(20, 'REF-53E77F2F', 33, 'Andres Bonifacio', '09481340800', 'exosen075@gmail.com', 1, 'email', 5, 6, '2026-10-27', '14:00:00', 'Completed', 'guest', NULL, 'within 2 weeks', NULL, NULL, '2026-10-13 14:39:51', 1, NULL, NULL, 1, 0, NULL, NULL, '2026-10-13 22:40:24', '2026-10-13 22:41:41'),
(21, 'REF-408484E7', 33, 'Andres Bonifacio', '09481340800', NULL, 0, NULL, 5, 6, '2026-10-19', '09:30:00', 'Needs_Reassignment', 'patient', NULL, NULL, NULL, NULL, '2026-10-13 14:53:19', 0, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL);

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
-- Table structure for table `appointment_waitlist`
--

CREATE TABLE `appointment_waitlist` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `guest_name` varchar(100) DEFAULT NULL,
  `guest_phone` varchar(20) DEFAULT NULL,
  `guest_email` varchar(150) DEFAULT NULL,
  `doctor_id` int(11) NOT NULL,
  `specialty_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `reason_for_visit` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Waiting',
  `offer_token` char(64) DEFAULT NULL,
  `offered_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `claimed_appointment_id` int(11) DEFAULT NULL,
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
(15, 'Dr. Camille Dizon', 14, 'Room 307', 'Mon,Thu,Fri', NULL, 'Active', 0),
(16, 'Dr. Andrea Mercado', 15, 'Demo', 'Mon,Wed,Fri', '{\"1\":[{\"start\":\"09:00\",\"end\":\"12:00\"},{\"start\":\"13:30\",\"end\":\"16:00\"}],\"3\":[{\"start\":\"09:00\",\"end\":\"12:00\"},{\"start\":\"13:30\",\"end\":\"16:00\"}],\"5\":[{\"start\":\"09:00\",\"end\":\"12:00\"},{\"start\":\"13:30\",\"end\":\"16:00\"}]}', 'Active', 1),
(17, 'Dr. Daniel Valdez', 16, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(18, 'Dr. Victor Salazar', 17, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(19, 'Dr. Isabel Tan', 18, 'Demo', 'Tue,Wed,Sat', NULL, 'Active', 1),
(20, 'Dr. Benjamin Rivera', 19, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(21, 'Dr. Patricia Sy', 20, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(22, 'Dr. Gabriela Chua', 21, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(23, 'Dr. Nathan Ong', 22, 'Demo', 'Tue,Wed,Fri', NULL, 'Active', 1),
(24, 'Dr. Teresa Yu', 23, 'Demo', 'Mon,Wed,Sat', NULL, 'Active', 1),
(25, 'Dr. Carlo Fernandez', 24, 'Demo', 'Tue,Thu,Fri', NULL, 'Active', 1),
(26, 'Dr. Hannah Go', 25, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(27, 'Dr. Emilio Ramos', 26, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(28, 'Dr. Mark Estuita', 3, NULL, 'Mon,Wed,Fri', '{\"1\":[{\"start\":\"09:00\",\"end\":\"12:00\"},{\"start\":\"13:30\",\"end\":\"16:00\"}],\"3\":[{\"start\":\"09:00\",\"end\":\"12:00\"},{\"start\":\"13:30\",\"end\":\"16:00\"}],\"5\":[{\"start\":\"09:00\",\"end\":\"12:00\"},{\"start\":\"13:30\",\"end\":\"16:00\"}]}', 'Active', 0),
(29, 'Dr. Adrian Villareal', 1, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(30, 'Dr. Sofia Mercado', 2, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(31, 'Dr. Gabriel Santos', 3, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(32, 'Dr. Lucia Navarro', 4, 'Demo', 'Tue,Wed,Sat', NULL, 'Active', 1),
(33, 'Dr. Miguel Tan', 5, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(34, 'Dr. Irene Valdez', 6, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(35, 'Dr. Paulo Garcia', 7, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(36, 'Dr. Teresa Mendoza', 8, 'Demo', 'Tue,Wed,Sat', NULL, 'Active', 1),
(37, 'Dr. Rafael Lim', 9, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(38, 'Dr. Clara Reyes', 10, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(39, 'Dr. Nicolas Bautista', 11, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(40, 'Dr. Andrea Castillo', 12, 'Demo', 'Tue,Wed,Sat', NULL, 'Active', 1),
(41, 'Dr. Javier Flores', 13, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(42, 'Dr. Bianca Aquino', 14, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(43, 'Dr. Marco Santiago', 15, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(44, 'Dr. Elena Cruz', 16, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(45, 'Dr. Andres Dela Cruz', 17, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(46, 'Dr. Camille Ortega', 18, 'Demo', 'Tue,Wed,Sat', NULL, 'Active', 1),
(47, 'Dr. Luis Domingo', 19, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(48, 'Dr. Nina Salazar', 20, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(49, 'Dr. Tomas Villanueva', 21, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(50, 'Dr. Amara Chua', 22, 'Demo', 'Tue,Wed,Sat', NULL, 'Active', 1),
(51, 'Dr. Paolo Fernandez', 23, 'Demo', 'Mon,Wed,Fri', NULL, 'Active', 1),
(52, 'Dr. Beatriz Gomez', 24, 'Demo', 'Tue,Thu,Sat', NULL, 'Active', 1),
(53, 'Dr. Samuel Ramos', 25, 'Demo', 'Mon,Thu,Fri', NULL, 'Active', 1),
(54, 'Dr. Olivia Tan', 26, 'Demo', 'Tue,Wed,Sat', NULL, 'Active', 1);

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

--
-- Dumping data for table `doctor_blockouts`
--

INSERT INTO `doctor_blockouts` (`id`, `doctor_id`, `block_date`, `type`, `reason`, `created_at`) VALUES
(1, 5, '2026-10-11', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(2, 5, '2026-10-12', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(3, 5, '2026-10-13', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(4, 5, '2026-10-14', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(5, 5, '2026-10-15', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(6, 5, '2026-10-16', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(7, 5, '2026-10-17', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(8, 5, '2026-10-18', 'emergency', 'Emergency leave', '2026-10-11 13:53:22'),
(9, 5, '2026-10-19', 'emergency', 'Emergency leave', '2026-10-11 13:53:22');

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

--
-- Dumping data for table `doctor_leaves`
--

INSERT INTO `doctor_leaves` (`id`, `doctor_id`, `leave_type`, `start_date`, `end_date`, `reason`, `status`, `created_at`) VALUES
(1, 5, 'Emergency', '2026-10-11', '2026-10-19', 'Emergency leave', 'Approved', '2026-10-11 13:53:22'),
(2, 5, 'Planned', '2026-10-14', '2026-10-16', 'Planned leave', 'Approved', '2026-10-13 09:59:19');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_schedule_requests`
--

CREATE TABLE `doctor_schedule_requests` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `requested_days` varchar(100) NOT NULL,
  `requested_schedule` longtext NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending',
  `reviewed_by_user_id` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
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

INSERT INTO `guest_otp_verifications` (`id`, `token`, `verification_token`, `full_name`, `contact_number`, `email_address`, `channel`, `code_hash`, `attempts`, `verified`, `expires_at`, `verified_at`, `created_at`) VALUES
(16, '5ac05390d5e40e588a7bcb65da9f3e00577b56dad545c444', '25ca0f8d15af89a574720088bf5bc77b7d6f751d7f9ffd1382bb59728d8095c6', 'Jay Mark Almojuela', '09481340800', 'almojuelajaymark0@gmail.com', 'email', '$2y$10$a/f/m6HKPBZajjDVN7DXd.ZEO9LHIU4pekFR15QRcwug9wko9p//a', 0, 1, '2026-10-13 01:07:17', '2026-10-13 01:02:37', '2026-10-12 17:02:17'),
(19, '460b07e71069856f5ba1b02e9c9d23ddcdd15b10ae03cc70', 'b022a6fb3ab65c44e8e8dc199079711f8bbb2237874846a2caba82d827593dec', 'Victória Gaios', '09481340800', 'toshironoaim@gmail.com', 'email', '$2y$10$JT0/L0BBMCiwjAbIrrmP1uzQB6hkWZpbA5wlYDurnnIetX4m2fY5S', 0, 1, '2026-10-13 01:30:54', '2026-10-13 01:26:11', '2026-10-12 17:25:54'),
(20, 'ceb08f9dd70e3c94c3572d7838ec8c1e3b29592bb239431a', '411560f8a47bcb08b78299db27a6e200b43523e08cf6316fd08db24203b9c76c', 'Jay Mark Almojuela', '09481340800', 'graysync12345@gmail.com', 'email', '$2y$10$VCIKri5oP9t9RqqSW38Y6.F0.nuj0tkrauC/m4lt18P.04zcw9haq', 0, 1, '2026-10-13 01:32:04', '2026-10-13 01:27:35', '2026-10-12 17:27:04'),
(23, 'defa413f177459fb0e36d6034087fb796958beaee0c18dfe', '8c6f2348edde7c4b68633f9455765818925430a9a710d9854f6915debc2be8a8', 'Jay Almojuela', '09481340800', 'almojuelajaymark0@gmail.com', 'email', '$2y$10$FUHuk5Cx8HpCwu7EVtrgeOjsajDoQfjcIQ1hkNZ57T1ay.n/nYaQS', 0, 1, '2026-10-13 11:39:45', '2026-10-13 11:35:03', '2026-10-13 03:34:45'),
(24, '704b17a1f8ce02e10ef8c11b159a0d641a725ca5b29c990e', 'c6d18ca21206b08069e3bbf24817537a68d50cad194fe5eeca8510060a9b22d7', 'Jay Mark Almojuela', '09481340800', 'almojuelajaymark0@gmail.com', 'email', '$2y$10$h4LX3NXrcT2TxIDCKRb2QeOUq3LcmNoUJMHxj8cnSjITBeEN5RHmC', 0, 1, '2026-10-13 22:33:40', '2026-10-13 22:29:06', '2026-10-13 14:28:40'),
(27, '94d405f4d92d7a93bc3a984f8e00a3afd7206c4f9aef9f65', NULL, 'Andres', '09481340800', 'exosen075@gmail.com', 'email', '$2y$10$d0W9t7UCt31q3DcRT3plyeiVr37.xHv9HqKG3D9NI9AO5hR5ulZLy', 0, 0, '2026-10-13 22:48:03', NULL, '2026-10-13 14:43:03'),
(28, 'ce18c72fd40b947740836dfa9fb94a2239f3384ab8ab03dc', NULL, 'Andres Bonifacio', '09481340800', 'exosen075@gmail.com', 'email', '$2y$10$4By/E8ryfjQeDe8uYJ4XSuXUd.TOH39BxX7.ZI07r1j3CPC1bYi52', 1, 0, '2026-10-13 22:48:41', NULL, '2026-10-13 14:43:41'),
(29, '1052b6ecf4c24cf618a4a08d24891f4f91fcde5605f5e30b', NULL, 'Andres Bonifacio', '09481340800', 'exosen075@gmail.com', 'email', '$2y$10$XHG1VDdFeW7V71bkG.SC9urjEEo1X/jbTHrNvJpL3rGzMfyxYbuKe', 1, 0, '2026-10-13 22:49:19', NULL, '2026-10-13 14:44:19'),
(30, 'eb1520d2cc965dbb3b634a146ea3919ce91156333ba949d2', '89e90a2365f6d5803cc9d134cbbb2f124c0184c1d54a3cb39cd8f011a9e41485', 'Andres Bonifacio', '09481340800', 'exosen075@gmail.com', 'email', '$2y$10$.us/JEbaLKRJliQIQXAQdu/f/bYD2PnD/yWXyjsUr4j3vx45CKYjm', 0, 1, '2026-10-13 22:49:45', '2026-10-13 22:44:57', '2026-10-13 14:44:45');

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

INSERT INTO `login_attempts` (`id`, `ip`, `username`, `kind`, `attempted_at`) VALUES
(21, '::1', 'dr_mercado', 'login', '2026-10-12 16:38:08'),
(22, '::1', 'demo_dentistry', 'login', '2026-10-12 16:38:46'),
(23, '::1', 'demo_dentistry', 'login', '2026-10-12 16:38:56'),
(25, '::1', '09481340800', 'guest_book', '2026-10-12 17:02:57'),
(26, '::1', '09121238890', 'guest_book', '2026-10-12 17:03:58'),
(27, '::1', '09481340800', 'guest_book', '2026-10-12 17:18:51'),
(28, '::1', '09481340800', 'guest_book', '2026-10-12 17:26:25'),
(29, '::1', '09481340800', 'guest_book', '2026-10-12 17:27:45'),
(30, '::1', '09481340800', 'guest_book', '2026-10-12 17:29:12'),
(31, '::1', '09481340800', 'guest_book', '2026-10-12 17:46:43'),
(34, '::1', '09481340800', 'guest_book', '2026-10-13 14:29:54'),
(35, '::1', '09481340800', 'guest_book', '2026-10-13 14:36:22'),
(36, '::1', '09481340800', 'guest_book', '2026-10-13 14:39:51');

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

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `appointment_id`, `sender_user_id`, `receiver_user_id`, `message`, `is_read`, `created_at`) VALUES
(1, 9, 7, 1, 'AKJSDHFKJASHDFHASDJF', 1, '2026-10-11 13:44:53'),
(2, 9, 7, 1, 'FASDMFAKSDFA\\', 1, '2026-10-11 13:45:01'),
(3, 9, 1, 7, 'kjnkjnkjnkjnkj\'', 1, '2026-10-11 13:45:49');

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

INSERT INTO `notifications` (`id`, `target_role`, `target_user_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(20, 'doctor', 8, 'New Guest Appointment Request', 'Jay Mark Almojuela - 2026-10-12 09:00 (REF-6DF0BDB6). Please review.', 1, '2026-10-10 13:25:05'),
(21, 'coordinator', NULL, 'New Guest Reservation', 'Jay Mark Almojuela - 2026-10-12 09:00 (REF-6DF0BDB6). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-10 13:25:05'),
(22, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-6DF0BDB6. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-10 13:26:07'),
(23, 'doctor', 6, 'New Guest Appointment Request', 'Juan Dela Cruz - 2026-10-13 09:00 (REF-3B8D5B59). Please review.', 0, '2026-10-11 13:30:56'),
(24, 'coordinator', NULL, 'New Guest Reservation', 'Juan Dela Cruz - 2026-10-13 09:00 (REF-3B8D5B59). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-11 13:30:56'),
(25, 'coordinator', NULL, 'Shared Contact Number', 'Juan Dela Cruz used a mobile number that also appears on another patient record. Please verify the patient details during confirmation/check-in.', 1, '2026-10-11 13:30:56'),
(26, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-3B8D5B59. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-11 13:33:17'),
(27, 'doctor', 6, 'Patient Has Arrived', 'Juan Dela Cruz (REF-3B8D5B59) has been checked in and is ready for consultation.', 0, '2026-10-11 13:34:47'),
(28, 'coordinator', NULL, 'Consultation Completed', 'The consultation for REF-3B8D5B59 has been completed. Follow-up advice may now be recorded.', 1, '2026-10-11 13:35:28'),
(29, 'coordinator', NULL, 'Follow-up Advice', 'The doctor added follow-up advice for REF-3B8D5B59. Please arrange the follow-up schedule if needed.', 1, '2026-10-11 13:35:51'),
(30, 'doctor', 29, 'New Appointment Request', 'Juan Dela Cruz - 2026-10-13 09:00 (REF-D71308F9). Please review and accept or decline.', 0, '2026-10-11 13:41:44'),
(31, 'coordinator', NULL, 'New Reservation', 'Juan Dela Cruz - 2026-10-13 09:00:00 (REF-D71308F9). The assigned doctor can review it now.', 1, '2026-10-11 13:41:44'),
(32, 'patient', 1, 'Reservation Received', 'REF-D71308F9 received. Awaiting confirmation.', 1, '2026-10-11 13:41:44'),
(33, 'doctor', 29, 'Patient Cancelled', 'Juan Dela Cruz (REF-D71308F9) cancelled 2026-10-13 09:00. The slot is now free. Reason: wala lang', 0, '2026-10-11 13:43:43'),
(34, 'coordinator', NULL, 'Patient Cancelled', 'Juan Dela Cruz (REF-D71308F9) cancelled 2026-10-13 09:00. The slot is now free. Reason: wala lang', 1, '2026-10-11 13:43:43'),
(35, 'doctor', 7, 'New Appointment Request', 'Juan Dela Cruz - 2026-10-12 09:30 (REF-6FDC9FDC). Please review and accept or decline.', 1, '2026-10-11 13:44:15'),
(36, 'coordinator', NULL, 'New Reservation', 'Juan Dela Cruz - 2026-10-12 09:30:00 (REF-6FDC9FDC). The assigned doctor can review it now.', 1, '2026-10-11 13:44:15'),
(37, 'patient', 1, 'Reservation Received', 'REF-6FDC9FDC received. Awaiting confirmation.', 1, '2026-10-11 13:44:15'),
(38, 'doctor', 5, 'Walk-in Appointment', 'Jose Rizal - 2026-10-29 09:00:00 (REF-B89B3D05)', 0, '2026-10-11 13:47:33'),
(39, 'coordinator', NULL, 'Emergency Leave', '1 appointment(s) need to be reassigned (2026-10-11 to 2026-10-19).', 1, '2026-10-11 13:53:22'),
(40, 'doctor', 7, 'Appointment Reassigned', 'Juan Dela Cruz - 2026-10-21 11:00:00 (REF-6FDC9FDC). Please review.', 1, '2026-10-11 13:55:50'),
(41, 'doctor', 6, 'Follow-up Scheduled', 'Juan Dela Cruz - 2026-10-29 09:30:00 (REF-782941AC)', 0, '2026-10-11 13:58:43'),
(42, 'doctor', 6, 'Patient Has Arrived', 'Juan Dela Cruz (REF-782941AC) has been checked in and is ready for consultation.', 0, '2026-10-11 14:00:48'),
(43, 'doctor', 7, 'Patient Cancelled', 'Juan Dela Cruz (REF-6FDC9FDC) cancelled 2026-10-21 11:00. The slot is now free.', 1, '2026-10-12 16:33:58'),
(44, 'coordinator', NULL, 'Patient Cancelled', 'Juan Dela Cruz (REF-6FDC9FDC) cancelled 2026-10-21 11:00. The slot is now free.', 1, '2026-10-12 16:33:58'),
(45, 'doctor', 20, 'New Appointment Request', 'Juan Dela Cruz - 2026-10-19 09:30 (REF-E5A72D99). Please review and accept or decline.', 0, '2026-10-12 16:37:51'),
(46, 'coordinator', NULL, 'New Reservation', 'Juan Dela Cruz - 2026-10-19 09:30:00 (REF-E5A72D99). The assigned doctor can review it now.', 1, '2026-10-12 16:37:51'),
(47, 'patient', 1, 'Reservation Received', 'REF-E5A72D99 received. Awaiting confirmation.', 1, '2026-10-12 16:37:51'),
(48, 'doctor', 20, 'Patient Cancelled', 'Juan Dela Cruz (REF-E5A72D99) cancelled 2026-10-19 09:30. The slot is now free.', 0, '2026-10-12 16:39:12'),
(49, 'coordinator', NULL, 'Patient Cancelled', 'Juan Dela Cruz (REF-E5A72D99) cancelled 2026-10-19 09:30. The slot is now free.', 1, '2026-10-12 16:39:12'),
(50, 'doctor', 17, 'New Appointment Request', 'Juan Dela Cruz - 2026-10-19 09:30 (REF-6222FAE6). Please review and accept or decline.', 1, '2026-10-12 16:39:48'),
(51, 'coordinator', NULL, 'New Reservation', 'Juan Dela Cruz - 2026-10-19 09:30:00 (REF-6222FAE6). The assigned doctor can review it now.', 1, '2026-10-12 16:39:48'),
(52, 'patient', 1, 'Reservation Received', 'REF-6222FAE6 received. Awaiting confirmation.', 1, '2026-10-12 16:39:48'),
(53, 'patient', 1, 'Appointment reminder: REF-6222FAE6 · 2026-10-13 10:30', 'Your visit with Dr. Camille Dizon is scheduled for 2026-10-13 at 10:30.', 1, '2026-10-12 16:44:37'),
(54, 'doctor', 17, 'Patient Cancelled', 'Juan Dela Cruz (REF-6222FAE6) cancelled 2026-10-13 10:30. The slot is now free.', 1, '2026-10-12 16:50:07'),
(55, 'coordinator', NULL, 'Patient Cancelled', 'Juan Dela Cruz (REF-6222FAE6) cancelled 2026-10-13 10:30. The slot is now free.', 1, '2026-10-12 16:50:07'),
(56, 'doctor', 5, 'New Guest Appointment Request', 'Pedro Reyes - 2026-10-26 09:00 (REF-E3BEE930). Please review.', 0, '2026-10-12 17:03:58'),
(57, 'coordinator', NULL, 'New Guest Reservation', 'Pedro Reyes - 2026-10-26 09:00 (REF-E3BEE930). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-12 17:03:58'),
(58, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-E3BEE930. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-12 17:05:00'),
(59, 'doctor', 5, 'New Guest Appointment Request', 'Victória Gaios - 2026-10-13 13:30 (REF-BFBB5154). Please review.', 0, '2026-10-12 17:18:51'),
(60, 'coordinator', NULL, 'New Guest Reservation', 'Victória Gaios - 2026-10-13 13:30 (REF-BFBB5154). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-12 17:18:51'),
(61, 'coordinator', NULL, 'Shared Contact Number', 'Victória Gaios used a mobile number that also appears on another patient record. Please verify the patient details during confirmation/check-in.', 1, '2026-10-12 17:18:51'),
(62, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-BFBB5154. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-12 17:20:04'),
(63, 'doctor', 7, 'New Guest Appointment Request', 'Clopas Oscar - 2026-11-09 14:30 (REF-1890254A). Please review.', 1, '2026-10-12 17:29:12'),
(64, 'coordinator', NULL, 'New Guest Reservation', 'Clopas Oscar - 2026-11-09 14:30 (REF-1890254A). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-12 17:29:12'),
(65, 'coordinator', NULL, 'Shared Contact Number', 'Clopas Oscar used a mobile number that also appears on another patient record. Please verify the patient details during confirmation/check-in.', 1, '2026-10-12 17:29:12'),
(66, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-1890254A. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-12 17:29:26'),
(67, 'doctor', 7, 'Patient Has Arrived', 'Clopas Oscar (REF-1890254A) has been checked in and is ready for consultation.', 1, '2026-10-12 17:35:06'),
(68, 'coordinator', NULL, 'Consultation Completed', 'The consultation for REF-1890254A has been completed. Follow-up advice may now be recorded.', 1, '2026-10-12 17:36:14'),
(69, 'coordinator', NULL, 'Follow-up Advice', 'The doctor added follow-up advice for REF-1890254A. Please arrange the follow-up schedule if needed.', 1, '2026-10-12 17:36:26'),
(70, 'doctor', 7, 'New Guest Appointment Request', 'Clopas Oscar - 2026-11-06 11:00 (REF-EB56B479). Please review.', 1, '2026-10-12 17:46:43'),
(71, 'coordinator', NULL, 'New Guest Reservation', 'Clopas Oscar - 2026-11-06 11:00 (REF-EB56B479). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-12 17:46:43'),
(72, 'coordinator', NULL, 'Shared Contact Number', 'Clopas Oscar used a mobile number that also appears on another patient record. Please verify the patient details during confirmation/check-in.', 1, '2026-10-12 17:46:43'),
(73, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-EB56B479. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-12 17:47:12'),
(74, 'doctor', 7, 'Guest Appointment Cancelled', 'Guest appointment REF-EB56B479 cancelled for 2026-11-06 11:00. The slot is now free.', 1, '2026-10-12 17:49:54'),
(75, 'coordinator', NULL, 'Guest Appointment Cancelled', 'Guest appointment REF-EB56B479 cancelled for 2026-11-06 11:00. The slot is now free.', 1, '2026-10-12 17:49:54'),
(76, 'doctor', 12, 'New Appointment Request', 'Juan Dela Cruz - 2026-10-16 09:30 (REF-82D17ED5). Please review and accept or decline.', 1, '2026-10-13 03:17:00'),
(77, 'coordinator', NULL, 'New Reservation', 'Juan Dela Cruz - 2026-10-16 09:30:00 (REF-82D17ED5). The assigned doctor can review it now.', 1, '2026-10-13 03:17:00'),
(78, 'patient', 1, 'Reservation Received', 'REF-82D17ED5 received. Awaiting confirmation.', 1, '2026-10-13 03:17:00'),
(79, 'coordinator', NULL, 'Leave Request', 'A doctor submitted a leave request for 2026-10-14 to 2026-10-16. Reason: Planned leave', 1, '2026-10-13 09:59:19'),
(80, 'doctor', 7, 'Leave Approved', 'Your leave (2026-10-14 to 2026-10-16) has been approved.', 0, '2026-10-13 09:59:43'),
(81, 'doctor', 8, 'Guest Appointment Cancelled', 'Guest appointment REF-6DF0BDB6 cancelled for 2026-10-12 09:00. The slot is now free.', 0, '2026-10-13 14:31:30'),
(82, 'coordinator', NULL, 'Guest Appointment Cancelled', 'Guest appointment REF-6DF0BDB6 cancelled for 2026-10-12 09:00. The slot is now free.', 1, '2026-10-13 14:31:30'),
(83, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-82D17ED5. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-13 14:33:31'),
(84, 'patient', 1, 'Appointment Booked', 'Your appointment REF-82D17ED5 is confirmed for 2026-10-16 at 09:30.', 0, '2026-10-13 14:33:31'),
(85, 'doctor', 31, 'New Guest Appointment Request', 'Andres Bonifacio - 2026-11-07 14:30 (REF-7B121605). Please review.', 0, '2026-10-13 14:36:22'),
(86, 'coordinator', NULL, 'New Guest Reservation', 'Andres Bonifacio - 2026-11-07 14:30 (REF-7B121605). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-13 14:36:22'),
(87, 'coordinator', NULL, 'Shared Contact Number', 'Andres Bonifacio used a mobile number that also appears on another patient record. Please verify the patient details during confirmation/check-in.', 1, '2026-10-13 14:36:22'),
(88, 'doctor', 31, 'Guest Appointment Cancelled', 'Guest appointment REF-7B121605 cancelled for 2026-11-07 14:30. The slot is now free.', 0, '2026-10-13 14:38:33'),
(89, 'coordinator', NULL, 'Guest Appointment Cancelled', 'Guest appointment REF-7B121605 cancelled for 2026-11-07 14:30. The slot is now free.', 1, '2026-10-13 14:38:33'),
(90, 'doctor', 8, 'New Guest Appointment Request', 'Andres Bonifacio - 2026-10-27 14:00 (REF-53E77F2F). Please review.', 0, '2026-10-13 14:39:51'),
(91, 'coordinator', NULL, 'New Guest Reservation', 'Andres Bonifacio - 2026-10-27 14:00 (REF-53E77F2F). Email OTP is enabled when an email is provided; SMS is not active.', 1, '2026-10-13 14:39:51'),
(92, 'coordinator', NULL, 'Shared Contact Number', 'Andres Bonifacio used a mobile number that also appears on another patient record. Please verify the patient details during confirmation/check-in.', 1, '2026-10-13 14:39:51'),
(93, 'coordinator', NULL, 'Doctor Accepted Appointment', 'The doctor confirmed REF-53E77F2F. The appointment is now booked; no coordinator relay is required.', 1, '2026-10-13 14:40:22'),
(94, 'doctor', 8, 'Patient Has Arrived', 'Andres Bonifacio (REF-53E77F2F) has been checked in and is ready for consultation.', 0, '2026-10-13 14:41:05'),
(95, 'coordinator', NULL, 'Consultation Completed', 'The consultation for REF-53E77F2F has been completed. Follow-up advice may now be recorded.', 1, '2026-10-13 14:41:30'),
(96, 'coordinator', NULL, 'Follow-up Advice', 'The doctor added follow-up advice for REF-53E77F2F. Please arrange the follow-up schedule if needed.', 1, '2026-10-13 14:41:39'),
(97, 'doctor', 20, 'Your Schedule Changed', 'New workdays and working hours: Mon,Wed,Fri.', 0, '2026-10-13 14:51:35'),
(98, 'coordinator', NULL, 'Doctor Schedule Changed', 'Updated workdays and working hours: Mon,Wed,Fri. 0 appointment(s) need to be reassigned.', 1, '2026-10-13 14:51:35'),
(99, 'doctor', 8, 'New Appointment Request', 'Andres Bonifacio - 2026-10-19 09:30 (REF-408484E7). Please review and accept or decline.', 0, '2026-10-13 14:53:19'),
(100, 'coordinator', NULL, 'New Reservation', 'Andres Bonifacio - 2026-10-19 09:30:00 (REF-408484E7). The assigned doctor can review it now.', 1, '2026-10-13 14:53:19'),
(101, 'patient', 33, 'Reservation Received', 'REF-408484E7 received. Awaiting confirmation.', 0, '2026-10-13 14:53:19'),
(102, 'coordinator', NULL, 'Doctor Declined Appointment', 'The doctor declined REF-408484E7. Reassignment is required.', 1, '2026-10-13 14:53:48');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_codes`
--

CREATE TABLE `password_reset_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(14, 'Endocrinology', 'Hormonal, thyroid, and metabolic care'),
(15, 'Dentistry', 'Dental and oral health'),
(16, 'Psychiatry', 'Mental health assessment and care'),
(17, 'Urology', 'Urinary tract and male reproductive health'),
(18, 'Nephrology', 'Kidney care and related conditions'),
(19, 'General Surgery', 'Surgical evaluation and general surgery'),
(20, 'Physical Medicine and Rehabilitation', 'Rehabilitation and recovery of movement'),
(21, 'Rheumatology', 'Arthritis and autoimmune joint conditions'),
(22, 'Hematology', 'Blood disorders and blood health'),
(23, 'Oncology', 'Cancer assessment and coordinated treatment'),
(24, 'Infectious Diseases', 'Infections and infectious disease consultations'),
(25, 'Allergy and Immunology', 'Allergies and immune conditions'),
(26, 'Geriatrics', 'Medical care for older adults');

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
  `contact_number` varchar(20) DEFAULT NULL,
  `email_address` varchar(150) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `doctor_id`, `contact_number`, `email_address`, `email_verified`) VALUES
(1, 'patient1', '$2y$10$y.l8qGdqi1lSfHpeF8s1n.woyq./.QmJCcvBs/vFZl5/783ISDzDG', 'Juan Dela Cruz', 'patient', NULL, '09123456789', NULL, 0),
(2, 'coordinator1', '$2y$10$2O0N6XVhm/cDN7FmsdobZO8EbszGQ.B6SuZbjNLCUf/gECfk9rZKO', 'Nurse Liza Ramos', 'coordinator', NULL, NULL, NULL, 0),
(3, 'dr_santos', '$2y$10$ohyv/NB5jMPPNKFKd.NTwOp0flI2FlTijhYXIxF.XNaS/ytCxa0PS', 'Dr. Maria Santos', 'doctor', 1, NULL, NULL, 0),
(4, 'dr_reyes', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Jose Reyes', 'doctor', 2, NULL, NULL, 0),
(5, 'dr_cruz', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Ana Cruz', 'doctor', 3, NULL, NULL, 0),
(6, 'dr_garcia', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Luis Garcia', 'doctor', 4, NULL, NULL, 0),
(7, 'dr_mendoza', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Carla Mendoza', 'doctor', 5, NULL, NULL, 0),
(8, 'dr_lim', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Nina Lim', 'doctor', 6, NULL, NULL, 0),
(9, 'dr_torres', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Rafael Torres', 'doctor', 7, NULL, NULL, 0),
(10, 'dr_villanueva', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Sofia Villanueva', 'doctor', 8, NULL, NULL, 0),
(11, 'dr_ramos', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Angela Ramos', 'doctor', 9, NULL, NULL, 0),
(12, 'dr_bautista', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Marco Bautista', 'doctor', 10, NULL, NULL, 0),
(13, 'dr_navarro', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Elena Navarro', 'doctor', 11, NULL, NULL, 0),
(14, 'dr_aquino', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Paolo Aquino', 'doctor', 12, NULL, NULL, 0),
(15, 'dr_castillo', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Bea Castillo', 'doctor', 13, NULL, NULL, 0),
(16, 'dr_flores', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Miguel Flores', 'doctor', 14, NULL, NULL, 0),
(17, 'dr_dizon', '$2y$10$z.ny6hQ01bXFHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Camille Dizon', 'doctor', 15, NULL, NULL, 0),
(20, 'dr_mercado', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Andrea Mercado', 'doctor', 16, NULL, NULL, 0),
(21, 'dr_valdez', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Daniel Valdez', 'doctor', 17, NULL, NULL, 0),
(22, 'dr_salazar', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Victor Salazar', 'doctor', 18, NULL, NULL, 0),
(23, 'dr_tan', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Isabel Tan', 'doctor', 19, NULL, NULL, 0),
(24, 'dr_rivera', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Benjamin Rivera', 'doctor', 20, NULL, NULL, 0),
(25, 'dr_sy', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Patricia Sy', 'doctor', 21, NULL, NULL, 0),
(26, 'dr_chua', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Gabriela Chua', 'doctor', 22, NULL, NULL, 0),
(27, 'dr_ong', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Nathan Ong', 'doctor', 23, NULL, NULL, 0),
(28, 'dr_yu', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Teresa Yu', 'doctor', 24, NULL, NULL, 0),
(29, 'dr_fernandez', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Carlo Fernandez', 'doctor', 25, NULL, NULL, 0),
(30, 'dr_go', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Hannah Go', 'doctor', 26, NULL, NULL, 0),
(31, 'dr_emilio_ramos', '$2y$12$yjq30W2rgfskV8hP2XGtA.pq3bQlyghkfOp7W2JnCUNym24Vk.ULK', 'Dr. Emilio Ramos', 'doctor', 27, NULL, NULL, 0),
(32, 'jaymarkalmojuela0', '$2y$10$GzhT92RPNs3WoDOaaO0Jm.VUcBsvN3C6K6dp8tAWH9yl4KpKnkVg6', 'Jay Almojuela', 'patient', NULL, '09481340800', 'almojuelajaymark0@gmail.com', 1),
(33, 'andresboni01', '$2y$10$fceffKd4fvuG6tKXPgM9P.JJHiy63KT76PTxTzxzALZoMJRJ.qJiu', 'Andres Bonifacio', 'patient', NULL, '09481340800', 'exosen075@gmail.com', 1),
(34, 'dr_estuita', '$2y$10$Cz.hrAdwfZ/hG1Gjs3Po0.FlzgH.2qDCUgxNfpdsazVAEvWIJpuq.', 'Dr. Mark Estuita', 'doctor', 28, NULL, NULL, 0),
(35, 'dr_adrian_villareal', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Adrian Villareal', 'doctor', 29, NULL, NULL, 0),
(36, 'dr_sofia_mercado', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Sofia Mercado', 'doctor', 30, NULL, NULL, 0),
(37, 'dr_gabriel_santos', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Gabriel Santos', 'doctor', 31, NULL, NULL, 0),
(38, 'dr_lucia_navarro', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Lucia Navarro', 'doctor', 32, NULL, NULL, 0),
(39, 'dr_miguel_tan', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Miguel Tan', 'doctor', 33, NULL, NULL, 0),
(40, 'dr_irene_valdez', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Irene Valdez', 'doctor', 34, NULL, NULL, 0),
(41, 'dr_paulo_garcia', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Paulo Garcia', 'doctor', 35, NULL, NULL, 0),
(42, 'dr_teresa_mendoza', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Teresa Mendoza', 'doctor', 36, NULL, NULL, 0),
(43, 'dr_rafael_lim', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Rafael Lim', 'doctor', 37, NULL, NULL, 0),
(44, 'dr_clara_reyes', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Clara Reyes', 'doctor', 38, NULL, NULL, 0),
(45, 'dr_nicolas_bautista', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Nicolas Bautista', 'doctor', 39, NULL, NULL, 0),
(46, 'dr_andrea_castillo', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Andrea Castillo', 'doctor', 40, NULL, NULL, 0),
(47, 'dr_javier_flores', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Javier Flores', 'doctor', 41, NULL, NULL, 0),
(48, 'dr_bianca_aquino', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Bianca Aquino', 'doctor', 42, NULL, NULL, 0),
(49, 'dr_marco_santiago', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Marco Santiago', 'doctor', 43, NULL, NULL, 0),
(50, 'dr_elena_cruz', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Elena Cruz', 'doctor', 44, NULL, NULL, 0),
(51, 'dr_andres_dela_cruz', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Andres Dela Cruz', 'doctor', 45, NULL, NULL, 0),
(52, 'dr_camille_ortega', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Camille Ortega', 'doctor', 46, NULL, NULL, 0),
(53, 'dr_luis_domingo', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Luis Domingo', 'doctor', 47, NULL, NULL, 0),
(54, 'dr_nina_salazar', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Nina Salazar', 'doctor', 48, NULL, NULL, 0),
(55, 'dr_tomas_villanueva', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Tomas Villanueva', 'doctor', 49, NULL, NULL, 0),
(56, 'dr_amara_chua', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Amara Chua', 'doctor', 50, NULL, NULL, 0),
(57, 'dr_paolo_fernandez', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Paolo Fernandez', 'doctor', 51, NULL, NULL, 0),
(58, 'dr_beatriz_gomez', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Beatriz Gomez', 'doctor', 52, NULL, NULL, 0),
(59, 'dr_samuel_ramos', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Samuel Ramos', 'doctor', 53, NULL, NULL, 0),
(60, 'dr_olivia_tan', '$2y$10$z.ny6hQ01lSfHx.tDf.1p.lBUudaSDaTd.8mHBByYos0eYOlDtJQe', 'Dr. Olivia Tan', 'doctor', 54, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_authenticators`
--

CREATE TABLE `user_authenticators` (
  `user_id` int(11) NOT NULL,
  `secret_ciphertext` varchar(512) NOT NULL,
  `recovery_codes` text DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Indexes for table `appointment_waitlist`
--
ALTER TABLE `appointment_waitlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_waitlist_offer_token` (`offer_token`),
  ADD KEY `idx_waitlist_slot` (`doctor_id`,`appointment_date`,`appointment_time`,`status`,`created_at`),
  ADD KEY `idx_waitlist_patient` (`patient_id`,`status`),
  ADD KEY `fk_waitlist_specialty` (`specialty_id`);

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
-- Indexes for table `doctor_schedule_requests`
--
ALTER TABLE `doctor_schedule_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_schedule_request_status` (`status`,`created_at`),
  ADD KEY `fk_schedule_request_doctor` (`doctor_id`),
  ADD KEY `fk_schedule_request_reviewer` (`reviewed_by_user_id`);

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
-- Indexes for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reset_user` (`user_id`);

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
-- Indexes for table `user_authenticators`
--
ALTER TABLE `user_authenticators`
  ADD PRIMARY KEY (`user_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `appointment_reschedule_history`
--
ALTER TABLE `appointment_reschedule_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment_waitlist`
--
ALTER TABLE `appointment_waitlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `doctor_blockouts`
--
ALTER TABLE `doctor_blockouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `doctor_schedule_requests`
--
ALTER TABLE `doctor_schedule_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guest_otp_verifications`
--
ALTER TABLE `guest_otp_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `specialties`
--
ALTER TABLE `specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

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
-- Constraints for table `appointment_waitlist`
--
ALTER TABLE `appointment_waitlist`
  ADD CONSTRAINT `fk_waitlist_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_waitlist_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_waitlist_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `doctor_schedule_requests`
--
ALTER TABLE `doctor_schedule_requests`
  ADD CONSTRAINT `fk_schedule_request_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_schedule_request_reviewer` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  ADD CONSTRAINT `password_reset_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`);

--
-- Constraints for table `user_authenticators`
--
ALTER TABLE `user_authenticators`
  ADD CONSTRAINT `fk_user_authenticators_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
