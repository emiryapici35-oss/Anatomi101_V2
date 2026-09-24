export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function previousLocalDateKey(date = new Date()): string {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return localDateKey(previous);
}

export function reconcileStoredStreak(): number {
  if (typeof window === "undefined") return 0;
  const current = Math.max(0, Number(localStorage.getItem("anatomy101:streak") || 0) || 0);
  const lastCorrect = localStorage.getItem("anatomy101:last-correct-date");
  const stillActive = lastCorrect === localDateKey() || lastCorrect === previousLocalDateKey();
  const next = stillActive ? current : 0;
  if (next !== current) localStorage.setItem("anatomy101:streak", "0");
  return next;
}

export function stableDailySeed(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
