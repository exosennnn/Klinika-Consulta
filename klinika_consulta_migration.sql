-- Run ONCE on your existing klinika_consulta_db; backup first.
USE `klinika_consulta_db`;
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
