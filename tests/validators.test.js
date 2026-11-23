const { getSlotViolations, validateBookingInput, validatePatient } = require('../src/utils/validators');
const { parseDateTime, toSqlDateTime } = require('../src/utils/dateTime');

const NOW = new Date(2026, 10, 23, 12, 0, 0);
const slotAt = (hour, minute) => new Date(2026, 11, 15, hour, minute, 0);

describe('getSlotViolations', () => {
  test('accepts a future slot on a 30-minute boundary inside working hours', () => {
    expect(getSlotViolations(slotAt(10, 0), NOW)).toEqual([]);
  });

  test('accepts the last slot of the day (16:30 ends at closing time)', () => {
    expect(getSlotViolations(slotAt(16, 30), NOW)).toEqual([]);
  });

  test('rejects 17:00 because the slot would end after closing', () => {
    expect(getSlotViolations(slotAt(17, 0), NOW)).toEqual([expect.stringContaining('working hours')]);
  });

  test('rejects a slot before opening time', () => {
    expect(getSlotViolations(slotAt(8, 30), NOW)).toEqual([expect.stringContaining('working hours')]);
  });

  test('rejects a start time that is not on a 30-minute boundary', () => {
    expect(getSlotViolations(slotAt(9, 15), NOW)).toEqual([expect.stringContaining('30-minute boundary')]);
  });

  test('rejects a slot in the past', () => {
    const past = new Date(2026, 10, 20, 10, 0, 0);
    expect(getSlotViolations(past, NOW)).toEqual([expect.stringContaining('future')]);
  });
});

describe('parseDateTime', () => {
  test('parses a valid date and round-trips to the SQL format', () => {
    const date = parseDateTime('2026-12-15 09:30');
    expect(toSqlDateTime(date)).toBe('2026-12-15 09:30:00');
  });

  test.each(['banana', '2026-02-30 10:00', '2026-12-15 24:00', '', null])(
    'returns null for malformed or impossible input: %p',
    (input) => {
      expect(parseDateTime(input)).toBeNull();
    }
  );
});

describe('validateBookingInput', () => {
  test('accepts a complete booking request', () => {
    const body = { patient_id: 1, doctor_id: 2, appt_datetime: '2026-12-15 10:00' };
    expect(validateBookingInput(body)).toEqual([]);
  });

  test('reports every missing field for an empty body', () => {
    expect(validateBookingInput({})).toHaveLength(3);
  });

  test('rejects ids that are not positive integers', () => {
    const body = { patient_id: '1', doctor_id: 0, appt_datetime: '2026-12-15 10:00' };
    expect(validateBookingInput(body)).toHaveLength(2);
  });
});

describe('validatePatient', () => {
  test('accepts a valid patient', () => {
    const body = { name: 'Ama Mensah', email: 'ama@mail.com', phone: '0244-111-222' };
    expect(validatePatient(body)).toEqual([]);
  });

  test('rejects a malformed email', () => {
    const body = { name: 'Ama', email: 'not-an-email', phone: '0244-111-222' };
    expect(validatePatient(body)).toEqual([expect.stringContaining('email')]);
  });
});