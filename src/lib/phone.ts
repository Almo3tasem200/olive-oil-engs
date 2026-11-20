export function normalizeEgyptianPhone(value: string): string | null {
  let digits = value.trim().replace(/[\s()-]/g, '');

  if (digits.startsWith('0020')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('+20')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('20')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (!/^1[0125]\d{8}$/.test(digits)) {
    return null;
  }

  return '+20' + digits;
}

