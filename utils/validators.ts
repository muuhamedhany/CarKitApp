export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string) => {
  return /^\+?[\d\s-]{10,}$/.test(phone);
};

export const isStrongPassword = (password: string) => {
  return password.length >= 8;
};
