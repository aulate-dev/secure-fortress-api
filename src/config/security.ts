const MIN_JWT_SECRET_LENGTH = 32;

export const getJwtSecret = (): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }

  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters to be considered robust`,
    );
  }

  return jwtSecret;
};
