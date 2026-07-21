/**
 * Validation utilities for frontend form fields
 */

/**
 * Validates Full Name field:
 * - Only alphabetic characters (A-Z, a-z) and spaces are allowed.
 * - Numeric values (0-9) and special characters are restricted.
 */
export function validateFullName(name: string): string | null {
  if (!name.trim()) {
    return "Full Name is required.";
  }
  // Allow only alphabetic characters (A-Z, a-z) and spaces
  const alphabeticRegex = /^[A-Za-z\s]+$/;
  if (!alphabeticRegex.test(name)) {
    return "Full Name cannot contain numbers or special characters.";
  }
  return null;
}

/**
 * Validates Phone Number field:
 * - Only numeric values (0-9) are allowed.
 * - Must be exactly 10 digits.
 */
export function validatePhoneNumber(phone: string): string | null {
  if (!phone.trim()) {
    return "Phone Number is required.";
  }
  // Check if non-numeric characters exist
  if (/[^\d]/.test(phone)) {
    return "Phone Number must contain only digits.";
  }
  // Check length is exactly 10 digits
  if (phone.length !== 10) {
    return "Phone Number must be exactly 10 digits.";
  }
  return null;
}
