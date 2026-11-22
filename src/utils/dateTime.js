const DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

const pad = (n) => String(n).padStart(2, '0');

function parseDateTime(value) {
  if (typeof value !== 'string') return null;
  const match = DATETIME_REGEX.exec(value.trim());
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
  const second = match[6] ? Number(match[6]) : 0;
  const date = new Date(year, month - 1, day, hour, minute, second);

  const roundTrips =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;
  return roundTrips ? date : null;
}

function toSqlDateTime(date) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getDayRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { start: toSqlDateTime(start), end: toSqlDateTime(end) };
}

module.exports = { pad, parseDateTime, toSqlDateTime, getDayRange };