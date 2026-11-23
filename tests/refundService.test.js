const { calculateRefund } = require('../src/services/refundService');

const HOUR_MS = 60 * 60 * 1000;
const NOW = new Date(2026, 11, 1, 10, 0, 0);
const AMOUNT_PAID = 100;

const appointmentAfterHours = (hours) => new Date(NOW.getTime() + hours * HOUR_MS);

describe('calculateRefund', () => {
  test('gives a full refund with more than 48 hours notice', () => {
    const result = calculateRefund(appointmentAfterHours(48.5), AMOUNT_PAID, NOW);
    expect(result).toEqual({ percent: 100, amount: 100 });
  });

  test('gives 50% at exactly 48 hours notice (boundary belongs to the middle tier)', () => {
    const result = calculateRefund(appointmentAfterHours(48), AMOUNT_PAID, NOW);
    expect(result).toEqual({ percent: 50, amount: 50 });
  });

  test('gives 50% between 24 and 48 hours notice', () => {
    const result = calculateRefund(appointmentAfterHours(36), AMOUNT_PAID, NOW);
    expect(result).toEqual({ percent: 50, amount: 50 });
  });

  test('gives 50% at exactly 24 hours notice (boundary belongs to the middle tier)', () => {
    const result = calculateRefund(appointmentAfterHours(24), AMOUNT_PAID, NOW);
    expect(result).toEqual({ percent: 50, amount: 50 });
  });

  test('gives no refund with less than 24 hours notice', () => {
    const result = calculateRefund(appointmentAfterHours(23.9), AMOUNT_PAID, NOW);
    expect(result).toEqual({ percent: 0, amount: 0 });
  });

  test('computes the refund amount from the amount actually paid', () => {
    const result = calculateRefund(appointmentAfterHours(36), '120.50', NOW);
    expect(result).toEqual({ percent: 50, amount: 60.25 });
  });
});