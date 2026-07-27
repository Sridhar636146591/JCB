/**
 * Formats a numeric input string dynamically with commas according to the Indian Number System.
 * Example: "100000" -> "1,00,000"
 */
export const formatIndianNumberString = (val: string): string => {
  // Strip non-digits and non-decimals (keep only digits and single dot)
  let clean = val.replace(/[^0-9.]/g, '');
  
  // Handle case where multiple dots are entered (only keep the first dot)
  const dotIndex = clean.indexOf('.');
  if (dotIndex !== -1) {
    clean = clean.slice(0, dotIndex + 1) + clean.slice(dotIndex + 1).replace(/\./g, '');
  }

  if (clean === '') return '';
  
  const hasTrailingDot = clean.endsWith('.');
  const parts = clean.split('.');
  const intPartStr = parts[0];
  
  const intPart = parseInt(intPartStr, 10);
  if (isNaN(intPart)) {
    // If it's just a dot or empty int part
    return hasTrailingDot ? '.' : '';
  }
  
  // Format integer part using Indian locale ('en-IN')
  let formatted = new Intl.NumberFormat('en-IN').format(intPart);
  
  if (parts.length > 1) {
    // Limit decimal to max 2 places
    return formatted + '.' + parts[1].slice(0, 2);
  } else if (hasTrailingDot) {
    return formatted + '.';
  }
  return formatted;
};

/**
 * Strips formatting commas and parses value as standard numeric float.
 */
export const parseIndianNumberString = (val: string): number => {
  if (!val) return 0;
  const clean = val.replace(/,/g, '');
  return parseFloat(clean) || 0;
};
