export type SessionStatus = "checking" | "valid" | "refreshing" | "expired";

type SessionStatusListener = (status: SessionStatus) => void;

let currentStatus: SessionStatus = "checking";
const listeners = new Set<SessionStatusListener>();

export function getSessionStatus(): SessionStatus {
  return currentStatus;
}

export function setSessionStatus(status: SessionStatus): void {
  if (currentStatus === status) return;
  currentStatus = status;
  listeners.forEach((listener) => {
    listener(status);
  });
}

export function subscribeSessionStatus(
  listener: SessionStatusListener,
): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => {
    listeners.delete(listener);
  };
}
