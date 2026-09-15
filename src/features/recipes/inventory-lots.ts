import { compareInventoryDates } from '../inventory/dates.ts';
import type { InventoryItem } from '../inventory/types.ts';

export const normalizeFoodName = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');

/** Recommendation and completion share the same deterministic lot priority. */
export function groupInventoryLots(items: InventoryItem[], referenceDate: Date | string) {
  const groups = new Map<string, InventoryItem[]>();
  [...items].sort((a, b) => compareInventoryDates(a, b, referenceDate)
    || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).forEach((item) => {
    const key = normalizeFoodName(item.name);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return groups;
}

export function getCookingCandidates(items: InventoryItem[], foodNames: string[], referenceDate: Date | string) {
  const groups = groupInventoryLots(items, referenceDate);
  return [...new Set(foodNames.map(normalizeFoodName))].flatMap((name) => groups.get(name) ?? []);
}
