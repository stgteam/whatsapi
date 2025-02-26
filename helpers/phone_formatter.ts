export function removePlusSign(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Add country code if not present
  if (!digits.startsWith('62')) {
    return `62${digits.startsWith('0') ? digits.slice(1) : digits}`
  }

  return digits
}
