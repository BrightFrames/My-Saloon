/**
 * Validation utilities for backend to ensure data integrity
 */

export function validateFullName(name: string): { valid: boolean; message?: string } {
  if (!name || !name.trim()) {
    return { valid: false, message: "Full Name is required." };
  }
  const alphabeticRegex = /^[A-Za-z\s]+$/;
  if (!alphabeticRegex.test(name.trim())) {
    return { valid: false, message: "Full Name cannot contain numbers or special characters." };
  }
  return { valid: true };
}

export function validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, message: "Phone Number is required." };
  }
  const cleanPhone = phone.trim();
  if (/[^\d]/.test(cleanPhone)) {
    return { valid: false, message: "Phone Number must contain only digits." };
  }
  if (cleanPhone.length !== 10) {
    return { valid: false, message: "Phone Number must be exactly 10 digits." };
  }
  return { valid: true };
}
