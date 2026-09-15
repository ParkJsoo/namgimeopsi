import { getFoodStatus } from '../inventory/dates.ts';
import { rankRecipes, type AvailableFood, type RecipeRecommendation } from '../domain/recipe-ranking.ts';
import type { InventoryItem } from '../inventory/types.ts';

import { groupInventoryLots } from './inventory-lots.ts';
import { basePantryFoodNames, seedRecipes } from './seed.ts';

/** 같은 이름의 재고 lot가 여러 개면 가장 먼저 확인할 상태 하나를 추천 입력으로 남긴다. */
export function projectAvailableFoods(items: InventoryItem[], referenceDate: Date | string): AvailableFood[] {
  return [...groupInventoryLots(items, referenceDate).values()].map(([item]) => ({
    name: item.name,
    consumptionStatus: getFoodStatus(item, referenceDate),
  }));
}

export function getLiveRecipeRecommendations(
  items: InventoryItem[],
  referenceDate: Date | string = new Date(),
): RecipeRecommendation[] {
  return rankRecipes(seedRecipes, projectAvailableFoods(items, referenceDate), basePantryFoodNames).filter(
    (recommendation) => recommendation.availableIngredients.length > 0,
  );
}
