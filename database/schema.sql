CREATE DATABASE IF NOT EXISTS medibook;
USE medibook;

CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL
);

CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  consultation_fee DECIMAL(10,2) NOT NULL,
  room VARCHAR(10) NOT NULL,
  CONSTRAINT chk_fee CHECK (consultation_fee >= 0)
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appt_datetime DATETIME NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  booked_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('booked','cancelled') NOT NULL DEFAULT 'booked',
  cancelled_at DATETIME NULL,
  refund_percent TINYINT NULL,
  refund_amount DECIMAL(10,2) NULL,
  active_slot DATETIME GENERATED ALWAYS AS
    (IF(status = 'booked', appt_datetime, NULL)) STORED,
  CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, active_slot),
  CONSTRAINT chk_amount CHECK (amount_paid >= 0),
  CONSTRAINT chk_refund CHECK (refund_percent IS NULL OR refund_percent IN (0, 50, 100)),
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
  INDEX idx_doctor_day (doctor_id, appt_datetime)
);