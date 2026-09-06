let unreadCount = 0;
const listeners = new Set<() => void>();

export function getUnreadNotificationCountSnapshot(): number {
  return unreadCount;
}

export function subscribeUnreadNotificationCount(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishUnreadNotificationCount(count: number): void {
  if (unreadCount === count) return;
  unreadCount = count;
  for (const listener of listeners) listener();
}
