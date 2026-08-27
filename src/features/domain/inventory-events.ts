export type Quantity = {
  amount: number;
  unit: string;
};

export type InventoryEvent =
  | {
      type: 'intake';
      quantity: Quantity;
      occurredAt: string;
      note?: string;
    }
  | {
      type: 'consume';
      quantity: Quantity;
      occurredAt: string;
      note?: string;
    }
  | {
      type: 'adjust';
      remainingQuantity: Quantity;
      occurredAt: string;
      note?: string;
    }
  | {
      type: 'discard';
      occurredAt: string;
      note?: string;
    };

function assertQuantity(quantity: Quantity) {
  if (!Number.isFinite(quantity.amount) || quantity.amount < 0) {
    throw new Error('수량은 0 이상의 유한한 숫자여야 합니다.');
  }
  if (!quantity.unit.trim()) {
    throw new Error('수량 단위가 필요합니다.');
  }
}

function assertMatchingUnit(current: Quantity, next: Quantity) {
  if (current.unit !== next.unit) {
    throw new Error(`단위가 일치하지 않습니다: ${current.unit} / ${next.unit}`);
  }
}

/**
 * 이벤트 원장을 순서대로 적용해 현재 잔량을 계산한다.
 * 생활 단위의 의미를 추측하거나 서로 다른 단위를 자동 변환하지 않는다.
 */
export function calculateRemainingQuantity(initial: Quantity, events: InventoryEvent[]): Quantity {
  assertQuantity(initial);

  return events.reduce<Quantity>((current, event) => {
    switch (event.type) {
      case 'intake': {
        assertQuantity(event.quantity);
        assertMatchingUnit(current, event.quantity);
        return { ...current, amount: current.amount + event.quantity.amount };
      }
      case 'consume': {
        assertQuantity(event.quantity);
        assertMatchingUnit(current, event.quantity);
        if (event.quantity.amount > current.amount) {
          throw new Error('현재 잔량보다 많은 수량을 소비할 수 없습니다.');
        }
        return { ...current, amount: current.amount - event.quantity.amount };
      }
      case 'adjust':
        assertQuantity(event.remainingQuantity);
        assertMatchingUnit(current, event.remainingQuantity);
        return { ...event.remainingQuantity };
      case 'discard':
        return { ...current, amount: 0 };
    }
  }, { ...initial });
}

export function isDepleted(quantity: Quantity) {
  assertQuantity(quantity);
  return quantity.amount === 0;
}
