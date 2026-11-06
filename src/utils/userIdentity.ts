const STORAGE_KEY = 'talking-avatar.user-id';

/** Dummy user identifier for the `x-user-id` header. Just a random number,
 *  stored in localStorage so the same browser keeps the same id across
 *  sessions. Will be replaced by real auth later. */

export function getUserId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const userId = String(Math.random() * 100_000);
  localStorage.setItem(STORAGE_KEY, userId);
  return userId;
}
