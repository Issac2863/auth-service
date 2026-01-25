export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***@***.***';

  const [user, domain] = email.split('@');
  
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }

  // Muestra los 2 primeros caracteres, los últimos y pone asteriscos en medio
  const visibleStart = user.substring(0, 2);
  const visibleEnd = user.substring(user.length - 1);
  const maskedSection = '*'.repeat(Math.min(user.length - 3, 10));

  return `${visibleStart}${maskedSection}${visibleEnd}@${domain}`;
};