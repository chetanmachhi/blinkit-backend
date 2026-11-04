import {
  OrderStatus,
  canTransition as sharedCanTransition,
  isTerminalStatus as sharedIsTerminalStatus,
  ORDER_TRANSITIONS,
} from "../../../shared";
import { AppError } from "../utils/AppError";

export const validateTransition = (
  currentStatus: string,
  newStatus: string
): void => {
  if (!sharedCanTransition(currentStatus, newStatus)) {
    throw new AppError(
      `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      409
    );
  }
};

export const isTerminalStatus = (status: string): boolean => {
  return sharedIsTerminalStatus(status);
};
