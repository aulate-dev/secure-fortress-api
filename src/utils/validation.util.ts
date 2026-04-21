const containsHtmlLikeChars = (value: string): boolean => /[<>]/.test(value);

export const requireNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  const normalized = value.trim();
  if (containsHtmlLikeChars(normalized)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }

  return normalized;
};

export const requireEmail = (value: unknown): string => {
  const email = requireNonEmptyString(value, "email").toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new Error("email format is invalid");
  }
  return email;
};

export const requirePassword = (value: unknown): string => {
  const password = requireNonEmptyString(value, "password");
  if (password.length < 12) {
    throw new Error("password must be at least 12 characters");
  }
  return password;
};

export const requirePositiveNumber = (value: unknown, fieldName: string): number => {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`);
  }
  return numericValue;
};
