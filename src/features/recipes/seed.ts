import type { Recipe } from '../domain/recipe-ranking.ts';

/**
 * 자유형 생성 없이 데모에서 반복 가능한 추천을 만드는 검수된 소형 카탈로그다.
 * 전체 카탈로그 확장은 별도 작업으로 진행한다.
 */
export const basePantryFoodNames = ['밥', '간장', '소금', '식용유', '마요네즈'];

export const seedRecipes: Recipe[] = [
  {
    id: 'tofu-zucchini-bowl',
    title: '애호박 두부덮밥',
    cookMinutes: 15,
    servings: 1,
    ingredients: [{ foodName: '두부' }, { foodName: '애호박' }, { foodName: '간장' }, { foodName: '밥' }],
  },
  {
    id: 'chicken-mayo-bowl',
    title: '치킨마요 덮밥',
    cookMinutes: 15,
    servings: 1,
    ingredients: [{ foodName: '남은 치킨' }, { foodName: '밥' }, { foodName: '마요네즈' }],
  },
  {
    id: 'dumpling-egg-soup',
    title: '만두 계란국',
    cookMinutes: 20,
    servings: 2,
    ingredients: [{ foodName: '냉동만두' }, { foodName: '계란' }, { foodName: '대파' }, { foodName: '소금' }],
  },
  {
    id: 'egg-soup',
    title: '계란국',
    cookMinutes: 10,
    servings: 1,
    ingredients: [{ foodName: '계란' }, { foodName: '대파' }, { foodName: '소금' }],
  },
  {
    id: 'tofu-salad',
    title: '두부 샐러드',
    cookMinutes: 10,
    servings: 1,
    ingredients: [{ foodName: '두부' }, { foodName: '상추' }, { foodName: '참깨' }, { foodName: '간장' }],
  },
];
