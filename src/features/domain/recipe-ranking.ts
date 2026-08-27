export type RecipeIngredient = {
  foodName: string;
  required?: boolean;
};

export type Recipe = {
  id: string;
  title: string;
  cookMinutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
};

export type AvailableFood = {
  name: string;
  consumptionStatus: 'overdue' | 'today' | 'soon' | 'relaxed' | 'unknown';
};

export type RecipeRecommendation = {
  recipe: Recipe;
  score: number;
  availableIngredients: string[];
  missingIngredients: string[];
  soonToUseIngredients: string[];
  reason: string;
};

const coverageWeight = 60;
const soonToUseWeight = 12;
const missingIngredientPenalty = 18;
const cookTimePenaltyPerFiveMinutes = 1;

function normalizeFoodName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');
}

function buildReason(soonToUseIngredients: string[], missingIngredients: string[], cookMinutes: number) {
  const soonToUseLabel =
    soonToUseIngredients.length === 1
      ? soonToUseIngredients[0]
      : soonToUseIngredients.length === 2
        ? soonToUseIngredients.join('와 ')
        : `${soonToUseIngredients.slice(0, 2).join(', ')} 등`;
  const usage = soonToUseIngredients.length
    ? `${soonToUseLabel}을(를) 먼저 쓰기 좋아요.`
    : '보유 재료를 활용하기 좋아요.';
  const missing = missingIngredients.length ? ` 부족 재료: ${missingIngredients.join(', ')}.` : ' 부족 재료가 없어요.';
  return `${usage}${missing} ${cookMinutes}분 예상이에요.`;
}

/**
 * 자유형 생성 없이 같은 입력에는 언제나 같은 순서와 근거를 반환한다.
 * 기본 보유 재료는 부족 재료 페널티와 충족도에서 제외한다.
 */
export function rankRecipes(
  recipes: Recipe[],
  availableFoods: AvailableFood[],
  basePantryFoodNames: string[] = [],
): RecipeRecommendation[] {
  const availableByName = new Map(availableFoods.map((food) => [normalizeFoodName(food.name), food]));
  const pantryNames = new Set(basePantryFoodNames.map(normalizeFoodName));

  return recipes
    .map((recipe) => {
      const requiredIngredients = recipe.ingredients.filter((ingredient) => ingredient.required !== false);
      const scoredIngredients = requiredIngredients.filter(
        (ingredient) => !pantryNames.has(normalizeFoodName(ingredient.foodName)),
      );
      const availableIngredients = scoredIngredients.filter((ingredient) =>
        availableByName.has(normalizeFoodName(ingredient.foodName)),
      );
      const missingIngredients = scoredIngredients
        .filter((ingredient) => !availableByName.has(normalizeFoodName(ingredient.foodName)))
        .map((ingredient) => ingredient.foodName);
      const soonToUseIngredients = availableIngredients
        .filter((ingredient) => {
          const status = availableByName.get(normalizeFoodName(ingredient.foodName))?.consumptionStatus;
          return status === 'overdue' || status === 'today' || status === 'soon';
        })
        .map((ingredient) => ingredient.foodName);
      const coverage = scoredIngredients.length ? availableIngredients.length / scoredIngredients.length : 1;
      const score = Math.round(
        coverage * coverageWeight +
          soonToUseIngredients.length * soonToUseWeight -
          missingIngredients.length * missingIngredientPenalty -
          Math.ceil(recipe.cookMinutes / 5) * cookTimePenaltyPerFiveMinutes,
      );

      return {
        recipe,
        score,
        availableIngredients: availableIngredients.map((ingredient) => ingredient.foodName),
        missingIngredients,
        soonToUseIngredients,
        reason: buildReason(soonToUseIngredients, missingIngredients, recipe.cookMinutes),
      };
    })
    .filter((recommendation) => recommendation.missingIngredients.length <= 2)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.missingIngredients.length - right.missingIngredients.length ||
        left.recipe.cookMinutes - right.recipe.cookMinutes ||
        left.recipe.id.localeCompare(right.recipe.id),
    )
    .slice(0, 3);
}
