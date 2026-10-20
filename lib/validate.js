export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Normalises an Indian mobile number to its 10 digits ("+91 98765-43210" →
// "9876543210"). Returns null if it isn't a valid Indian mobile number.
export function normalizeIndianPhone(input) {
  let digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function maskPhone(phone) {
  return phone ? `+91 ${"•".repeat(6)}${phone.slice(-4)}` : "";
}
