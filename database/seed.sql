USE medibook;

INSERT INTO patients (name, email, phone) VALUES
('Ama Mensah', 'ama@mail.com', '0244-111-222'),
('Kojo Owusu', 'kojo@mail.com', '0555-333-444'),
('Efua Asante', 'efua@mail.com', '0200-555-666'),
('Kwame Darko', 'kwame@mail.com', '0277-777-888');

INSERT INTO doctors (name, specialty, consultation_fee, room) VALUES
('Dr. Boateng', 'Dermatology', 150.00, 'R-12'),
('Dr. Adjei', 'Paediatrics', 100.00, 'R-03'),
('Dr. Owusu', 'Cardiology', 120.00, 'R-07');

-- Dr. Boateng: 11 of 12 slots on 2026-12-10 (near the daily cap)
INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid) VALUES
(1, 1, '2026-12-10 09:00:00', 150.00),
(2, 1, '2026-12-10 09:30:00', 150.00),
(3, 1, '2026-12-10 10:00:00', 150.00),
(4, 1, '2026-12-10 10:30:00', 150.00),
(1, 1, '2026-12-10 11:00:00', 150.00),
(2, 1, '2026-12-10 11:30:00', 150.00),
(3, 1, '2026-12-10 12:00:00', 150.00),
(4, 1, '2026-12-10 12:30:00', 150.00),
(1, 1, '2026-12-10 13:00:00', 150.00),
(2, 1, '2026-12-10 13:30:00', 150.00),
(3, 1, '2026-12-10 14:00:00', 150.00);

-- Dr. Adjei: two booked, one cancelled with a full refund
INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid) VALUES
(1, 2, '2026-12-11 10:00:00', 100.00),
(2, 2, '2026-12-11 10:30:00', 100.00);

INSERT INTO appointments
  (patient_id, doctor_id, appt_datetime, amount_paid, status, cancelled_at, refund_percent, refund_amount)
VALUES
(3, 2, '2026-12-12 11:00:00', 100.00, 'cancelled', '2026-11-18 10:00:00', 100, 100.00);