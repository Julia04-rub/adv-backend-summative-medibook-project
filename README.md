# MediBook: Clinic Appointment Booking Backend

A backend for a community clinic to book doctor appointments, built with **Node.js, Express, MySQL and Redis**. It enforces real booking rules (working hours, daily cap, no double booking even under concurrent requests), handles cancellations with server-calculated refunds, promotes waitlisted patients through a separate worker process, and provides SQL reports, an audit log and a bilingual feedback page.

## Video walkthrough: <https://youtu.be/yXlwboks6Lw>

## Contents
1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Setup](#setup)
4. [Running the project](#running-the-project)
5. [Project structure](#project-structure)
6. [Database design](#database-design)
7. [API reference](#api-reference)
8. [Design justifications](#design-justifications)
9. [Testing](#testing)
10. [Postman collection](#postman-collection)

## Features
| Assessment part | What is implemented |
|---|---|
| A, B Database | 3-table schema in 3NF with constraints, `schema.sql`, `seed.sql`, diagram |
| C.1 CRUD | Patients and doctors: create, read one/all, update, delete, validated |
| C.2 Booking | Future-only, 09:00-17:00, 30-minute boundary, max 12 per doctor per day, no shared slot under simultaneous requests |
| C.3 Cancellation | Server-side refund tiers, atomic cancellation and refund, cancelled slot rebookable, record kept |
| C.4-C.6 Statistics | Doctor stats, doctors report, busy-days report, all computed in SQL |
| D Audit log | Async JSON-lines log in `logs/audit.log` |
| E Redis queues | Waitlist, separate worker, safe promotion, confirmation jobs |
| F Tests | 23 Jest tests, no live services needed |
| G i18n | `/feedback` page in English and French |

## Tech stack
Node.js 20+, Express 5, MySQL 8 (`mysql2`, parameterized queries only, no ORM), Redis 7 with BullMQ, Jest.

## Setup

### 1. Start MySQL and Redis
The easiest way is Docker:
```bash
docker run -d --name medibook-mysql -e MYSQL_ROOT_PASSWORD=<choose-a-password> -p 3307:3306 mysql:8
docker run -d --name medibook-redis -p 6379:6379 redis:7
```
Using your own MySQL and Redis instead is fine; just match the values in `.env`.

### 2. Install
```bash
git clone https://github.com/Julia04-rub/adv-backend-summative-medibook-project.git
cd adv-backend-summative-medibook-project
npm install
```

### 3. Configure environment
Copy `.env.example` to `.env` (Windows: `copy .env.example .env`) and fill in the password.

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | API port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3307` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | your password |
| `DB_NAME` | Database name | `medibook` |
| `REDIS_HOST` | Redis host | `127.0.0.1` |
| `REDIS_PORT` | Redis port | `6379` |
| `AUDIT_LOG_PATH` | Optional log path override | leave empty |

### 4. Create the database and load sample data
Linux/macOS/Git Bash:
```bash
docker exec -i medibook-mysql mysql -uroot -p<password> < database/schema.sql
docker exec -i medibook-mysql mysql -uroot -p<password> < database/seed.sql
```
Windows PowerShell:
```powershell
Get-Content database/schema.sql | docker exec -i medibook-mysql mysql -uroot -p<password>
Get-Content database/seed.sql | docker exec -i medibook-mysql mysql -uroot -p<password>
```
With a local MySQL client you can run `mysql -u root -p < database/schema.sql` instead. The scripts create the `medibook` database.

**Seed data:** 4 patients, 3 doctors (Dr. Owusu has no appointments), and 14 appointments, including Dr. Boateng's 11 of 12 slots on 2026-12-10 (one booking away from the daily cap) and one cancelled appointment with a refund.

## Running the project
```bash
npm start          # API on http://localhost:3000
npm run worker     # in a second terminal: waitlist and confirmation worker
npm test           # unit tests (no MySQL or Redis needed)
npm run dev        # API with auto-restart for development
```
The worker is a **separate process** and must be running for waitlist promotion and confirmation jobs to be processed.

## Project structure
```
database/        schema.sql, seed.sql
docs/            schema-diagram.png, Medibook.postman_collection.json
locales/         en.json, fr.json
logs/            audit.log (created automatically on first write)
src/
  config/        environment config, MySQL pool, Redis connection
  models/        all SQL, parameterized with mysql2
  controllers/   request validation and responses
  services/      business rules: booking, cancellation, refunds, waitlist, jobs, locale
  routes/        URL and HTTP method mapping
  workers/       waitlist worker (separate process)
  middleware/    central error handling
  utils/         dates, validators, audit logger, transactions
  views/         feedback page renderer
tests/           Jest unit tests
```

## Database design

| Table | Key columns | Constraints |
|---|---|---|
| `patients` | `id`, `name`, `email`, `phone` | `email` UNIQUE, all NOT NULL |
| `doctors` | `id`, `name`, `specialty`, `consultation_fee`, `room` | `consultation_fee` DECIMAL(10,2) with CHECK >= 0 |
| `appointments` | `id`, `patient_id`, `doctor_id`, `appt_datetime`, `amount_paid`, `booked_on`, `status`, `cancelled_at`, `refund_percent`, `refund_amount`, `active_slot` | foreign keys (ON DELETE RESTRICT), CHECK on `amount_paid` and `refund_percent` (0, 50, 100), UNIQUE `(doctor_id, active_slot)` |

Relationships: one patient has many appointments, and one doctor has many appointments. `amount_paid` is stored per appointment because it can differ from the doctor's current fee.

## API reference

Base URL: `http://localhost:3000`

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/api/patients` | List patients | 200 |
| POST | `/api/patients` | Create patient | 201 |
| GET | `/api/patients/:id` | Get one patient | 200 |
| PUT | `/api/patients/:id` | Update patient | 200 |
| DELETE | `/api/patients/:id` | Delete patient | 204 |
| GET, POST | `/api/doctors` | List, create doctors | 200, 201 |
| GET, PUT, DELETE | `/api/doctors/:id` | Read, update, delete a doctor | 200, 200, 204 |
| GET | `/api/doctors/:id/stats` | Revenue, upcoming count, 7-day load, utilization | 200 |
| POST | `/api/appointments` | Book an appointment | 201 |
| GET | `/api/appointments/:id` | Get an appointment | 200 |
| DELETE | `/api/appointments/:id` | Cancel (soft delete) with refund | 200 |
| POST | `/api/waitlist` | Join the waitlist for a taken slot or full day | 201 |
| GET | `/api/waitlist?doctor_id=&date=YYYY-MM-DD` | View a waitlist | 200 |
| GET | `/api/reports/doctors` | Every doctor's appointments and revenue | 200 |
| GET | `/api/reports/busy-days` | Doctor-days above 80% of the daily cap | 200 |
| GET, POST | `/feedback?lang=en\|fr` | Feedback page and submission | 200 |


### Status codes
| Code | Used for |
|---|---|
| 200, 201, 204 | Success (read/update/cancel, create, delete) |
| 400 | Malformed input, invalid ids or dates, with a message for each problem |
| 404 | Unknown patient, doctor or appointment |
| 409 | Conflicts with existing data: `SLOT_TAKEN`, `DAY_FULL`, `ALREADY_CANCELLED`, `ALREADY_WAITLISTED`, `SLOT_AVAILABLE`, duplicate email, deleting a record that has appointments |
| 422 | A business rule is broken: past time, outside 09:00-17:00, off the 30-minute boundary, cancelling a past appointment |

## Design justifications

### Part C: booking and cancellation
- **Concurrency:** booking runs in a transaction that locks the doctor's row with `SELECT ... FOR UPDATE`, so the 12-per-day count is always accurate. The unique key on `(doctor_id, active_slot)` is the final guarantee that two patients can never share a slot, even if requests arrive at the same instant.
- **Rebookable cancelled slots:** `active_slot` is a generated column that equals the appointment time while the booking is active and is NULL once cancelled. MySQL allows many NULLs in a unique index, so a cancelled slot is free again while the cancelled row stays for refund history.
- **Refund policy (calculated by the server, never trusted from the client):**
  - More than 48 hours' notice: 100%
  - From 24 hours up to and including 48 hours: 50%
  - Less than 24 hours: 0%
  - Exactly 48 hours and exactly 24 hours both fall in the 50% tier.
- **Atomic cancellation:** the project is limited to three tables, so the refund is stored on the appointment row. Marking it cancelled and recording the refund is one `UPDATE` inside a transaction, so both succeed or both fail. Cancelling an appointment already cancelled returns 409.
- **Revenue:** `amount_paid` for booked appointments, and `amount_paid - refund_amount` for cancelled ones.
- **Busy day:** more than 80% of the 12-slot cap (10 or more bookings), calculated in SQL. The 7-day view uses a recursive CTE so days with no bookings still appear.
- **Status codes:** 409 means a conflict with existing data; 422 means the request itself breaks a business rule.

### Part D: audit log
Every successful booking and cancellation is appended as one JSON line to `logs/audit.log` using `fs/promises`, with no `*Sync` calls anywhere. The `logs/` directory is created on first write. The logger catches its own errors, so a logging failure never fails the user's request. Logging happens after the database transaction commits, so work that rolled back is never logged. Waitlist promotions and confirmation messages are logged to the same file.

### Part E: queues and Redis
- **Waitlist:** a Redis list per doctor per day. A full slot or day returns a 409 that points the patient to `POST /api/waitlist`.
- **Promotion:** a cancellation enqueues a BullMQ job. A separate worker process moves the first waiting patient to a `processing` list with `LMOVE`, books them through the same booking service, and only then removes them from `processing`.
- **Failed promotion:** if the booking fails (for example the slot was taken again), the patient is put back at the front of the queue. A permanent error such as a deleted patient moves the entry to a `waitlist:failed` list. If the worker crashes mid-job, entries left in `processing` are restored when the worker starts. A patient is never lost from both the queue and the appointments table.
- **Confirmation jobs:** every booking, including promoted ones, enqueues a confirmation job; the worker writes the message to the audit log. If enqueuing fails, it is logged and the request still succeeds.

<<<<<<< HEAD
### Part G: internationalization
All page text comes from `locales/en.json` and `locales/fr.json`. `GET /feedback?lang=fr` shows French; an unsupported or missing language falls back to English. The date is formatted with `Intl.DateTimeFormat` for the active language, and all text is HTML-escaped before it is rendered.

## Testing
```bash
npm test
```
23 tests across two suites, with fixed dates and no database or Redis required:
- **Refund calculator:** all three tiers, both exact boundaries (24h and 48h), and the amount computed from `amount_paid`.
- **Validation:** slot rules (17:00, 16:30, 09:15, before opening, past time), date parsing (malformed and impossible dates such as 2026-02-30), booking input, and patient input.

## Postman collection
Import `docs/Medibook.postman_collection.json` into Postman to run every request used in the demo: CRUD, booking rules, cancellations, waitlist, stats and reports.
=======
### Part G: i18n
Page text comes from `locales/en.json` and `locales/fr.json`. `?lang=` falls back to English for anything unsupported. The date uses `Intl.DateTimeFormat` with the active language.

Video Walkthrough Link: https://youtu.be/yXlwboks6Lw
>>>>>>> 8fbd1d35f0be3952031fb60eece0816ab9530721
