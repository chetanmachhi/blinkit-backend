import { OrderStatus } from "./enums";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const canTransition = (
  from: OrderStatus | string,
  to: OrderStatus | string
): boolean => {
  const allowed = ORDER_TRANSITIONS[from as OrderStatus];
  return Boolean(allowed && allowed.includes(to as OrderStatus));
};

export const nextStatuses = (
  current: OrderStatus | string
): OrderStatus[] => {
  return ORDER_TRANSITIONS[current as OrderStatus] || [];
};

export const isTerminalStatus = (status: OrderStatus | string): boolean => {
  return (
    status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED
  );
};
