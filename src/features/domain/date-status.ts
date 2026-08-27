export type InventoryDates = {
  /** 포장에 적힌 소비기한·유통기한 등의 원문 날짜를 ISO 날짜로 정규화한 값 */
  labelExpiryAt?: string;
  /** 구매일. 섭취 우선순위 산정에는 사용하지 않는다. */
  purchasedAt?: string;
  /** 조리·보관 시작일. 남은 음식의 맥락을 위해 보관한다. */
  storageStartedAt?: string;
  /** 사용자가 수정할 수 있는 편의용 제안일. 식품 안전을 보장하지 않는다. */
  recommendedUseByAt?: string;
};

export type ConsumptionStatus = 'overdue' | 'today' | 'soon' | 'relaxed' | 'unknown';

function parseIsoDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`ISO 날짜(YYYY-MM-DD)가 필요합니다: ${value}`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error(`존재하지 않는 날짜입니다: ${value}`);
  }
  return parsed;
}

function toIsoDate(value: Date | string) {
  if (typeof value === 'string') {
    parseIsoDate(value);
    return value;
  }
  return value.toISOString().slice(0, 10);
}

/** 권장 섭취 시점이 있으면 우선하고, 없을 때만 포장 표기일을 보조 기준으로 사용한다. */
export function getConsumptionPriorityDate(dates: InventoryDates) {
  return dates.recommendedUseByAt ?? dates.labelExpiryAt ?? null;
}

export function getConsumptionStatus(
  dates: InventoryDates,
  referenceDate: Date | string,
  soonWithinDays = 2,
): ConsumptionStatus {
  const priorityDate = getConsumptionPriorityDate(dates);
  if (!priorityDate) return 'unknown';
  if (!Number.isInteger(soonWithinDays) || soonWithinDays < 0) {
    throw new Error('임박 기준 일수는 0 이상의 정수여야 합니다.');
  }

  const target = parseIsoDate(priorityDate).getTime();
  const reference = parseIsoDate(toIsoDate(referenceDate)).getTime();
  const daysUntil = Math.round((target - reference) / 86_400_000);

  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'today';
  if (daysUntil <= soonWithinDays) return 'soon';
  return 'relaxed';
}
