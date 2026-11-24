# MediBook: Clinic Appointment Booking Backend

Express.js + MySQL + Redis backend for booking doctor appointments, with a waitlist worker, audit log, reports and a bilingual feedback page.

## Setup

**Requirements:** Node.js 20+, MySQL 8, Redis 7 (Docker is the easiest way to get both).

```bash
docker run -d --name medibook-mysql -e MYSQL_ROOT_PASSWORD=<choose-a-password> -p 3307:3306 mysql:8
docker run -d --name medibook-redis -p 6379:6379 redis:7
```

```bash
git clone https://github.com/Julia04-rub/adv-backend-summative-medibook-project.git
cd adv-backend-summative-medibook-project
npm install
cp .env.example .env        
```

Create the schema and seed data (from the project root, with the password you chose):

```bash
docker exec -i medibook-mysql mysql -uroot -p<password> < database/schema.sql
docker exec -i medibook-mysql mysql -uroot -p<password> < database/seed.sql
```
(PowerShell: `Get-Content database/schema.sql | docker exec -i medibook-mysql mysql -uroot -p<password>`.) With a local MySQL, run both files with the `mysql` client or Workbench instead.

Run:

```bash
npm start          # API on http://localhost:3000
npm run worker     # separate terminal: waitlist and confirmation worker
npm test           # unit tests, no MySQL or Redis needed
```

### Environment variables (`.env.example`)
| Variable | Purpose |
|---|---|
| PORT | API port (default 3000) |
| DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | MySQL connection |
| REDIS_HOST, REDIS_PORT | Redis connection |
| AUDIT_LOG_PATH | Optional override for `logs/audit.log` |

## Project structure
```
database/   schema.sql, seed.sql
docs/       schema-diagram.png, Postman collection
locales/    en.json, fr.json
src/
  models/       all SQL (parameterized, mysql2)
  controllers/  request handling and validation
  services/     business rules (booking, cancellation, refunds, waitlist, jobs)
  routes/       URL and method mapping
  workers/      waitlist worker (separate process)
  middleware/   central error handling
  utils/        dates, validators, audit logger, transactions
  views/        feedback page renderer
tests/      Jest unit tests
```

## API
| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/patients`, `/api/doctors` | list, create |
| GET/PUT/DELETE | `/api/patients/:id`, `/api/doctors/:id` | read, update, delete |
| GET | `/api/doctors/:id/stats` | revenue, upcoming count, 7-day load, utilization |
| POST | `/api/appointments` | book |
| GET | `/api/appointments/:id` | read |
| DELETE | `/api/appointments/:id` | cancel (soft delete) with refund |
| POST/GET | `/api/waitlist` | join / view waitlist |
| GET | `/api/reports/doctors`, `/api/reports/busy-days` | SQL reports |
| GET/POST | `/feedback?lang=en\|fr` | feedback page |

Status codes: 400 malformed input, 404 unknown id, 409 conflicts (slot taken, day full, already cancelled), 422 broken business rule (past, outside 09:00-17:00, not on a 30-minute boundary, past appointment cancel).

## Design justifications

### Part C: booking and cancellation
- **Concurrency:** booking runs in a transaction that locks the doctor row (`SELECT ... FOR UPDATE`), so the 12-per-day count is always accurate. A unique key on `(doctor_id, active_slot)` is the final guarantee against two patients sharing a slot.
- **Rebookable cancelled slots:** `active_slot` is a generated column that is NULL when an appointment is cancelled. MySQL allows many NULLs in a unique index, so the slot is free again and the cancelled row stays for refund history.
- **Refund policy (computed server-side):** more than 48 hours notice = 100%; from 24 hours up to and including 48 hours = 50%; less than 24 hours = 0%. Exactly 48h and exactly 24h both give 50%. Refund fields are stored on the appointment row (the brief allows only 3 tables), and the status change and refund are one `UPDATE` inside a transaction, so they succeed or fail together.
- **Revenue definition:** `amount_paid` for booked appointments, `amount_paid - refund_amount` for cancelled ones.
- **Busy day:** more than 80% of the 12-slot cap, calculated in SQL.

### Part D: audit log
Every successful booking and cancellation is appended as a JSON line to `logs/audit.log` with `fs/promises` (no `*Sync` calls). The directory is created on first write. The logger catches its own errors, so a logging failure never fails a request. Logging happens after the transaction commits, so rolled-back work is never logged.

### Part E: queues and Redis
- **Waitlist:** a Redis list per doctor per day. A patient is offered a spot via the 409 responses (`SLOT_TAKEN`, `DAY_FULL`) and joins with `POST /api/waitlist`.
- **Promotion:** a cancellation enqueues a BullMQ job. The separate worker process (`npm run worker`) moves the first waiting patient to a `processing` list (`LMOVE`), books them through the same booking service, and only then removes them from `processing`.
- **Failed promotion:** if booking fails, the patient is pushed back to the front of the queue (or to `waitlist:failed` for a permanent error such as a deleted patient). If the worker crashes mid-job, leftover `processing` entries are restored at the next worker start. A patient is never lost from both the queue and the appointments table.
- **Confirmation jobs:** every booking, including promoted ones, enqueues a confirmation job; the worker writes the message to the audit log. Failures to enqueue are logged and never fail the request.

### Part G: i18n
Page text comes from `locales/en.json` and `locales/fr.json`. `?lang=` falls back to English for anything unsupported. The date uses `Intl.DateTimeFormat` with the active language.

Video Walkthrough Link: https://youtu.be/yXlwboks6Lw
