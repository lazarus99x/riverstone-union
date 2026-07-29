/**
 * Generate a unique account number in format: STBK-XXXX-XXXX-XX
 * where the last digit is a Luhn checksum
 */
export async function generateAccountNumber(): Promise<string> {
  // This would typically be a database function, but for now we'll generate client-side
  // In a real app, you'd call a Supabase edge function or database function
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Generate 9 random digits (we'll add the 10th as checksum)
    const randomDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
    
    // Calculate Luhn checksum
    const checksum = calculateLuhnChecksum(randomDigits);
    const accountNumber = `STBK-${randomDigits.slice(0, 4)}-${randomDigits.slice(4, 8)}-${checksum}${randomDigits.slice(8, 9)}`;
    
    // In a real app, you'd check if this account number already exists in the database
    // For now, we'll assume it's unique (in production, use DB constraint + retry)
    return accountNumber;
    
    attempts++;
  }
  
  throw new Error("Failed to generate unique account number after multiple attempts");
}

/**
 * Calculate the Luhn checksum digit for a string of digits
 */
export function calculateLuhnChecksum(digits: string): number {
  let sum = 0;
  let shouldDouble = false;
  
  // Start from the rightmost digit and move left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  // The checksum is the amount needed to reach the next multiple of 10
  const checksum = (10 - (sum % 10)) % 10;
  return checksum;
}

/**
 * Validate an account number using Luhn algorithm
 */
export function validateAccountNumber(accountNumber: string): boolean {
  // Remove formatting
  const clean = accountNumber.replace(/[^0-9]/g, "");
  
  // Check format: STBK-XXXX-XXXX-XX should be 10 digits
  if (clean.length !== 10) return false;
  
  // Check prefix (first 4 digits should be from STBK mapping, but we'll just validate format)
  if (!/^STBK-\d{4}-\d{4}-\d{2}$/.test(accountNumber)) return false;
  
  // Extract the 9 digits (without checksum) and calculate expected checksum
  const digitsWithoutChecksum = clean.slice(0, 9);
  const checksumDigit = parseInt(clean.charAt(9));
  
  const expectedChecksum = calculateLuhnChecksum(digitsWithoutChecksum);
  return checksumDigit === expectedChecksum;
}