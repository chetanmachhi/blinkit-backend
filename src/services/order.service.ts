import { OrderStatus } from "../constants/enums";
import { AppError } from "../utils/AppError";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
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

export const validateTransition = (
  currentStatus: string,
  newStatus: string
): void => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      409
    );
  }
};

export const isTerminalStatus = (status: string): boolean => {
  return (
    status === OrderStatus.DELIVERED ||
    status === OrderStatus.CANCELLED
  );
};
