import { getConsumptionStatus, type ConsumptionStatus } from '../domain/date-status.ts';
import { rankRecipes, type AvailableFood, type RecipeRecommendation } from '../domain/recipe-ranking.ts';
import type { InventoryItem } from '../inventory/types.ts';

import { basePantryFoodNames, seedRecipes } from './seed.ts';

const urgencyRank: Record<ConsumptionStatus, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  relaxed: 3,
  unknown: 4,
};

function normalizeFoodName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');
}

function toIsoDateOrUndefined(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function getItemConsumptionStatus(item: InventoryItem, referenceDate: Date | string): ConsumptionStatus {
  return getConsumptionStatus(
    {
      recommendedUseByAt: toIsoDateOrUndefined(item.recommendedUseByAt),
      labelExpiryAt: toIsoDateOrUndefined(item.labelExpiryAt),
    },
    referenceDate,
  );
}

/** 같은 이름의 재고 lot가 여러 개면 가장 먼저 확인할 상태 하나를 추천 입력으로 남긴다. */
export function projectAvailableFoods(items: InventoryItem[], referenceDate: Date | string): AvailableFood[] {
  const foodsByName = new Map<string, AvailableFood>();

  items.forEach((item) => {
    const food: AvailableFood = { name: item.name, consumptionStatus: getItemConsumptionStatus(item, referenceDate) };
    const key = normalizeFoodName(item.name);
    const existing = foodsByName.get(key);
    if (!existing || urgencyRank[food.consumptionStatus] < urgencyRank[existing.consumptionStatus]) {
      foodsByName.set(key, food);
    }
  });

  return [...foodsByName.values()];
}

export function getLiveRecipeRecommendations(
  items: InventoryItem[],
  referenceDate: Date | string = new Date(),
): RecipeRecommendation[] {
  return rankRecipes(seedRecipes, projectAvailableFoods(items, referenceDate), basePantryFoodNames).filter(
    (recommendation) => recommendation.availableIngredients.length > 0,
  );
}
