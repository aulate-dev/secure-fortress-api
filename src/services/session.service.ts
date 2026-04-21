interface SessionState {
  userId: number;
  sessionId: string;
  lastActivity: number;
}

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const sessionsByUserId = new Map<number, SessionState>();

export const registerSession = (userId: number, sessionId: string): void => {
  sessionsByUserId.set(userId, {
    userId,
    sessionId,
    lastActivity: Date.now(),
  });
};

export const touchSession = (userId: number, sessionId: string): "ok" | "expired" | "invalid" => {
  const currentSession = sessionsByUserId.get(userId);
  if (!currentSession || currentSession.sessionId !== sessionId) {
    return "invalid";
  }

  const now = Date.now();
  if (now - currentSession.lastActivity > SESSION_TIMEOUT_MS) {
    sessionsByUserId.delete(userId);
    return "expired";
  }

  currentSession.lastActivity = now;
  sessionsByUserId.set(userId, currentSession);
  return "ok";
};

export const invalidateSession = (userId: number): void => {
  sessionsByUserId.delete(userId);
};
