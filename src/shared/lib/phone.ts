const KZ_PHONE_DIGITS_LENGTH = 11;

export function formatKzPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '');
  const normalizedDigits = normalizeLeadingDigits(digits).slice(0, KZ_PHONE_DIGITS_LENGTH);
  const rest = normalizedDigits.slice(1);
  const operator = rest.slice(0, 3);
  const first = rest.slice(3, 6);
  const second = rest.slice(6, 8);
  const third = rest.slice(8, 10);

  let result = '+7';

  if (operator.length > 0) {
    result += ` (${operator}`;
  }

  if (operator.length === 3) {
    result += ')';
  }

  if (first.length > 0) {
    result += ` ${first}`;
  }

  if (second.length > 0) {
    result += `-${second}`;
  }

  if (third.length > 0) {
    result += `-${third}`;
  }

  return result;
}

export function normalizeKzPhone(value: string) {
  const digits = normalizeLeadingDigits(value.replace(/\D/g, '')).slice(0, KZ_PHONE_DIGITS_LENGTH);

  if (!isValidKzPhoneDigits(digits)) {
    return null;
  }

  return `+${digits}`;
}

export function isValidKzPhone(value: string) {
  return normalizeKzPhone(value) !== null;
}

function normalizeLeadingDigits(digits: string) {
  if (digits.length === 0) {
    return '7';
  }

  if (digits.startsWith('8')) {
    return `7${digits.slice(1)}`;
  }

  if (!digits.startsWith('7')) {
    return `7${digits}`;
  }

  return digits;
}

function isValidKzPhoneDigits(digits: string) {
  return digits.length === KZ_PHONE_DIGITS_LENGTH && digits.startsWith('77');
}
